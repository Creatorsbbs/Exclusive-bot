const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionsBitField
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ================= START =================
client.once("ready", async () => {
  console.log(`🤖 Online como ${client.user.tag}`);

  // auto setup em todos servidores
  client.guilds.cache.forEach(guild => setupServer(guild));
});

// ================= AUTO SETUP =================
async function setupServer(guild) {
  try {

    let staffRole = guild.roles.cache.find(r => r.name === "STAFF");

    if (!staffRole) {
      staffRole = await guild.roles.create({
        name: "STAFF",
        color: "Red"
      });
      console.log("✔ Cargo STAFF criado");
    }

    let logChannel = guild.channels.cache.find(c => c.name === "logs");

    if (!logChannel) {
      logChannel = await guild.channels.create({
        name: "logs",
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionsBitField.Flags.ViewChannel]
          },
          {
            id: staffRole.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages
            ]
          }
        ]
      });

      console.log("✔ Canal logs criado");
    }

  } catch (err) {
    console.log("Erro setup:", err);
  }
}

// ================= /PAINEL =================
client.on("interactionCreate", async (interaction) => {
  try {

    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "painel") {

      await interaction.deferReply(); // 🔥 resolve "app não respondeu"

      const embed = new EmbedBuilder()
        .setTitle("🎫 CENTRAL DE ATENDIMENTO")
        .setDescription(
          "👋 Bem-vindo!\n\n" +
          "💬 Suporte\n💰 Vendas\n🚨 Denúncia\n\n" +
          "⚡ Sistema automático de tickets"
        )
        .setColor("#2b2d31");

      .setImage("https://imgur.com/gallery/comunnity-vp-NFiakG9#OQDDy4C")
      
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket_suporte")
          .setLabel("💬 Suporte")
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId("ticket_vendas")
          .setLabel("💰 Vendas")
          .setStyle(ButtonStyle.Primary),

        new ButtonBuilder()
          .setCustomId("ticket_denuncia")
          .setLabel("🚨 Denúncia")
          .setStyle(ButtonStyle.Danger)
      );

      return interaction.editReply({
        embeds: [embed],
        components: [row]
      });
    }

  } catch (err) {
    console.log("Erro /painel:", err);

    if (interaction.deferred || interaction.replied) {
      interaction.editReply("❌ Erro ao abrir painel.");
    }
  }
});

// ================= TICKETS =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const guild = interaction.guild;
  const user = interaction.user;

  const staffRole = guild.roles.cache.find(r => r.name === "STAFF");

  async function createTicket(type) {

    const channel = await guild.channels.create({
      name: `ticket-${type}-${user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        },
        {
          id: staffRole?.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages
          ]
        }
      ]
    });

    const embed = new EmbedBuilder()
      .setTitle(`🎫 Ticket ${type}`)
      .setDescription(`👤 ${user}\nExplique seu problema abaixo.`)
      .setColor("Green");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("call_staff")
        .setLabel("🔔 Chamar Staff")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("🔒 Fechar")
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({ content: `${user}`, embeds: [embed], components: [row] });

    const log = guild.channels.cache.find(c => c.name === "logs");
    if (log) log.send(`📌 Ticket aberto: ${type} | ${user.tag}`);

    return interaction.reply({
      content: `🎫 Ticket criado: ${channel}`,
      ephemeral: true
    });
  }

  if (interaction.customId === "ticket_suporte") return createTicket("suporte");
  if (interaction.customId === "ticket_vendas") return createTicket("vendas");
  if (interaction.customId === "ticket_denuncia") return createTicket("denuncia");

  if (interaction.customId === "call_staff") {
    interaction.channel.send(`🔔 ${user} chamou a staff!`);
    return interaction.reply({ content: "Staff notificada!", ephemeral: true });
  }

  if (interaction.customId === "close_ticket") {
    await interaction.channel.send("🔒 Fechando ticket...");
    setTimeout(() => interaction.channel.delete().catch(() => {}), 4000);
  }
});

client.login(process.env.TOKEN);
