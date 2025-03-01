const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  AttachmentBuilder,
} = require("discord.js");
const { loadCommands, loadEventHandlers } = require("./modules/utils/config");
const dotenv = require("dotenv");
const fs = require("fs");
const { moveMessages } = require("./modules/utils/chatredirect");
const { cachebalance } = require("./modules/utils/submit");
const { handler } = require("./handler");
dotenv.config();

const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.BOT_TOKEN;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
  ],
});

const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    console.log("Started refreshing application (/) commands.");
    const commands = loadCommands();
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });
    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})();

client.on("messageCreate", async (message) => {
  await handler(message,client);
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
  cachebalance();
  moveMessages(client); // Move this line inside the 'ready' event handler
  loadEventHandlers(client); // Load event handlers after the bot is ready
});

client.login(token);
