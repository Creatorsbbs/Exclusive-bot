const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

// ================= DADOS =================

const salas = new Map();
const xp = new Map();
const inventario = new Map();

const MAX_PLAYERS = 5;

const palavras = [
  "minecraft", "fortnite", "valorant", "roblox",
  "freefire", "naruto", "computador", "internet",
  "amizade", "celular"
];

// ================= XP SYSTEM =================

function addXP(userId, amount) {
  if (!xp.has(userId)) xp.set(userId, 0);
  xp.set(userId, xp.get(userId) + amount);
}

function getXP(userId) {
  return xp.get(userId) || 0;
}

// ================= INVENTÁRIO =================

function getInv(userId) {
  if (!inventario.has(userId)) {
    inventario.set(userId, { vida: 0, dica: 0, skip: 0 });
  }
  return inventario.get(userId);
}

// ================= FORCA =================

const stages = [
` +---+\n |   |\n     |\n     |\n     |\n     |\n=========`,
` +---+\n |   |\n O   |\n     |\n     |\n     |\n=========`,
` +---+\n |   |\n O   |\n |   |\n     |\n     |\n=========`,
` +---+\n |   |\n O   |\n/|\\  |\n     |\n     |\n=========`,
` +---+\n |   |\n O   |\n/|\\  |\n/ \\  |\n     |\n=========`
];

// ================= EMBED =================

function criarEmbed(jogo) {

  const palavra = jogo.palavra
    .split("")
    .map(l => jogo.letras.includes(l) ? l : "_")
    .join(" ");

  return new EmbedBuilder()
    .setTitle("🎮 FORCA MULTIPLAYER")
    .setDescription(
      `👥 Jogadores:\n${jogo.players.map(p => `• ${p.username}`).join("\n")}\n\n` +
      `🔤 Palavra: \`${palavra}\`\n\n` +
      `❌ Erros: ${jogo.erros}\n` +
      `❤️ Vidas: ${jogo.vidas}\n\n` +
      `🔡 Letras usadas: ${jogo.letras.join(", ").toUpperCase() || "Nenhuma"}\n\n` +
      `\`\`\`${stages[jogo.erros]}\`\`\``
    )
    .setColor("Blue");
}

// ================= MENU LETRAS =================

function criarMenu(jogo) {

  const letras = "abcdefghijklmnopqrstuvwxyz".split("")
    .filter(l => !jogo.letras.includes(l));

  const rows = [];
  let pagina = 0;

  for (let i = 0; i < letras.length; i += 25) {

    const grupo = letras.slice(i, i + 25);

    const menu = new StringSelectMenuBuilder()
      .setCustomId(`letras_${jogo.id}_${pagina}`)
      .setPlaceholder("Escolha uma letra")
      .addOptions(
        grupo.map(l => ({
          label: l.toUpperCase(),
          value: l
        }))
      );

    rows.push(new ActionRowBuilder().addComponents(menu));
    pagina++;
  }

  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`encerrar_${jogo.id}`)
        .setLabel("Encerrar")
        .setStyle(ButtonStyle.Danger)
    )
  );

  return rows;
}

// ================= LOJA =================

function lojaEmbed(userId) {

  const inv = getInv(userId);

  return new EmbedBuilder()
    .setTitle("🏪 LOJA FORCA")
    .setDescription(
      `⭐ XP: ${getXP(userId)}\n\n` +
      `🎒 Inventário:\n💚 Vida: ${inv.vida}\n💡 Dica: ${inv.dica}\n⏭ Skip: ${inv.skip}`
    )
    .setColor("Green");
}

// ================= EXPORT =================

