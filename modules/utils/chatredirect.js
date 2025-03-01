const { sleep } = require("./sleep");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");
const { CONFIG } = require("./config");

/**
 * Background service to monitor a source channel and move messages to a destination channel
 * @param {Object} client Discord client
 */
const moveMessages = async (client) => {
  console.log("Starting chat redirection service...");

  // Initialize tracking variables
  let lastProcessedId = null;
  let consecutiveErrors = 0;
  const MAX_ERRORS = 5;

  // Main service loop
  while (true) {
    try {
      // Get channel objects
      const sourceChannel = await getChannel(
        client,
        CONFIG.channels.applicationsSource
      );
      const destinationChannel = await getChannel(
        client,
        CONFIG.channels.applicationsDestination
      );

      if (!sourceChannel || !destinationChannel) {
        console.error(
          "Failed to get source or destination channel, retrying in 30 seconds"
        );
        await sleep(30000);
        continue;
      }

      // Reset error counter when channels are successfully fetched
      consecutiveErrors = 0;

      // Fetch messages from source channel
      const options = { limit: 25 }; // Reduced batch size for better performance
      if (lastProcessedId) {
        options.after = lastProcessedId; // Get messages newer than last processed
      }

      const messages = await sourceChannel.messages.fetch(options);

      // If no new messages, wait and continue
      if (messages.size === 0) {
        await sleep(10000);
        continue;
      }

      // Sort messages by creation time (oldest first)
      const sortedMessages = Array.from(messages.values()).sort(
        (a, b) => a.createdTimestamp - b.createdTimestamp
      );

      // Process each message
      for (const message of sortedMessages) {
        try {
          // Skip messages from ignored users
          if (message.author.id === "339703905166426114") {
            continue;
          }

          // Process message based on content
          if (message.content) {
            if (isRaiderIOLink(message.content)) {
              await processRaiderIOApplication(message, destinationChannel);
            } else {
              // Regular message
              await destinationChannel.send(
                `${message.author}\n${message.content}`
              );
            }
          }

          // Forward any embeds
          if (message.embeds.length > 0) {
            await destinationChannel.send({ embeds: message.embeds });
          }

          // Delete the original message and notify the author
          await message.delete();
          await message.author
            .send({
              content: "Salam, Apply shoma sabt shod!",
              allowedMentions: { parse: [] }, // Prevent pings
            })
            .catch(() => {
              // Ignore errors from sending DMs - some users may have them disabled
            });

          // Update last processed ID
          lastProcessedId = message.id;
        } catch (error) {
          console.error(`Error processing message ${message.id}:`, error);
          // Continue with next message even if one fails
        }
      }

      // Wait before next batch
      await sleep(5000);
    } catch (error) {
      console.error("Error in chat redirection service:", error);

      // Track consecutive errors and increase wait time accordingly
      consecutiveErrors++;
      const waitTime = Math.min(30000 * consecutiveErrors, 300000); // Max 5 minutes

      // If too many consecutive errors, log a more severe warning
      if (consecutiveErrors >= MAX_ERRORS) {
        console.error(
          `WARNING: Chat redirection encountered ${consecutiveErrors} consecutive errors!`
        );
      }

      await sleep(waitTime);
    }
  }
};

/**
 * Helper function to get a channel by ID with error handling
 * @param {Object} client Discord client
 * @param {String} channelId Channel ID to fetch
 * @returns {Object|null} Channel object or null if not found
 */
async function getChannel(client, channelId) {
  try {
    // Check cache first
    let channel = client.channels.cache.get(channelId);
    if (!channel) {
      // Fetch from API if not in cache
      channel = await client.channels.fetch(channelId);
    }
    return channel;
  } catch (error) {
    console.error(`Failed to fetch channel ${channelId}:`, error);
    return null;
  }
}

/**
 * Checks if a message contains a Raider.io profile link
 * @param {String} content Message content
 * @returns {Boolean} Whether content contains a Raider.io link
 */
const isRaiderIOLink = (content) => {
  return content.includes("raider.io/characters/");
};

/**
 * Parses character info from a Raider.io link
 * @param {String} link Raider.io link
 * @returns {Object} Character info (region, realm, character)
 */
const parseRaiderIOLink = (link) => {
  const regex = /raider\.io\/characters\/(\w+)\/([\w-]+)\/([\w-]+)/;
  const match = link.match(regex);
  if (match) {
    return {
      region: match[1],
      realm: match[2],
      character: match[3],
    };
  }
  return {};
};

/**
 * Fetches mythic+ score from Raider.io API with retry logic
 * @param {String} character Character name
 * @param {String} realm Realm name
 * @returns {Number|null} Mythic+ score or null if not found
 */
