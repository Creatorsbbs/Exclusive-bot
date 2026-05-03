require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// 🔥 puxando sistema de música
require("./music")(client);

client.once("ready", () => {
  console.log(`🤖 Online como ${client.user.tag}`);
});

client.login(process.env.TOKEN);
