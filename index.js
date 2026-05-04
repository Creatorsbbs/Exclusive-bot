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

// ✅ evento correto (evita warning)
client.once("clientReady", () => {
  console.log(`🤖 Online como ${client.user.tag}`);
});

// ❌ evita crash silencioso
client.on("error", (err) => {
  console.error("Erro no client:", err);
});

// ❌ evita crash de promise
process.on("unhandledRejection", (err) => {
  console.error("Erro não tratado:", err);
});

client.login(process.env.TOKEN);
