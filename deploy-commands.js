const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [
  new SlashCommandBuilder()
    .setName("painel")
    .setDescription("Abre o painel de tickets")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("forca")
    .setDescription("Inicia uma partida de forca multiplayer")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("setstaff")
    .setDescription("Define o cargo de staff do servidor")
    .addRoleOption(option =>
      option
        .setName("cargo")
        .setDescription("Selecione o cargo de staff")
        .setRequired(true)
    )
    .toJSON()
];

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("📦 Registrando comandos...");

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log("✅ Comandos registrados com sucesso!");
  } catch (err) {
    console.log("❌ Erro ao registrar comando:", err);
  }
})();
