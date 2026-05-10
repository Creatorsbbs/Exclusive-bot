const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

// ================= CONFIG =================
const salas = new Map();
const MAX_PLAYERS = 5;

const letras = "abcdefghijklmnopqrstuvwxyz".toUpperCase().split("");

// ================= UTIL =================
function montarTeclado(gameId, usados = []) {
  const rows = [];
  let row = new ActionRowBuilder();

  letras.forEach((letra, index) => {
    const customId = `forca_${gameId}_${letra}`; // 🔥 SEM DUPLICAÇÃO

    const btn = new ButtonBuilder()
      .setCustomId(customId)
      .setLabel(letra)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(usados.includes(letra));

    row.addComponents(btn);

    if ((index + 1) % 5 === 0) {
      rows.push(row);
      row = new ActionRowBuilder();
    }
  });

  if (row.components.length > 0) rows.push(row);

  return rows;
}

// ================= EMBED =================
function montarEmbed(sala) {
  const palavraDisplay = sala.palavra
    .split("")
    .map((l) => (sala.acertos.includes(l) ? l : "_"))
    .join(" ");

  return new EmbedBuilder()
    .setTitle("🎮 FORCA MULTIPLAYER")
    .setColor(0x3498db)
    .setDescription(
      `📚 Categoria: **${sala.categoria.toUpperCase()}**\n\n` +
      `👥 Jogadores:\n` +
      sala.jogadores.map((j) => `• ${j}`).join("\n") +
      `\n\n👑 Vez: <@${sala.vez}>\n\n` +
      `🔤 Palavra:\n\`${palavraDisplay}\`\n\n` +
      `❌ Erros: ${sala.erros} | ❤️ Vidas: ${sala.vidas}\n\n` +
      `🔡 Letras: ${sala.usadas.join(", ") || "Nenhuma"}`
    );
}

// ================= JOGO =================
function criarSala(id, categoria, palavra, jogadores) {
  const gameId = Date.now().toString();

  salas.set(gameId, {
    id: gameId,
    categoria,
    palavra: palavra.toUpperCase(),
    jogadores,
    vez: jogadores[0],
    acertos: [],
    usadas: [],
    erros: 0,
    vidas: 4,
  });

  return gameId;
}

// ================= PROCESSAR LETRA =================
async function processarLetra(interaction, letra) {
  const gameId = interaction.customId.split("_")[1];
  const sala = salas.get(gameId);

  if (!sala) {
    return interaction.reply({
      content: "❌ Essa partida não existe mais.",
      ephemeral: true,
    }).catch(() => {});
  }

  if (sala.usadas.includes(letra)) {
    return interaction.reply({
      content: "⚠️ Essa letra já foi usada.",
      ephemeral: true,
    }).catch(() => {});
  }

  sala.usadas.push(letra);

  if (sala.palavra.includes(letra)) {
    sala.acertos.push(letra);
  } else {
    sala.erros++;
    sala.vidas--;
  }

  // troca turno
  const atualIndex = sala.jogadores.indexOf(sala.vez);
  sala.vez =
    sala.jogadores[(atualIndex + 1) % sala.jogadores.length];

  const embed = montarEmbed(sala);
  const components = montarTeclado(gameId, sala.usadas);

  await interaction.update({
    embeds: [embed],
    components,
  }).catch(() => {});
}

// ================= EXPORT =================
module.exports = {
  criarSala,
  processarLetra,
  montarEmbed,
  montarTeclado,
  salas,
};
