const { readdirSync } = require("fs");
const path = require("path");

const loadCommands = () => {
  const commandFiles = readdirSync(path.join(__dirname, "../commands")).filter(
    (file) => file.endsWith(".js")
  );
  const commands = commandFiles.map((file) =>
    require(`../commands/${file}`).data.toJSON()
  );
  return commands;
};

const loadEventHandlers = (client) => {
  const eventFiles = readdirSync(path.join(__dirname, "../handlers")).filter(
    (file) => file.endsWith(".js")
  );
  for (const file of eventFiles) {
    const event = require(`../handlers/${file}`);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }
};

module.exports = { loadCommands, loadEventHandlers };
