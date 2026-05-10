const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");

// ================= MAPAS =================

const salas = new Map();
const canaisAtivos = new Map();

// ================= CONFIG =================

const MAX_PLAYERS = 5;
const TEMPO_SALA = 180000;

// ================= PALAVRAS =================

const categorias = {
  jogos: [
    "minecraft",
    "fortnite",
    "valorant",
    "roblox",
    "freefire"
  ],

  animes: [
    "naruto",
    "onepiece",
    "bleach",
    "dragonball"
  ],

  animais: [
    "girafa",
    "elefante",
    "jacare",
    "ornitorrinco"
  ],

  geral: [
    "internet",
    "bicicleta",
    "tempestade",
    "computador"
  ]
};

// ================= FORCA =================

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

// ================= EMBED =================

function criarEmbed(jogo) {

  const palavraAtual = jogo.palavra
    .split("")
    .map(l =>
      jogo.letras.includes(l) ? l : "_"
    )
    .join(" ");

  const jogadorAtual =
    jogo.players[jogo.turno];

  return new EmbedBuilder()
    .setTitle("🎮 Forca Multiplayer")
    .setDescription(
      `📚 Categoria: **${jogo.categoria}**\n\n` +
      `🔤 Palavra:\n\`${palavraAtual}\`\n\n` +
      `❤️ Vidas: **${jogo.vidas}**\n\n` +
      `👑 Vez de:\n<@${jogadorAtual.id}>\n\n` +
      `👥 Jogadores (${jogo.players.length}/${MAX_PLAYERS}):\n${jogo.players.map(p => `• ${p.username}`).join("\n")}\n\n` +
      `🔠 Letras usadas:\n${jogo.letras.join(", ") || "Nenhuma"}\n\n` +
      `\`\`\`${forcaStages[jogo.erros]}\`\`\``
    )
    .setColor("Blue");

}

// ================= MENU =================

