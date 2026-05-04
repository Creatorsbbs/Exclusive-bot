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

// 🎵 sistema de música
require("./music")(client);

// ✅ evento correto
client.once("ready", () => {
  console.log(`🤖 Online como ${client.user.tag}`);
});

// ❌ erros
client.on("error", (err) => {
  console.error("Erro no client:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Erro não tratado:", err);
});

// 🔐 login
client.login(process.env.TOKEN);
