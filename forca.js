const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

const jogos = new Map();

const categorias = {
  jogos: [
    "minecraft",
    "fortnite",
    "valorant",
    "roblox",
    "freefire",
    "csgo"
  ],

  animes: [
    "naruto",
    "onepiece",
    "bleach",
    "dragonball",
    "tokyorevengers"
  ],

  animais: [
    "elefante",
    "girafa",
    "jacare",
    "cachorro",
    "ornitorrinco"
  ],

  geral: [
    "bicicleta",
    "abacaxi",
    "internet",
    "tempestade",
    "computador"
  ]
};

const forcaStages = [
` 
 +---+
 |   |
     |
     |
     |
     |
=========
`,
`
 +---+
 |   |
 O   |
     |
     |
     |
=========
`,
`
 +---+
 |   |
 O   |
 |   |
     |
     |
=========
`,
`
 +---+
 |   |
 O   |
/|   |
     |
     |
=========
`,
`
 +---+
 |   |
 O   |
/|\\  |
     |
     |
=========
`,
`
 +---+
 |   |
 O   |
/|\\  |
/    |
     |
=========
`,
`
 +---+
 |   |
 O   |
/|\\  |
/ \\  |
     |
=========
`
];

module.exports = (client) => {

  // ================= COMANDO =================

  client.on("messageCreate", async (message) => {

    if (message.author.bot) return;

    if (message.content === "!forca") {

      const embed = new EmbedBuilder()
        .setTitle("🎮 Jogo da Forca")
        .setDescription(
          `Escolha uma categoria abaixo.\n\n` +
          `🎯 Sistema completo\n` +
          `❤️ Sistema de vidas\n` +
          `🏆 Vitória e derrota\n` +
          `🔥 Sem crash`
        )
        .setColor("Purple");

      const menu = new StringSelectMenuBuilder()
        .setCustomId("forca_categoria")
        .setPlaceholder("Escolha uma categoria")
        .addOptions([
          {
            label: "🎮 Jogos",
            value: "jogos"
          },
          {
            label: "🎌 Animes",
            value: "animes"
          },
          {
            label: "🐾 Animais",
            value: "animais"
          },
          {
            label: "🌎 Geral",
            value: "geral"
          }
        ]);

      const row = new ActionRowBuilder()
        .addComponents(menu);

      message.channel.send({
        embeds: [embed],
        components: [row]
      });
    }

    // ================= JOGO =================

    const jogo = jogos.get(message.author.id);

    if (!jogo) return;

    const letra = message.content.toLowerCase();

    if (!/^[a-zA-Z]$/.test(letra)) return;

    if (jogo.letras.includes(letra)) {
      return message.reply("⚠️ Você já utilizou essa letra.");
    }

    jogo.letras.push(letra);

    if (!jogo.palavra.includes(letra)) {
      jogo.vidas--;
      jogo.erros++;
    }

    const palavraAtual = jogo.palavra
      .split("")
      .map(l => jogo.letras.includes(l) ? l : "_")
      .join(" ");

    // ================= DERROTA =================

    if (jogo.vidas <= 0) {

      jogos.delete(message.author.id);

      const embed = new EmbedBuilder()
        .setTitle("💀 Você perdeu")
        .setDescription(
          `A palavra era:\n\n` +
          `🔤 **${jogo.palavra}**`
        )
        .setColor("Red");

      return message.reply({
        embeds: [embed]
      });
    }

    // ================= VITÓRIA =================

    if (!palavraAtual.includes("_")) {

      jogos.delete(message.author.id);

      const embed = new EmbedBuilder()
        .setTitle("🏆 Você venceu")
        .setDescription(
          `Você acertou:\n\n` +
          `🎉 **${jogo.palavra}**`
        )
        .setColor("Green");

      return message.reply({
        embeds: [embed]
      });
    }

    // ================= CONTINUA =================

    const embed = new EmbedBuilder()
      .setTitle("🎮 Jogo da Forca")
      .setDescription(
        `📚 Categoria: **${jogo.categoria}**\n\n` +
        `🔤 Palavra:\n\`${palavraAtual}\`\n\n` +
        `❤️ Vidas: **${jogo.vidas}**\n\n` +
        `🔠 Letras:\n${jogo.letras.join(", ")}\n\n` +
        `\`\`\`${forcaStages[jogo.erros]}\`\`\``
      )
      .setColor("Blue");

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId("encerrar_forca")
          .setLabel("Encerrar")
          .setStyle(ButtonStyle.Danger)
      );

    message.reply({
      embeds: [embed],
      components: [row]
    });

  });

  // ================= INTERAÇÕES =================

  client.on("interactionCreate", async (interaction) => {

    try {

      // ===== MENU =====

      if (interaction.isStringSelectMenu()) {

        if (interaction.customId === "forca_categoria") {

          const categoria = interaction.values[0];

          const palavras = categorias[categoria];

          const palavra =
            palavras[Math.floor(Math.random() * palavras.length)];

          jogos.set(interaction.user.id, {
            palavra,
            categoria,
            vidas: 6,
            erros: 0,
            letras: []
          });

          const palavraOculta = palavra
            .split("")
            .map(() => "_")
            .join(" ");

          const embed = new EmbedBuilder()
            .setTitle("🎮 Jogo iniciado")
            .setDescription(
              `📚 Categoria: **${categoria}**\n\n` +
              `🔤 Palavra:\n\`${palavraOculta}\`\n\n` +
              `❤️ Vidas: **6**\n\n` +
              `Digite letras no chat.`
            )
            .setColor("Green");

          await interaction.reply({
            embeds: [embed]
          });
        }
      }

      // ===== BOTÃO =====

      if (interaction.isButton()) {

        if (interaction.customId === "encerrar_forca") {

          if (!jogos.has(interaction.user.id)) {
            return interaction.reply({
              content: "❌ Você não possui jogo ativo.",
              ephemeral: true
            });
          }

          jogos.delete(interaction.user.id);

          interaction.reply({
            content: "🛑 Jogo encerrado.",
            ephemeral: true
          });
        }
      }

    } catch (err) {
      console.log(err);
    }

  });

};
