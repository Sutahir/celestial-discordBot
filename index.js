const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  Events,
} = require("discord.js");
const {
  loadCommands,
  loadEventHandlers,
  CONFIG,
} = require("./modules/utils/config");
const dotenv = require("dotenv");
const { moveMessages } = require("./modules/utils/chatredirect");
const { cachebalance, cacheAllSheetRanges } = require("./modules/utils/sheet");
const { handler } = require("./handler");
const { readdirSync } = require("fs");
const path = require("path");
const fs = require("fs");

// Load environment variables
dotenv.config();

// Check for required environment variables
const requiredEnvVars = ["CLIENT_ID", "GUILD_ID", "BOT_TOKEN"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(
    `Error: Missing required environment variables: ${missingEnvVars.join(
      ", "
    )}`
  );
  console.error(
    "Please check your .env file and ensure all required variables are set."
  );
  process.exit(1);
}

// Client configuration
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const token = process.env.BOT_TOKEN;

// Create client with required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
  ],
  allowedMentions: { parse: ["users", "roles"], repliedUser: true },
});

// Initialize REST API client
const rest = new REST({ version: "10" }).setToken(token);

// Add this after creating the client
client.commands = new Map();

/**
 * Register slash commands with Discord API
 */
async function registerCommands() {
  try {
    console.log("Started refreshing application (/) commands...");

    // Use the existing loadCommands function from config.js
    const commands = loadCommands();
    console.log(`Found ${commands.length} commands to register`);

    // Print out each command name for debugging
    commands.forEach((cmd, index) => {
      console.log(`Command ${index + 1}: ${cmd.name}`);
    });

    // Load commands into client.commands Map for execution
    const commandsDir = path.join(__dirname, "./modules/commands");
    const commandFiles = fs
      .readdirSync(commandsDir)
      .filter((file) => file.endsWith(".js"));

    for (const file of commandFiles) {
      const filePath = path.join(commandsDir, file);
      try {
        const command = require(filePath);

        if (command.data && command.execute) {
          client.commands.set(command.data.name, command);
          console.log(`Loaded command handler for: ${command.data.name}`);
        } else {
          console.warn(
            `The command at ${filePath} is missing required "data" or "execute" property.`
          );
        }
      } catch (err) {
        console.error(`Error loading command from ${file}:`, err);
      }
    }

    // Register commands with Discord API
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });

    console.log(
      `Successfully registered ${commands.length} application commands.`
    );
  } catch (error) {
    console.error("Error registering commands:", error);
  }
}

/**
 * Initialize the bot
 */
async function initializeBot() {
  try {
    // Register commands
    await registerCommands();
    console.log("DEBUG: Commands registered, now setting up event handlers");

    // Set up message handler
    client.on("messageCreate", async (message) => {
      try {
        await handler(message, client);
      } catch (error) {
        console.error("Error in message handler:", error);
      }
    });
    console.log("DEBUG: Message handler set up");

    // Ready event handler
    client.once(Events.ClientReady, () => {
      console.log(`Logged in as ${client.user.tag}!`);
      console.log(`Serving on ${client.guilds.cache.size} servers`);

      // Start background services
      startBackgroundServices();

      // Load custom event handlers
      loadEventHandlers(client);
    });
    console.log("DEBUG: Ready event handler set up");

    // Error handling
    client.on("error", (error) => {
      console.error("Discord client error:", error);
    });

    // Login to Discord
    console.log("DEBUG: About to attempt Discord login");
    await client.login(token);
    console.log("DEBUG: Login completed");
  } catch (error) {
    console.error("Failed to initialize bot:", error);
    process.exit(1);
  }
}

/**
 * Start background services
 */
function startBackgroundServices() {
  console.log("DEBUG: Starting background services");

  // Cache all sheet ranges on startup
  console.log("Starting sheet data caching service...");
  cacheAllSheetRanges().catch((error) => {
    console.error("Sheet data caching service error:", error);
  });

  // Start message redirection service (runs in background)
  console.log("Starting message redirection service...");
  moveMessages(client).catch((error) => {
    console.error("Message redirection service error:", error);
  });
  console.log("DEBUG: Background services started");
}

// Process error handling for uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Don't exit - let the bot continue running
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit - let the bot continue running
});

// Initialize the bot
console.log("DEBUG: Starting bot initialization");
initializeBot();
