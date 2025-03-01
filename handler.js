const { balance } = require("./modules/utils/checkbalance");
const { currency, payment } = require("./modules/utils/currency");
const { mplus } = require("./modules/utils/mplus");
const { rename } = require("./modules/utils/rename");
const { attendance } = require("./modules/utils/attendance");
const { transaction } = require("./modules/utils/transaction");
const { CONFIG } = require("./modules/utils/config");
const dotenv = require("dotenv");
const fs = require("fs");
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  AttachmentBuilder,
  EmbedBuilder,
} = require("discord.js");
const path = require("path");

dotenv.config();

const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.BOT_TOKEN;

/**
 * Helper function to check if user has a specific role
 * @param {Object} message Discord message object
 * @param {String} roleId Role ID to check for
 * @returns {Boolean} Whether user has the role
 */
const hasRole = async (message, roleId) => {
  try {
    const member = await message.guild.members.fetch(message.author.id);
    return member.roles.cache.has(roleId);
  } catch (error) {
    console.error(`Error checking role ${roleId}:`, error);
    return false;
  }
};

/**
 * Main message handler for the bot
 * @param {Object} message Discord message object
 * @param {Object} client Discord client
 */
const handler = async (message, client) => {
  try {
    // Skip messages from bots to prevent feedback loops
    if (message.author.bot) return;

    // Handle transaction processing
    if (
      message.channel.id === CONFIG.channels.payment &&
      message.author.id === "1318601819273826334"
    ) {
      await transaction(message, client);
      return;
    }

    // Handle balance command with proper error handling
    if (
      message.channel.id === CONFIG.channels.balanceCommand &&
      CONFIG.commandPrefixes.balance.includes(message.content.toLowerCase())
    ) {
      console.log(`Balance command triggered by ${message.author.tag}`);
      try {
        await balance(message);
      } catch (error) {
        console.error("Error processing balance command:", error);
        await message
          .reply({
            content:
              "There was an error retrieving your balance information. Please try again later.",
          })
          .catch((e) => console.error("Couldn't send error message:", e));
      }
      return;
    }

    // Handle currency command
    if (
      message.channel.id === CONFIG.channels.payment &&
      message.author.id === "1263138676196638720"
    ) {
      await currency(message);
      return;
    }

    // Handle m+ booking command
    if (message.channel.id === CONFIG.channels.mplusBooking) {
      if (await hasRole(message, CONFIG.roles.admin)) {
        await mplus(message);
      } else {
        await message.reply("You don't have permission to use this command.");
      }
      return;
    }

    // Handle attendance command
    if (
      message.channel.parent?.id === "1264685805293535313" &&
      message.content.startsWith(CONFIG.commandPrefixes.mplus)
    ) {
      if (await hasRole(message, CONFIG.roles.admin)) {
        await attendance(message);
      } else {
        await message.reply("You don't have permission to use this command.");
      }
      return;
    }

    // Handle done command (transcript and channel deletion)
    if (
      message.channel.parent?.id === "1264685805293535313" &&
      message.content.startsWith(CONFIG.commandPrefixes.done)
    ) {
      if (await hasRole(message, CONFIG.roles.admin)) {
        await handleDoneCommand(message, client);
      } else {
        await message.reply("You don't have permission to use this command.");
      }
      return;
    }

    // Handle rename command
    if (message.content.startsWith(CONFIG.commandPrefixes.rename)) {
      await rename(message);
      return;
    }
  } catch (error) {
    console.error("Error in message handler:", error);
    // Don't respond to errors here to prevent error feedback loops
  }
};

/**
 * Handles the !done command - creates transcript and deletes channel
 * @param {Object} message Discord message object
 * @param {Object} client Discord client
 */
async function handleDoneCommand(message, client) {
  try {
    // Notify users that the channel will be deleted
    const notificationEmbed = new EmbedBuilder()
      .setTitle("Channel Closing")
      .setDescription("This channel will be deleted in 60 seconds.")
      .setColor("#FF0000")
      .setTimestamp();

    await message.channel.send({ embeds: [notificationEmbed] });

    // Create transcript
    const transcriptAttachment = await createTranscript(message.channel);

    // Set a timeout to delete the channel and save transcript
    setTimeout(async () => {
      try {
        // Send transcript to archive channel
        const targetChannel = await client.channels.fetch(
          CONFIG.channels.transcriptDestination
        );

        await targetChannel.send({
          content: `**Channel Transcript**: ${message.channel.name}`,
          files: [transcriptAttachment],
        });

        // Delete the temporary transcript file
        fs.unlinkSync(transcriptAttachment.attachment);

        // Notify users in guild log about channel deletion
        console.log(
          `Channel ${message.channel.name} deleted after transcript was saved`
        );

        // Delete the channel
        await message.channel.delete();
      } catch (error) {
        console.error("Error during channel deletion:", error);
        await message.channel.send(
          "There was an error deleting this channel. Please contact an admin."
        );
      }
    }, 60000); // 60 seconds
  } catch (error) {
    console.error("Error handling done command:", error);
    await message.reply("There was an error processing your request.");
  }
}

/**
 * Creates an HTML transcript of channel messages
 * @param {Object} channel Discord channel to create transcript from
 * @returns {Object} AttachmentBuilder with transcript file
 */
