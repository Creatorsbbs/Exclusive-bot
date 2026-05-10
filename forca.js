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

function addXP(id, v) {
  xp.set(id, (xp.get(id) || 0) + v);
}
function getXP(id) {
  return xp.get(id) || 0;
}
function inv(id) {
  if (!inventario.has(id)) {
    inventario.set(id, { vida: 0, dica: 0, skip: 0 });
  }
  return inventario.get(id);
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

function embedGame(j) {

  const palavra = j.palavra
    .split("")
    .map(l => j.letras.includes(l) ? l : "_")
    .join(" ");

  const jogador = j.players[j.turno];

  return new EmbedBuilder()
    .setTitle("🎮 FORCA ULTRA MODE")
    .setDescription(
      `📚 Categoria: **${j.categoria.toUpperCase()}**\n\n` +
      `👥 Jogadores:\n${j.players.map(p => `• ${p.username}`).join("\n")}\n\n` +
      `👑 Vez de: <@${jogador.id}>\n\n` +
      `🔤 Palavra:\n\`${palavra}\`\n\n` +
      `❌ Erros: ${j.erros} | ❤️ Vidas: ${j.vidas}\n\n` +
      `🔡 Letras: ${j.letras.join(", ") || "Nenhuma"}\n\n` +
      `\`\`\`${stages[j.erros]}\`\`\``
    )
    .setColor("Blue");
}

// ================= MENU LETRAS =================

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
          .setCustomId(`letra_${j.id}`)
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

  // 🔥 BOTÕES DE POWER UP DENTRO DO JOGO

  rows.push(
    new ActionRowBuilder().addComponents(

      new ButtonBuilder()
        .setCustomId(`dica_${j.id}`)
        .setLabel("💡 Dica")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(`skip_${j.id}`)
        .setLabel("⏭ Pular")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`encerrar_${j.id}`)
        .setLabel("🔴 Encerrar")
        .setStyle(ButtonStyle.Danger)
    )
  );

  return rows;
}

// ================= EXPORT =================

module.exports = (client) => {

  // ================= MESSAGE =================

  client.on("messageCreate", async (msg) => {

    if (!msg.guild || msg.author.bot) return;

    if (msg.content === "!forca-mp") {

      const embed = new EmbedBuilder()
        .setTitle("🧩 ESCOLHA A CATEGORIA")
        .setDescription(
          `🎮 Forca Multiplayer Ultra Mode\n\n` +
          `🔥 Escolha a categoria do jogo:\n` +
          `Quanto mais difícil, mais XP você ganha!\n\n` +
          `Boa sorte 🍀`
        )
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

  // ================= INTERACTIONS =================

  client.on("interactionCreate", async (i) => {

    if (!i.isStringSelectMenu() && !i.isButton()) return;

    // ================= CATEGORIA =================

    if (i.customId === "cat") {

      const cat = i.values[0];
      const id = `${i.channel.id}-${Date.now()}`;

      const jogo = {
        id,
        dono: i.user.id,
        players: [i.user],
        letras: [],
        vidas: 4,
        erros: 0,
        turno: 0,
        categoria: cat
      };

      jogo.palavra =
        categorias[cat][Math.floor(Math.random() * categorias[cat].length)];

      salas.set(id, jogo);

      return i.update({
        embeds: [
          new EmbedBuilder()
            .setTitle("🎮 SALA CRIADA")
            .setDescription(
              `📚 Categoria: **${cat.toUpperCase()}**\n\n` +
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
      const j = salas.get(id);

      if (!j) return;

      if (j.players.length >= MAX_PLAYERS)
        return i.reply({ content: "Cheio", ephemeral: true });

      if (j.players.find(p => p.id === i.user.id))
        return i.reply({ content: "Já entrou", ephemeral: true });

      j.players.push(i.user);

      return i.update({
        embeds: [
          new EmbedBuilder()
            .setTitle("🎮 SALA")
            .setDescription(j.players.map(p => `• ${p.username}`).join("\n"))
            .setColor("Purple")
        ],
        components: i.message.components
      });
    }

    // ================= INICIAR =================

    if (i.customId.startsWith("iniciar_")) {

      const id = i.customId.split("_")[1];
      const j = salas.get(id);

      if (i.user.id !== j.dono)
        return i.reply({ content: "Só dono", ephemeral: true });

      return i.update({
        embeds: [embedGame(j)],
        components: menuLetras(j)
      });
    }

    // ================= LETRAS =================

    if (i.isStringSelectMenu()) {

      const id = i.customId.split("_")[1];
      const j = salas.get(id);

      const l = i.values[0];

      if (j.letras.includes(l))
        return i.reply({ content: "Já usada", ephemeral: true });

      j.letras.push(l);

      if (!j.palavra.includes(l)) {
        j.erros++;
        j.vidas--;
      } else {
        addXP(i.user.id, 10);
      }

      const atual = j.palavra
        .split("")
        .map(x => j.letras.includes(x) ? x : "_")
        .join(" ");

      if (j.vidas <= 0) {
        salas.delete(id);
        return i.update({
          content: `💀 Perdeu: ${j.palavra}`,
          components: []
        });
      }

      if (!atual.includes("_")) {
        salas.delete(id);
        addXP(i.user.id, 50);

        return i.update({
          content: `🏆 Ganhou: ${j.palavra}`,
          components: []
        });
      }

      j.turno++;
      if (j.turno >= j.players.length) j.turno = 0;

      return i.update({
        embeds: [embedGame(j)],
        components: menuLetras(j)
      });
    }

    // ================= POWER UPS =================

    if (i.customId.startsWith("dica_")) {

      const id = i.customId.split("_")[1];
      const j = salas.get(id);

      const invu = inv(i.user.id);

      if (invu.dica <= 0)
        return i.reply({ content: "Sem dica", ephemeral: true });

      invu.dica--;

      return i.reply({
        content: `💡 Dica: a palavra começa com **${j.palavra[0]}**`,
        ephemeral: true
      });
    }

    if (i.customId.startsWith("skip_")) {

      const id = i.customId.split("_")[1];
      const j = salas.get(id);

      const invu = inv(i.user.id);

      if (invu.skip <= 0)
        return i.reply({ content: "Sem skip", ephemeral: true });

      invu.skip--;

      j.turno++;
      if (j.turno >= j.players.length) j.turno = 0;

      return i.update({
        embeds: [embedGame(j)],
        components: menuLetras(j)
      });
    }

    if (i.customId.startsWith("encerrar_")) {

      const id = i.customId.split("_")[1];

      salas.delete(id);

      return i.update({
        content: "🛑 Encerrado",
        components: []
      });
    }
  });
};
