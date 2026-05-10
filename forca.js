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

const palavras = [
  "minecraft",
  "fortnite",
  "valorant",
  "roblox",
  "freefire",
  "naruto",
  "computador",
  "internet",
  "amizade",
  "celular"
];

// ================= FORCA VISUAL =================

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
      `🔤 Palavra: \`${palavra}\`\n\n` +
      `❤️ Vidas: ${jogo.vidas}\n` +
      `❌ Erros: ${jogo.erros}\n\n` +
      `👥 Jogadores:\n${jogo.players.map(p => `• ${p.username}`).join("\n")}\n\n` +
      `🔡 Letras usadas: ${jogo.letras.length ? jogo.letras.join(", ").toUpperCase() : "Nenhuma"}\n\n` +
      `\`\`\`${stages[jogo.erros]}\`\`\``
    )
    .setColor("Blue");
}

// ================= MENU LETRAS =================

function criarMenuLetras(jogo) {

  const alfabeto = "abcdefghijklmnopqrstuvwxyz".split("");

  const disponiveis = alfabeto.filter(l =>
    !jogo.letras.includes(l)
  );

  const rows = [];

  let pagina = 0;

  for (let i = 0; i < disponiveis.length; i += 25) {

    const grupo = disponiveis.slice(i, i + 25);

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

// ================= EXPORT =================

module.exports = (client) => {

  // ================= MESSAGE CREATE =================

  client.on("messageCreate", async (message) => {

    if (!message.guild || message.author.bot) return;

    const content = message.content.toLowerCase();

    // ===== CRIAR JOGO =====
    if (content === "!forca-mp") {

      const id = `${message.channel.id}-${Date.now()}`;

      const jogo = {
        id,
        dono: message.author.id,
        players: [message.author],
        letras: [],
        vidas: 4,
        erros: 0,
        started: false,
        channelId: message.channel.id
      };

      salas.set(id, jogo);

      const embed = new EmbedBuilder()
        .setTitle("🎮 SALA FORCA")
        .setDescription("Clique para entrar ou iniciar")
        .setColor("Purple");

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`entrar_${id}`)
          .setLabel("Entrar")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId(`iniciar_${id}`)
          .setLabel("Iniciar")
          .setStyle(ButtonStyle.Primary)
      );

      return message.channel.send({ embeds: [embed], components: [row] });
    }
  });

  // ================= INTERACTIONS =================

  client.on("interactionCreate", async (interaction) => {

    if (!interaction.isButton() && !interaction.isStringSelectMenu())
      return;

    // ================= SALA =================

    const parts = interaction.customId.split("_");
    const salaId = parts[1];
    const jogo = salas.get(salaId);

    // ===== ENTRAR =====
    if (interaction.customId.startsWith("entrar_")) {

      if (!jogo)
        return interaction.reply({ content: "Sala não existe", ephemeral: true });

      if (jogo.players.length >= MAX_PLAYERS)
        return interaction.reply({ content: "Sala cheia", ephemeral: true });

      if (jogo.players.find(p => p.id === interaction.user.id))
        return interaction.reply({ content: "Você já entrou", ephemeral: true });

      jogo.players.push(interaction.user);

      return interaction.update({
        embeds: [
          new EmbedBuilder()
            .setTitle("🎮 SALA FORCA")
            .setDescription(
              jogo.players.map(p => `• ${p.username}`).join("\n")
            )
            .setColor("Purple")
        ],
        components: interaction.message.components
      });
    }

    // ===== INICIAR =====
    if (interaction.customId.startsWith("iniciar_")) {

      if (!jogo)
        return interaction.reply({ content: "Sala não existe", ephemeral: true });

      if (interaction.user.id !== jogo.dono)
        return interaction.reply({ content: "Só o dono inicia", ephemeral: true });

      jogo.palavra =
        palavras[Math.floor(Math.random() * palavras.length)];

      jogo.started = true;

      return interaction.update({
        embeds: [criarEmbed(jogo)],
        components: criarMenuLetras(jogo)
      });
    }

    // ================= LETRAS =================

    if (interaction.isStringSelectMenu()) {

      if (!interaction.customId.startsWith("letras_"))
        return;

      const letra = interaction.values[0];

      if (!jogo)
        return interaction.reply({ content: "Jogo não encontrado", ephemeral: true });

      if (jogo.letras.includes(letra))
        return interaction.reply({ content: "Letra já usada", ephemeral: true });

      jogo.letras.push(letra);

      if (!jogo.palavra.includes(letra)) {
        jogo.erros++;
        jogo.vidas--;
      }

      const atual = jogo.palavra
        .split("")
        .map(l => jogo.letras.includes(l) ? l : "_")
        .join(" ");

      // ===== DERROTA =====
      if (jogo.vidas <= 0) {

        salas.delete(salaId);

        return interaction.update({
          content: `💀 Derrota! Palavra era: ${jogo.palavra}`,
          components: []
        });
      }

      // ===== VITÓRIA =====
      if (!atual.includes("_")) {

        salas.delete(salaId);

        return interaction.update({
          content: `🏆 Vitória! Palavra: ${jogo.palavra}`,
          components: []
        });
      }

      return interaction.update({
        embeds: [criarEmbed(jogo)],
        components: criarMenuLetras(jogo)
      });
    }

    // ================= ENCERRAR =================

    if (interaction.customId.startsWith("encerrar_")) {

      if (jogo) salas.delete(salaId);

      return interaction.update({
        content: "🛑 Jogo encerrado",
        components: []
      });
    }
  });
};