async function createTranscript(channel) {
  try {
    // Fetch messages (up to 100, Discord API limit)
    let messages = await channel.messages.fetch({ limit: 100 });
    messages = Array.from(messages.values()).reverse();

    // Start building HTML content
    let transcript = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Transcript for ${channel.name}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              background-color: #36393f; 
              color: #dcddde; 
              padding: 20px;
              max-width: 1200px;
              margin: 0 auto;
            }
            .header {
              background-color: #2f3136;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              border-bottom: 3px solid #7289da;
            }
            .message { 
              margin-bottom: 20px; 
              padding: 10px; 
              background-color: #2f3136; 
              border-radius: 5px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.12);
              transition: transform 0.2s ease;
            }
            .message:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 6px rgba(0,0,0,0.15);
            }
            .author-container {
              display: flex;
              align-items: center;
              margin-bottom: 5px;
            }
            .author { 
              font-weight: bold; 
              color: #7289da; 
            }
            .timestamp { 
              color: #72767d; 
              font-size: 0.75em; 
              margin-left: 10px; 
            }
            .content { 
              margin-top: 5px;
              word-wrap: break-word; 
            }
            .embed { 
              margin-top: 10px; 
              border-left: 4px solid #4f545c; 
              padding-left: 10px; 
              background-color: #36393f; 
              border-radius: 5px; 
            }
            .embed-title { 
              font-weight: bold; 
              color: #ffffff; 
            }
            .embed-field { 
              margin-top: 5px; 
            }
            .embed-field-name { 
              font-weight: bold; 
            }
            .embed-footer { 
              margin-top: 10px; 
              font-size: 0.75em; 
              color: #72767d; 
            }
            img, video {
              max-width: 100%;
              border-radius: 3px;
            }
            code {
              background-color: #2b2d31;
              padding: 2px 5px;
              border-radius: 3px;
              font-family: 'Consolas', 'Courier New', monospace;
            }
            pre {
              background-color: #2b2d31;
              padding: 10px;
              border-radius: 5px;
              overflow-x: auto;
              font-family: 'Consolas', 'Courier New', monospace;
            }
            a {
              color: #00b0f4;
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Transcript for ${channel.name}</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
            <p>Total messages: ${messages.length}</p>
          </div>
    `;

    // Process each message
    messages.forEach((message) => {
      const iranTime = new Date(message.createdAt).toLocaleString("fa-IR", {
        timeZone: "Asia/Tehran",
      });

      // Format message content with links
      const formattedContent = message.content
        .replace(
          /https?:\/\/[^\s]+/g,
          (url) => `<a href="${url}" target="_blank">${url}</a>`
        )
        .replace(/\n/g, "<br>");

      transcript += `
        <div class="message">
          <div class="author-container">
            <span class="author">${message.author.tag}</span>
            <span class="timestamp">${iranTime}</span>
          </div>
          <div class="content">${formattedContent || "[No text content]"}</div>
      `;

      // Add embeds if present
      if (message.embeds.length > 0) {
        message.embeds.forEach((embed) => {
          transcript += `
            <div class="embed">
              ${
                embed.title
                  ? `<div class="embed-title">${embed.title}</div>`
                  : ""
              }
              ${
                embed.description
                  ? `<div class="embed-description">${embed.description}</div>`
                  : ""
              }
              ${
                embed.fields.length > 0
                  ? embed.fields
                      .map(
                        (field) => `
                <div class="embed-field">
                  <div class="embed-field-name">${field.name}</div>
                  <div class="embed-field-value">${field.value}</div>
                </div>
              `
                      )
                      .join("")
                  : ""
              }
              ${
                embed.footer
                  ? `<div class="embed-footer">${embed.footer.text}</div>`
                  : ""
              }
              ${
                embed.timestamp
                  ? `<div class="embed-timestamp">${new Date(
                      embed.timestamp
                    ).toLocaleString("fa-IR", {
                      timeZone: "Asia/Tehran",
                    })}</div>`
                  : ""
              }
            </div>
          `;
        });
      }

      // Add attachments if present
      if (message.attachments.size > 0) {
        message.attachments.forEach((attachment) => {
          if (attachment.contentType?.startsWith("image/")) {
            transcript += `<div class="attachment"><img src="${attachment.url}" alt="Image attachment" /></div>`;
          } else if (attachment.contentType?.startsWith("video/")) {
            transcript += `<div class="attachment"><video controls src="${attachment.url}"></video></div>`;
          } else {
            transcript += `<div class="attachment"><a href="${attachment.url}" target="_blank">Download attachment: ${attachment.name}</a></div>`;
          }
        });
      }

      transcript += `</div>`;
    });

    // Close HTML document
    transcript += `
        </body>
      </html>
    `;

    // Generate unique filename
    const fileName = `transcript-${channel.id}-${Date.now()}.html`;
    const filePath = path.join(process.cwd(), fileName);

    // Save transcript to file
    fs.writeFileSync(filePath, transcript);

    // Return attachment builder
    return new AttachmentBuilder(filePath, { name: fileName });
  } catch (error) {
    console.error("Error creating transcript:", error);
    throw error;
  }
}

module.exports = { handler };
