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

// ================= CATEGORIAS =================

const categorias = {
  jogos: ["minecraft", "valorant", "roblox", "fortnite"],
  animes: ["naruto", "goku", "luffy", "saitama"],
  animais: ["girafa", "elefante", "tigre", "leao"],
  filmes: ["matrix", "avatar", "batman", "joker"],
  geral: ["internet", "celular", "amizade", "computador"]
};

// ================= XP =================

function addXP(id, amount) {
  xp.set(id, (xp.get(id) || 0) + amount);
}

function getXP(id) {
  return xp.get(id) || 0;
}

function getInv(id) {
  if (!inventario.has(id)) {
    inventario.set(id, { vida: 0, dica: 0, skip: 0 });
  }
  return inventario.get(id);
}

// ================= FORCA VISUAL =================

const stages = [
` +---+\n |   |\n     |\n     |\n     |\n     |\n=========`,
` +---+\n |   |\n O   |\n     |\n     |\n     |\n=========`,
` +---+\n |   |\n O   |\n |   |\n     |\n     |\n=========`,
` +---+\n |   |\n O   |\n/|\\  |\n     |\n     |\n=========`,
` +---+\n |   |\n O   |\n/|\\  |\n/ \\  |\n     |\n=========`
];

// ================= EMBED FORCA =================

function criarEmbed(jogo) {

  const palavra = jogo.palavra
    .split("")
    .map(l => jogo.letras.includes(l) ? l : "_")
    .join(" ");

  return new EmbedBuilder()
    .setTitle("🎮 FORCA MULTIPLAYER")
    .setDescription(
      `📚 Categoria: **${jogo.categoria.toUpperCase()}**\n\n` +
      `👥 Jogadores:\n${jogo.players.map(p => `• ${p.username}`).join("\n")}\n\n` +
      `🔤 Palavra:\n\`${palavra}\`\n\n` +
      `❌ Erros: ${jogo.erros}\n❤️ Vidas: ${jogo.vidas}\n\n` +
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
  let page = 0;

  for (let i = 0; i < letras.length; i += 25) {

    const grupo = letras.slice(i, i + 25);

    const menu = new StringSelectMenuBuilder()
      .setCustomId(`letras_${jogo.id}_${page}`)
      .setPlaceholder("Escolha uma letra")
      .addOptions(
        grupo.map(l => ({
          label: l.toUpperCase(),
          value: l
        }))
      );

    rows.push(new ActionRowBuilder().addComponents(menu));
    page++;
  }

  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`encerrar_${jogo.id}`)
        .setLabel("Encerrar partida")
        .setStyle(ButtonStyle.Danger)
    )
  );

  return rows;
}

// ================= MENU CATEGORIAS =================

function menuCategorias() {

  const embed = new EmbedBuilder()
    .setTitle("🧩 ESCOLHA A CATEGORIA")
    .setDescription(
      `🎮 Bem-vindo ao modo Forca Multiplayer!\n\n` +
      `Escolha uma categoria abaixo para começar sua partida:\n\n` +
      `🔥 Cada categoria possui palavras diferentes e desafios únicos!\n` +
      `🏆 Quanto mais difícil, mais XP você ganha!\n\n` +
      `Boa sorte! 🍀`
    )
    .setColor("Purple");

  const menu = new StringSelectMenuBuilder()
    .setCustomId("categoria_select")
    .setPlaceholder("Selecione uma categoria")
    .addOptions(
      Object.keys(categorias).map(cat => ({
        label: cat.toUpperCase(),
        value: cat,
        description: `Categoria ${cat}`
      }))
    );

  return {
    embeds: [embed],
    components: [new ActionRowBuilder().addComponents(menu)]
  };
}

// ================= EXPORT =================

module.exports = (client) => {

  // ================= MESSAGE =================

  client.on("messageCreate", async (msg) => {

    if (!msg.guild || msg.author.bot) return;

    if (msg.content === "!forca-mp") {
      return msg.channel.send(menuCategorias());
    }

    if (msg.content === "!loja-forca") {

      const inv = getInv(msg.author.id);

      return msg.channel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("🏪 LOJA FORCA")
            .setDescription(
              `⭐ XP: ${getXP(msg.author.id)}\n\n` +
              `🎒 Inventário:\n💚 Vida: ${inv.vida}\n💡 Dica: ${inv.dica}\n⏭ Skip: ${inv.skip}`
            )
            .setColor("Green")
        ],
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
              ).join("\n") || "Sem jogadores ainda"
            )
            .setColor("Gold")
        ]
      });
    }
  });

  // ================= INTERACTIONS =================

  client.on("interactionCreate", async (i) => {

    if (!i.isStringSelectMenu() && !i.isButton()) return;

    // ================= CATEGORIA =================

    if (i.customId === "categoria_select") {

      const categoria = i.values[0];

      const id = `${i.channel.id}-${Date.now()}`;

      const jogo = {
        id,
        dono: i.user.id,
        players: [i.user],
        letras: [],
        vidas: 4,
        erros: 0,
        started: false,
        categoria
      };

      jogo.palavra =
        categorias[categoria][Math.floor(Math.random() * categorias[categoria].length)];

      salas.set(id, jogo);

      return i.update({
        embeds: [
          new EmbedBuilder()
            .setTitle("🎮 SALA CRIADA")
            .setDescription(
              `📚 Categoria: **${categoria.toUpperCase()}**\n\n` +
              `👑 Dono: ${i.user}\n\n` +
              `👥 Jogadores: 1/${MAX_PLAYERS}`
            )
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

    // ================= ENTRAR =================

    if (i.customId.startsWith("entrar_")) {

      const id = i.customId.split("_")[1];
      const jogo = salas.get(id);

      if (!jogo) return;

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

    // ================= INICIAR =================

    if (i.customId.startsWith("iniciar_")) {

      const id = i.customId.split("_")[1];
      const jogo = salas.get(id);

      if (i.user.id !== jogo.dono)
        return i.reply({ content: "Só dono inicia", ephemeral: true });

      return i.update({
        embeds: [criarEmbed(jogo)],
        components: criarMenu(jogo)
      });
    }

    // ================= LETRAS =================

    if (i.isStringSelectMenu()) {

      const id = i.customId.split("_")[1];
      const jogo = salas.get(id);

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
        salas.delete(id);
        return i.update({
          content: `💀 Perdeu! Palavra: ${jogo.palavra}`,
          components: []
        });
      }

      if (!atual.includes("_")) {
        salas.delete(id);
        addXP(i.user.id, 50);

        return i.update({
          content: `🏆 Ganhou! Palavra: ${jogo.palavra}`,
          components: []
        });
      }

      return i.update({
        embeds: [criarEmbed(jogo)],
        components: criarMenu(jogo)
      });
    }

    // ================= LOJA =================

    if (i.customId.startsWith("buy_")) {

      const tipo = i.customId.split("_")[1];
      const userId = i.customId.split("_")[2];

      const inv = getInv(userId);

      if (getXP(userId) < 100)
        return i.reply({ content: "XP insuficiente", ephemeral: true });

      if (tipo === "vida") inv.vida++;
      if (tipo === "dica") inv.dica++;
      if (tipo === "skip") inv.skip++;

      return i.update({ content: "Comprado!", components: [] });
    }
  });
};