function criarMenuLetras(jogo) {

  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    .split("")
    .filter(l =>
      !jogo.letras.includes(l.toLowerCase())
    );

  if (letras.length <= 0) {

    return [
      new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`fim_${jogo.id}`)
            .setLabel("Sem letras")
            .setDisabled(true)
            .setStyle(ButtonStyle.Secondary)
        )
    ];

  }

  const grupos = [];

  for (let i = 0; i < letras.length; i += 25) {
    grupos.push(letras.slice(i, i + 25));
  }

  const rows = [];

  grupos.forEach((grupo, index) => {

    const menu = new StringSelectMenuBuilder()
      .setCustomId(`letras_${jogo.id}_${index}`)
      .setPlaceholder(
        index === 0
          ? "Escolha uma letra"
          : "Mais letras"
      )
      .addOptions(
        grupo.map(letra => ({
          label: letra,
          value: letra
        }))
      );

    rows.push(
      new ActionRowBuilder()
        .addComponents(menu)
    );

  });

  rows.push(
    new ActionRowBuilder()
      .addComponents(
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

  client.on("interactionCreate", async (interaction) => {

    try {

      // ================= SLASH COMMAND =================

      if (
        interaction.isChatInputCommand() &&
        interaction.commandName === "forca"
      ) {

        // ===== UMA PARTIDA POR CANAL =====

        if (canaisAtivos.has(interaction.channel.id)) {

          return interaction.reply({
            content: "❌ Já existe uma partida ativa neste canal.",
            ephemeral: true
          });
        }

        const salaId =
          `${interaction.channel.id}-${Date.now()}`;

        salas.set(salaId, {
          id: salaId,
          dono: interaction.user.id,
          players: [interaction.user],
          started: false,
          letras: [],
          vidas: 6,
          erros: 0,
          turno: 0,
          channelId: interaction.channel.id,
          timeout: null
        });

        canaisAtivos.set(
          interaction.channel.id,
          salaId
        );

        const embed = new EmbedBuilder()
          .setTitle("🎮 Sala Multiplayer")
          .setDescription(
            `👑 Dono: ${interaction.user}\n\n` +
            `👥 Jogadores (1/${MAX_PLAYERS}):\n• ${interaction.user.username}\n\n` +
            `⏳ A sala será encerrada em 3 minutos caso não inicie.\n\n` +
            `Clique em **Entrar** para participar.`
          )
          .setColor("Purple");

        const row = new ActionRowBuilder()
          .addComponents(

            new ButtonBuilder()
              .setCustomId(`entrar_${salaId}`)
              .setLabel("Entrar")
              .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
              .setCustomId(`iniciar_${salaId}`)
              .setLabel("Iniciar")
              .setStyle(ButtonStyle.Primary)

          );

        const msg = await interaction.reply({
          embeds: [embed],
          components: [row],
          fetchReply: true
        });

        const timeout = setTimeout(async () => {

          const sala = salas.get(salaId);

          if (!sala) return;

          if (!sala.started) {

            salas.delete(salaId);

            canaisAtivos.delete(
              interaction.channel.id
            );

            const encerrado = new EmbedBuilder()
              .setTitle("💀 Sala encerrada")
              .setDescription(
                "A sala foi encerrada por inatividade."
              )
              .setColor("Red");

            await msg.edit({
              embeds: [encerrado],
              components: []
            }).catch(() => {});

          }

        }, TEMPO_SALA);

        salas.get(salaId).timeout = timeout;

      }

      // ================= BOTÕES =================

      if (interaction.isButton()) {

        // ===== ENTRAR =====

        if (interaction.customId.startsWith("entrar_")) {

          const salaId =
            interaction.customId.replace("entrar_", "");

          const sala = salas.get(salaId);

          if (!sala) {

            return interaction.reply({
              content: "❌ Sala não encontrada.",
              ephemeral: true
            });
          }

          if (sala.started) {

            return interaction.reply({
              content: "❌ O jogo já começou.",
              ephemeral: true
            });
          }

          if (sala.players.length >= MAX_PLAYERS) {

            return interaction.reply({
              content: "❌ A sala está cheia.",
              ephemeral: true
            });
          }

          const jaEntrou =
            sala.players.find(
              p => p.id === interaction.user.id
            );

          if (jaEntrou) {

            return interaction.reply({
              content: "⚠️ Você já entrou na sala.",
              ephemeral: true
            });
          }

          sala.players.push(interaction.user);

          const embed = new EmbedBuilder()
            .setTitle("🎮 Sala Multiplayer")
            .setDescription(
              `👑 Dono: <@${sala.dono}>\n\n` +
              `👥 Jogadores (${sala.players.length}/${MAX_PLAYERS}):\n${sala.players.map(p => `• ${p.username}`).join("\n")}\n\n` +
              `⏳ Aguardando início...`
            )
            .setColor("Purple");

          return interaction.update({
            embeds: [embed],
            components: interaction.message.components
          });

        }

        // ===== INICIAR =====

        if (interaction.customId.startsWith("iniciar_")) {

          const salaId =
            interaction.customId.replace("iniciar_", "");

          const sala = salas.get(salaId);

          if (!sala) {

            return interaction.reply({
              content: "❌ Sala não encontrada.",
              ephemeral: true
            });
          }

          if (interaction.user.id !== sala.dono) {

            return interaction.reply({
              content: "❌ Apenas o dono da sala pode iniciar.",
              ephemeral: true
            });
          }

          if (sala.started) {

            return interaction.reply({
              content: "❌ O jogo já foi iniciado.",
              ephemeral: true
            });
          }

          if (sala.players.length < 2) {

            return interaction.reply({
              content: "❌ Precisa de pelo menos 2 jogadores.",
              ephemeral: true
            });
          }

          clearTimeout(sala.timeout);

          const categoria = "geral";

          const lista = categorias[categoria];

          const palavra =
            lista[Math.floor(Math.random() * lista.length)];

          sala.started = true;
          sala.categoria = categoria;
          sala.palavra = palavra;

          return interaction.update({
            embeds: [criarEmbed(sala)],
            components: criarMenuLetras(sala)
          });

        }

        // ===== ENCERRAR =====

        if (interaction.customId.startsWith("encerrar_")) {

          const salaId =
            interaction.customId.replace("encerrar_", "");

          const sala = salas.get(salaId);

          if (!sala) {

            return interaction.reply({
              content: "❌ Sala não encontrada.",
              ephemeral: true
            });
          }

          clearTimeout(sala.timeout);

          salas.delete(salaId);

          canaisAtivos.delete(
            sala.channelId
          );

          return interaction.update({
            embeds: [
              new EmbedBuilder()
                .setTitle("🛑 Partida encerrada")
                .setDescription(
                  "A partida foi encerrada manualmente."
                )
                .setColor("Red")
            ],
            components: []
          });

        }

      }

      // ================= SELECT MENU =================

      if (interaction.isStringSelectMenu()) {

        if (interaction.customId.startsWith("letras_")) {

          const salaId =
            interaction.customId
              .replace("letras_", "")
              .split("_")[0];

          const sala = salas.get(salaId);

          if (!sala) {

            return interaction.reply({
              content: "❌ Sala não encontrada.",
              ephemeral: true
            });
          }

          const jogadorAtual =
            sala.players[sala.turno];

          // ===== TURNO =====

          if (interaction.user.id !== jogadorAtual.id) {

            return interaction.reply({
              content:
                `❌ Não é sua vez.\n🎯 Vez de: ${jogadorAtual.username}`,
              ephemeral: true
            });
          }

          const letra =
            interaction.values[0].toLowerCase();

          // ===== LETRA REPETIDA =====

          if (sala.letras.includes(letra)) {

            return interaction.reply({
              content: "⚠️ Essa letra já foi usada.",
              ephemeral: true
            });
          }

          sala.letras.push(letra);

          // ===== ERRO =====

          if (!sala.palavra.includes(letra)) {

            sala.vidas--;
            sala.erros++;

          }

          const palavraAtual = sala.palavra
            .split("")
            .map(l =>
              sala.letras.includes(l) ? l : "_"
            )
            .join(" ");

          // ===== DERROTA =====

          if (sala.vidas <= 0) {

            clearTimeout(sala.timeout);

            salas.delete(salaId);

            canaisAtivos.delete(
              sala.channelId
            );

            return interaction.update({
              embeds: [
                new EmbedBuilder()
                  .setTitle("💀 Todos perderam")
                  .setDescription(
                    `A palavra era:\n\n🔤 **${sala.palavra}**`
                  )
                  .setColor("Red")
              ],
              components: []
            });

          }

          // ===== VITÓRIA =====

          if (!palavraAtual.includes("_")) {

            clearTimeout(sala.timeout);

            salas.delete(salaId);

            canaisAtivos.delete(
              sala.channelId
            );

            return interaction.update({
              embeds: [
                new EmbedBuilder()
                  .setTitle("🏆 Vitória")
                  .setDescription(
                    `Os jogadores acertaram:\n\n🎉 **${sala.palavra}**`
                  )
                  .setColor("Green")
              ],
              components: []
            });

          }

          // ===== PRÓXIMO TURNO =====

          sala.turno++;

          if (sala.turno >= sala.players.length) {
            sala.turno = 0;
          }

          return interaction.update({
            embeds: [criarEmbed(sala)],
            components: criarMenuLetras(sala)
          });

        }

      }

    } catch (err) {

      console.log("ERRO FORCA:", err);

      if (
        interaction &&
        !interaction.replied &&
        !interaction.deferred
      ) {

        interaction.reply({
          content: "❌ Ocorreu um erro.",
          ephemeral: true
        }).catch(() => {});

      }

    }

  });

};
