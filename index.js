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
        .setDescription(`
          Aqui você pode abrir um atendimento de forma rápida e organizada. Escolha a opção que melhor se encaixa na sua necessidade e nossa equipe irá te atender o mais rápido possível.
💬 Suporte
Dúvidas, problemas ou ajuda geral com o servidor.
💰 Vendas
Informações sobre compras, serviços e negociações.
🚨 Denúncia
Reporte comportamentos inadequados ou situações irregulares.
🤝 Parceria
Propostas de parceria, divulgação ou colaboração entre servidores.
⚡ Nosso sistema é automático, então seu ticket será criado instantaneamente e encaminhado para a equipe responsável.
📌 Importante:
Explique sua situação com o máximo de detalhes possível para agilizar o atendimento.
        `)
        .setColor("#2b2d31")
        .setImage("https://cdn.discordapp.com/attachments/1466817788789395476/1502775980689719498/file_00000000e90071f58c96a816a57432b5.png?ex=6a00f0b2&is=69ff9f32&hm=34431c5ca70f05fcc1e1abe6e60d3a2ee4cbabc77a65b30811e5d94fc68b4831&")
      
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
          .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
          .setCustomId("ticket_parceria")
          .setLabel("🤝 Parceria")
          .setStyle(ButtonStyle.Secondary)
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
  if (interaction.customId === "ticket_parceria") return createTicket("parceria")

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
