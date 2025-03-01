const { sleep } = require("./sleep");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

const moveMessages = async (client) => {
  while (true) {
    const sourceChannelId = "1231657838863192136";
    const destinationChannelId = "1254199483726565486";
    const ignoreUserId = "339703905166426114";

    let sourceChannel = client.channels.cache.get(sourceChannelId);
    if (!sourceChannel) {
      try {
        sourceChannel = await client.channels.fetch(sourceChannelId);
      } catch (error) {
        console.error("Failed to fetch source channel:", error);
        return;
      }
    }

    let destinationChannel = client.channels.cache.get(destinationChannelId);
    if (!destinationChannel) {
      try {
        destinationChannel = await client.channels.fetch(destinationChannelId);
      } catch (error) {
        console.error("Failed to fetch destination channel:", error);
        return;
      }
    }

    let lastId;
    const options = { limit: 100 };
    if (lastId) {
      options.before = lastId;
    }

    const messages = await sourceChannel.messages.fetch(options);
    if (messages.size === 0) {
      await sleep(10000);
      continue;
    }

    for (const message of messages.values()) {
      try {
        const author = message.author;
        const authorID = author.id;

        if (message.content && authorID !== ignoreUserId) {
          if (isRaiderIOLink(message.content)) {
            const { character, realm } = parseRaiderIOLink(message.content);

            if (character && realm) {
              let mythicScore = null;

              for (let i = 0; i < 10; i++) {
                mythicScore = await fetchMythicScore(character, realm);
                if (mythicScore) break; // Exit the loop if a valid score is fetched
              }

              if (mythicScore !== null) {
                // Create buttons for each role
                const buttons = new ActionRowBuilder().addComponents(
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

                const rejectButton = new ActionRowBuilder().addComponents(
                  new ButtonBuilder()
                    .setCustomId("reject_application")
                    .setLabel("Reject")
                    .setStyle(ButtonStyle.Danger)
                );

                await destinationChannel.send({
                  content: `${author}\n${message.content}\nMythic+ Score: ${mythicScore}\nPlease select a role to assign:`,
                  components: [buttons, buttons2, rejectButton],
                });
              } else {
                await destinationChannel.send(
                  `${author}\nFailed to fetch Mythic Plus score. Please try again later.`
                );
              }
            } else {
              await destinationChannel.send(
                `${author}\nInvalid Raider.io link.`
              );
            }
          } else {
            await destinationChannel.send(`${author}\n${message.content}`);
          }
        }

        if (message.embeds.length > 0) {
          await destinationChannel.send({ embeds: message.embeds });
        }

        if (authorID !== ignoreUserId) {
          await message.delete();
          author.send({ content: "Salam, Apply shoma sabt shod!" });
        }
      } catch (error) {
        console.error(`Failed to move message ${message.id}:`, error);
      }
    }

    lastId = messages.last().id;
    await sleep(10000);
  }
};

// Helper function to check if the message contains a Raider.io link
const isRaiderIOLink = (content) => {
  return content.includes("raider.io/characters/");
};

// Helper function to parse character name and realm from a Raider.io link
const parseRaiderIOLink = (link) => {
  const regex = /raider\.io\/characters\/(\w+)\/([\w-]+)\/([\w-]+)/;
  const match = link.match(regex);
  if (match) {
    return { region: match[1], realm: match[2], character: match[3] };
  }
  return {};
};

// Function to fetch Mythic score from Raider.io API
const fetchMythicScore = async (character, realm) => {
  try {
    const response = await fetch(
      `https://raider.io/api/v1/characters/profile?region=eu&realm=${realm}&name=${character}&fields=mythic_plus_scores_by_season:current`
    );
    const data = await response.json();

    const mythicScore = data.mythic_plus_scores_by_season[0]?.scores?.all;
    if (mythicScore !== undefined) {
      return mythicScore;
    } else {
      console.error("No Mythic Plus score found for this character.");
      return null;
    }
  } catch (error) {
    console.error("Failed to fetch Mythic score from Raider.io:", error);
    return null;
  }
};

// Helper function to get the appropriate role ID based on score
const getRoleID = (score) => {
  if (score >= 3500) return "1300843433774153789"; //Rank 3500+
  if (score >= 3400) return "1254443951004454942"; //Rank 3400+
  if (score >= 3300) return "1302240179670749214"; //Rank 3300+
  if (score >= 3200) return "1301951462032801904"; //Rank 3200+
  if (score >= 3100) return "1302240266450636840"; //Rank 3100
  if (score >= 3000) return "1254217511507857429"; //Rank 3000
  if (score >= 2900) return "1302240333639192618"; //Rank 2900
  if (score >= 2800) return "1301946977956921456"; //Rank 2800

  return null;
};

module.exports = { moveMessages };