const fetchMythicScore = async (character, realm) => {
  const MAX_RETRIES = 3;
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    try {
      const url = `https://raider.io/api/v1/characters/profile?region=eu&realm=${realm}&name=${character}&fields=mythic_plus_scores_by_season:current`;

      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        timeout: 5000, // 5 second timeout
      });

      // Handle HTTP errors
      if (!response.ok) {
        throw new Error(
          `HTTP error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const mythicScore = data.mythic_plus_scores_by_season[0]?.scores?.all;

      if (mythicScore !== undefined) {
        return mythicScore;
      } else {
        console.warn("No Mythic Plus score found for this character.");
        return null;
      }
    } catch (error) {
      retryCount++;
      console.error(
        `Raider.io API call failed (attempt ${retryCount}/${MAX_RETRIES}):`,
        error
      );

      if (retryCount < MAX_RETRIES) {
        // Wait longer between each retry
        await sleep(1000 * retryCount);
      }
    }
  }

  return null; // Return null after all retries fail
};

/**
 * Processes an application with a Raider.io link
 * @param {Object} message Original message
 * @param {Object} destinationChannel Channel to send processed application to
 */
async function processRaiderIOApplication(message, destinationChannel) {
  try {
    const { character, realm } = parseRaiderIOLink(message.content);

    if (!character || !realm) {
      await destinationChannel.send(
        `${message.author}\nInvalid Raider.io link.`
      );
      return;
    }

    // Try to fetch score with retries
    const mythicScore = await fetchMythicScore(character, realm);

    if (mythicScore === null) {
      await destinationChannel.send(
        `${message.author}\nFailed to fetch Mythic Plus score. Please try again later.`
      );
      return;
    }

    // Create structured embed for the application
    const applicationEmbed = new EmbedBuilder()
      .setTitle(`New Application: ${character}-${realm}`)
      .setDescription(`Raider.io Link: ${message.content}`)
      .addFields(
        { name: "Mythic+ Score", value: mythicScore.toString(), inline: true },
        { name: "Applicant", value: `<@${message.author.id}>`, inline: true }
      )
      .setColor(getScoreColor(mythicScore))
      .setTimestamp()
      .setFooter({ text: "Click buttons below to assign appropriate role" });

    // Create tier 1 rating buttons
    const buttons1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("role_3500")
        .setLabel("3500+")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("role_3400")
        .setLabel("3400+")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("role_3300")
        .setLabel("3300+")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("role_3200")
        .setLabel("3200+")
        .setStyle(ButtonStyle.Primary)
    );

    // Create tier 2 rating buttons
    const buttons2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("role_3100")
        .setLabel("3100+")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("role_3000")
        .setLabel("3000+")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("role_2900")
        .setLabel("2900+")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("role_2800")
        .setLabel("2800+")
        .setStyle(ButtonStyle.Primary)
    );

    // Create reject button
    const rejectButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("reject_application")
        .setLabel("Reject")
        .setStyle(ButtonStyle.Danger)
    );

    // Send the application with buttons
    await destinationChannel.send({
      embeds: [applicationEmbed],
      components: [buttons1, buttons2, rejectButton],
    });
  } catch (error) {
    console.error("Error processing Raider.io application:", error);
    await destinationChannel.send(
      `${message.author}\nAn error occurred while processing your application.`
    );
  }
}

/**
 * Gets appropriate color based on M+ score
 * @param {Number} score M+ score
 * @returns {Number} Discord color value
 */
function getScoreColor(score) {
  if (score >= 3500) return 0x9c27b0; // Purple for highest tier
  if (score >= 3200) return 0x2196f3; // Blue
  if (score >= 3000) return 0x4caf50; // Green
  if (score >= 2800) return 0xffc107; // Amber
  return 0x607d8b; // Blue Grey for lower scores
}

/**
 * Gets the appropriate role ID based on score
 * @param {Number} score M+ score
 * @returns {String|null} Role ID or null if no match
 */
const getRoleID = (score) => {
  // Use roles from config
  const tiers = CONFIG.roles.ratingTiers;

  if (score >= 3500) return tiers["3500"];
  if (score >= 3400) return tiers["3400"];
  if (score >= 3300) return tiers["3300"];
  if (score >= 3200) return tiers["3200"];
  if (score >= 3100) return tiers["3100"];
  if (score >= 3000) return tiers["3000"];
  if (score >= 2900) return tiers["2900"];
  if (score >= 2800) return tiers["2800"];

  return null;
};

module.exports = { moveMessages, fetchMythicScore, getRoleID };