module.exports = (client) => {

  // ================= MESSAGE =================

  client.on("messageCreate", async (msg) => {

    if (!msg.guild || msg.author.bot) return;

    // 🎮 criar jogo
    if (msg.content === "!forca-mp") {

      const id = `${msg.channel.id}-${Date.now()}`;

      salas.set(id, {
        id,
        dono: msg.author.id,
        players: [msg.author],
        letras: [],
        vidas: 4,
        erros: 0,
        started: false,
        channelId: msg.channel.id
      });

      return msg.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("🎮 SALA FORCA")
            .setDescription("Clique para entrar ou iniciar")
            .setColor("Purple")
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`entrar_${id}`)
              .setLabel("Entrar")
              .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
              .setCustomId(`iniciar_${id}`)
              .setLabel("Iniciar")
              .setStyle(ButtonStyle.Primary)
          )
        ]
      });
    }

    // 🏪 loja
    if (msg.content === "!loja-forca") {
      return msg.channel.send({
        embeds: [lojaEmbed(msg.author.id)],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`buy_vida_${msg.author.id}`)
              .setLabel("💚 Vida (100 XP)")
              .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
              .setCustomId(`buy_dica_${msg.author.id}`)
              .setLabel("💡 Dica (150 XP)")
              .setStyle(ButtonStyle.Primary),

            new ButtonBuilder()
              .setCustomId(`buy_skip_${msg.author.id}`)
              .setLabel("⏭ Skip (200 XP)")
              .setStyle(ButtonStyle.Secondary)
          )
        ]
      });
    }

    // 🏆 rank
    if (msg.content === "!rank-forca") {

      const top = [...xp.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      return msg.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("🏆 RANK GLOBAL")
            .setDescription(
              top.map((u, i) =>
                `#${i + 1} <@${u[0]}> - ${u[1]} XP`
              ).join("\n") || "Ninguém ainda"
            )
            .setColor("Gold")
        ]
      });
    }
  });

  // ================= INTERACTIONS =================

  client.on("interactionCreate", async (i) => {

    if (!i.isButton() && !i.isStringSelectMenu()) return;

    const parts = i.customId.split("_");
    const salaId = parts[1];
    const jogo = salas.get(salaId);

    // entrar
    if (i.customId.startsWith("entrar_")) {

      if (jogo.players.length >= MAX_PLAYERS)
        return i.reply({ content: "Sala cheia", ephemeral: true });

      if (jogo.players.find(p => p.id === i.user.id))
        return i.reply({ content: "Já entrou", ephemeral: true });

      jogo.players.push(i.user);

      return i.update({
        embeds: [
          new EmbedBuilder()
            .setTitle("🎮 SALA")
            .setDescription(jogo.players.map(p => `• ${p.username}`).join("\n"))
            .setColor("Purple")
        ],
        components: i.message.components
      });
    }

    // iniciar
    if (i.customId.startsWith("iniciar_")) {

      if (i.user.id !== jogo.dono)
        return i.reply({ content: "Só dono inicia", ephemeral: true });

      jogo.palavra = palavras[Math.floor(Math.random() * palavras.length)];
      jogo.started = true;

      return i.update({
        embeds: [criarEmbed(jogo)],
        components: criarMenu(jogo)
      });
    }

    // letras
    if (i.isStringSelectMenu()) {

      if (!i.customId.startsWith("letras_")) return;

      const letra = i.values[0];

      if (jogo.letras.includes(letra))
        return i.reply({ content: "Já usada", ephemeral: true });

      jogo.letras.push(letra);

      if (!jogo.palavra.includes(letra)) {
        jogo.erros++;
        jogo.vidas--;
      } else {
        addXP(i.user.id, 10);
      }

      const atual = jogo.palavra
        .split("")
        .map(l => jogo.letras.includes(l) ? l : "_")
        .join(" ");

      if (jogo.vidas <= 0) {
        salas.delete(salaId);
        addXP(i.user.id, 5);

        return i.update({
          content: `💀 Perdeu! palavra: ${jogo.palavra}`,
          components: []
        });
      }

      if (!atual.includes("_")) {
        salas.delete(salaId);

        addXP(i.user.id, 50);

        return i.update({
          content: `🏆 Ganhou! palavra: ${jogo.palavra}`,
          components: []
        });
      }

      return i.update({
        embeds: [criarEmbed(jogo)],
        components: criarMenu(jogo)
      });
    }

    // loja compra
    if (i.customId.startsWith("buy_")) {

      const tipo = i.customId.split("_")[1];
      const inv = getInv(i.user.id);

      if (tipo === "vida") {
        if (getXP(i.user.id) < 100)
          return i.reply({ content: "XP insuficiente", ephemeral: true });

        xp.set(i.user.id, getXP(i.user.id) - 100);
        inv.vida++;
      }

      if (tipo === "dica") {
        if (getXP(i.user.id) < 150)
          return i.reply({ content: "XP insuficiente", ephemeral: true });

        xp.set(i.user.id, getXP(i.user.id) - 150);
        inv.dica++;
      }

      if (tipo === "skip") {
        if (getXP(i.user.id) < 200)
          return i.reply({ content: "XP insuficiente", ephemeral: true });

        xp.set(i.user.id, getXP(i.user.id) - 200);
        inv.skip++;
      }

      return i.update({
        embeds: [lojaEmbed(i.user.id)],
        components: i.message.components
      });
    }
  });
};
