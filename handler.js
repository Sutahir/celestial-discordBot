const { balance } = require("./modules/utils/submit");
const { currency, payment } = require("./modules/utils/currency");
const { mplus } = require("./modules/utils/mplus");
const { rename } = require("./modules/utils/rename");
const { attendance } = require("./modules/utils/attendance");
const { transaction } = require("./modules/utils/transaction");
const dotenv = require("dotenv");

dotenv.config();

const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.BOT_TOKEN;
const fs = require("fs");
const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  AttachmentBuilder, EmbedBuilder
} = require("discord.js");

// Helper function to check if user has role
const hasRole = async (message, roleId) => {
  const member = await message.guild.members.fetch(message.author.id);
  return member.roles.cache.has(roleId);
};

const handler = async (message, client) => {
  // Transaction processing for specific channel and author
  if (message.channel.id === "1318601642144170155" && message.author.id == "1318601819273826334") {
    await transaction(message, client);
  }

  // Balance command in specific channel
  if (
    message.channel.id === "1262534348993855619" &&
    ["!balance", "!b", ".b", ".balance"].includes(
      message.content.toLocaleLowerCase()
    )
  ) {
    console.log("new interaction");
    balance(message);
  }

  // Currency command for specific channel and author
  if (
    message.channel.id === "1263138558139564163" &&
    message.author.id == "1263138676196638720"
  ) {
    currency(message);
  }

  // Book Mplus command with role check
  if (message.channel.id === "1301933098426171402") {
    if (await hasRole(message, "1254054223046508604")) {
      await mplus(message);
    }
  }

  // Attendance command in specific channel with role check
  if (
    message.channel.parent.id === "1264685805293535313" &&
    message.content.startsWith("!m")
  ) {
    if (await hasRole(message, "1254054223046508604")) {
      await attendance(message);
    }
  }

  // Handle !done command with transcript creation and channel deletion
  if (
    message.channel.parent.id === "1264685805293535313" &&
    message.content.startsWith("!done")
  ) {
    if (await hasRole(message, "1254054223046508604")) {
      // Fetch messages from the channel
      const transcriptAttachment = await createTranscript(message.channel);

      await message.channel.send("Deleting the chat in 60 seconds!");

      setTimeout(async () => {
        try {
          const targetChannel = await client.channels.fetch("1264699919415906444");
          await targetChannel.send({
            content: message.channel.name,
            files: [transcriptAttachment],
          });

          // Delete the temporary transcript file
          fs.unlinkSync(transcriptAttachment.attachment);

          await message.channel.delete();
        } catch (error) {
          console.error("Error in setTimeout function:", error);
        }
      }, 60000);
    }
  }

  // Rename command handling
  if (message.content.startsWith("!rename")) {
    await rename(message);
  }
};

// Function to create a transcript from messages in a channel
async function createTranscript(channel) {
  let messages = await channel.messages.fetch({ limit: 100 });
  messages = Array.from(messages.values()).reverse();
  let transcript = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background-color: #36393f; color: #dcddde; padding: 20px; }
          .message { margin-bottom: 20px; padding: 10px; background-color: #2f3136; border-radius: 5px; }
          .author { font-weight: bold; color: #7289da; }
          .timestamp { color: gray; font-size: 0.75em; margin-left: 10px; }
          .content { margin-top: 5px; }
          .embed { margin-top: 10px; border-left: 4px solid #4f545c; padding-left: 10px; background-color: #36393f; border-radius: 5px; }
          .embed-title { font-weight: bold; color: #ffffff; }
          .embed-field { margin-top: 5px; }
          .embed-field-name { font-weight: bold; }
          .embed-footer { margin-top: 10px; font-size: 0.75em; color: gray; }
        </style>
      </head>
      <body>
        <h1>Transcript for ${channel.name}</h1>
  `;

  messages.forEach((message) => {
    const iranTime = new Date(message.createdAt).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" });
    transcript += `
      <div class="message">
        <div>
          <span class="author">${message.author.tag}</span>
          <span class="timestamp">${iranTime}</span>
        </div>
        <div class="content">${message.content}</div>
    `;
    if (message.embeds.length > 0) {
      message.embeds.forEach((embed, index) => {
        transcript += `
          <div class="embed">
            ${embed.title ? `<div class="embed-title">${embed.title}</div>` : ""}
            ${embed.description ? `<div class="embed-description">${embed.description}</div>` : ""}
            ${embed.fields.length > 0 ? embed.fields.map(field => `
              <div class="embed-field">
                <div class="embed-field-name">${field.name}</div>
                <div class="embed-field-value">${field.value}</div>
              </div>
            `).join("") : ""}
            ${embed.footer ? `<div class="embed-footer">${embed.footer.text}</div>` : ""}
            ${embed.timestamp ? `<div class="embed-timestamp">${new Date(embed.timestamp).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" })}</div>` : ""}
          </div>
        `;
      });
    }
    transcript += `</div>`;
  });

  transcript += `
      </body>
    </html>
  `;

  // Generate a unique filename for the transcript
  const fileName = `transcript-${channel.id}-${Date.now()}.html`;

  // Save the transcript to a file
  fs.writeFileSync(fileName, transcript);

  return new AttachmentBuilder(fileName, { name: fileName });
}


module.exports = { handler };
