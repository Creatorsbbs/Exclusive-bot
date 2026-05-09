const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("painel")
    .setDescription("Abre o painel de tickets")
    .toJSON()
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("📦 Registrando comando /painel...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Comando /painel registrado com sucesso!");
  } catch (err) {
    console.log("❌ Erro ao registrar comando:", err);
  }
})();
