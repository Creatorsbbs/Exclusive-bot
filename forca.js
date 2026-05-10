const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

// ================= SALAS =================
const salas = new Map();
const MAX_PLAYERS = 5;

// ================= CATEGORIAS =================
const categorias = {
  jogos: ["minecraft", "valorant", "roblox", "fortnite"],
  animes: ["naruto", "goku", "luffy", "saitama"],
  animais: ["girafa", "elefante", "tigre", "leao"],
  geral: ["internet", "computador", "celular", "amizade"]
};

// ================= FORCA =================
const stages = [
`+---+\n |   |\n     |\n     |\n     |\n     |\n=========`,
`+---+\n |   |\n O   |\n     |\n     |\n     |\n=========`,
`+---+\n |   |\n O   |\n |   |\n     |\n     |\n=========`,
`+---+\n |   |\n O   |\n/|\\  |\n     |\n     |\n=========`,
`+---+\n |   |\n O   |\n/|\\  |\n/ \\  |\n     |\n=========`
];

// ================= EMBED =================
function embedGame(j) {
  const palavra = j.palavra
    .split("")
    .map(l => (j.letras.includes(l) ? l : "_"))
    .join(" ");

  return new EmbedBuilder()
    .setTitle("🎮 FORCA MULTIPLAYER")
    .setDescription(
      `📚 Categoria: **${j.categoria.toUpperCase()}**\n\n` +
      `👥 Jogadores:\n${j.players.map(p => `• ${p.username}`).join("\n")}\n\n` +
      `👑 Vez: <@${j.players[j.turno]?.id}>\n\n` +
      `🔤 Palavra:\n\`${palavra}\`\n\n` +
      `❌ Erros: ${j.erros} | ❤️ Vidas: ${j.vidas}\n\n` +
      `🔡 Letras: ${j.letras.join(", ") || "Nenhuma"}\n\n` +
      `\`\`\`${stages[j.erros] || stages[0]}\`\`\``
    )
    .setColor("Blue");
}

// ================= MENU =================
function menuLetras(j) {
  const letras = "abcdefghijklmnopqrstuvwxyz"
    .split("")
    .filter(l => !j.letras.includes(l));

  const rows = [];

  for (let i = 0; i < letras.length; i += 25) {
    const chunk = letras.slice(i, i + 25);

    rows.push(
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`letra|${j.id}`)
          .setPlaceholder("Escolha uma letra")
          .addOptions(
            chunk.map(l => ({
              label: l.toUpperCase(),
              value: l
            }))
          )
      )
    );
  }

  rows.push(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`encerrar|${j.id}`)
        .setLabel("Encerrar")
        .setStyle(ButtonStyle.Danger)
    )
  );

  return rows;
}

// ================= EXPORT =================
module.exports = (client) => {

  // COMANDO
  client.on("messageCreate", async (msg) => {
    if (!msg.guild || msg.author.bot) return;

    if (msg.content === "!forca-mp") {
      const embed = new EmbedBuilder()
        .setTitle("🧩 ESCOLHA A CATEGORIA")
        .setDescription("Selecione uma categoria para iniciar a partida.")
        .setColor("Purple");

      const menu = new StringSelectMenuBuilder()
        .setCustomId("cat")
        .setPlaceholder("Selecionar categoria")
        .addOptions(
          Object.keys(categorias).map(c => ({
            label: c.toUpperCase(),
            value: c
          }))
        );

      return msg.channel.send({
        embeds: [embed],
        components: [new ActionRowBuilder().addComponents(menu)]
      });
    }
  });

  // INTERAÇÕES
  client.on("interactionCreate", async (i) => {
    if (!i.guild) return;

    // ================= CATEGORIA =================
    if (i.isStringSelectMenu() && i.customId === "cat") {

      const cat = i.values[0];
      const id = `${i.channel.id}_${Date.now()}`;

      const jogo = {
        id,
        dono: i.user.id,
        players: [i.user],
        letras: [],
        vidas: 4,
        erros: 0,
        turno: 0,
        categoria: cat,
        started: false,
        finished: false,
        palavra: categorias[cat][Math.floor(Math.random() * categorias[cat].length)]
      };

      salas.set(id, jogo);

      return i.update({
        embeds: [
          new EmbedBuilder()
            .setTitle("🎮 SALA CRIADA")
            .setDescription(`📚 Categoria: **${cat.toUpperCase()}**\n\n👥 Jogadores: 1/${MAX_PLAYERS}`)
            .setColor("Purple")
        ],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`entrar|${id}`)
              .setLabel("Entrar")
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId(`iniciar|${id}`)
              .setLabel("Iniciar")
              .setStyle(ButtonStyle.Primary)
          )
        ]
      });
    }

    if (!i.isButton() && !i.isStringSelectMenu()) return;

    const [action, id] = i.customId.split("|");
    const j = salas.get(id);

    // ================= VALIDAÇÃO GLOBAL =================
    if (!j || j.finished) {
      return i.reply({
        content: "❌ Essa partida não existe ou já foi encerrada.",
        ephemeral: true
      });
    }

    // ================= ENTRAR =================
    if (action === "entrar") {

      if (j.players.length >= MAX_PLAYERS)
        return i.reply({ content: "❌ Sala cheia", ephemeral: true });

      if (j.players.find(p => p.id === i.user.id))
        return i.reply({ content: "⚠️ Você já entrou", ephemeral: true });

      j.players.push(i.user);

      return i.update({
        embeds: [
          new EmbedBuilder()
            .setTitle("🎮 SALA")
            .setDescription(j.players.map(p => `• ${p.username}`).join("\n"))
            .setColor("Purple")
        ]
      });
    }

    // ================= INICIAR =================
    if (action === "iniciar") {

      if (i.user.id !== j.dono)
        return i.reply({ content: "❌ Só o dono inicia", ephemeral: true });

      if (j.players.length < 2)
        return i.reply({ content: "❌ Precisa de pelo menos 2 jogadores", ephemeral: true });

      if (j.started)
        return i.reply({ content: "❌ Já iniciado", ephemeral: true });

      j.started = true;

      return i.update({
        embeds: [embedGame(j)],
        components: menuLetras(j)
      });
    }

    // ================= LETRAS =================
    if (action === "letra") {

      const letra = i.values[0];

      if (j.letras.includes(letra))
        return i.reply({ content: "Letra já usada", ephemeral: true });

      j.letras.push(letra);

      if (!j.palavra.includes(letra)) {
        j.erros++;
        j.vidas--;
      }

      const atual = j.palavra
        .split("")
        .map(l => (j.letras.includes(l) ? l : "_"))
        .join(" ");

      // derrota
      if (j.vidas <= 0) {
        j.finished = true;
        salas.delete(id);

        return i.update({
          content: `💀 Você perdeu! Palavra era: **${j.palavra}**`,
          embeds: [],
          components: []
        });
      }

      // vitória
      if (!atual.includes("_")) {
        j.finished = true;
        salas.delete(id);

        return i.update({
          content: `🏆 Vitória! Palavra: **${j.palavra}**`,
          embeds: [],
          components: []
        });
      }

      j.turno = (j.turno + 1) % j.players.length;

      return i.update({
        embeds: [embedGame(j)],
        components: menuLetras(j)
      });
    }

    // ================= ENCERRAR =================
    if (action === "encerrar") {

      j.finished = true;
      salas.delete(id);

      return i.update({
        content: "🛑 Partida encerrada",
        embeds: [],
        components: []
      });
    }
  });
};
