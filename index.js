const {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType,
  PermissionsBitField
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

// ================= BOT ONLINE =================
client.once("ready", () => {
  console.log(`🤖 Bot online como ${client.user.tag}`);
});


// ================= PAINEL =================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!ticket") {

    const embed = new EmbedBuilder()
      .setTitle("🎫 Central de Atendimento ULTIMATE")
      .setDescription(
        "👋 Bem-vindo ao suporte oficial!\n\n" +
        "📌 Escolha uma categoria:\n" +
        "💬 Suporte → dúvidas\n" +
        "💰 Vendas → compras\n" +
        "🚨 Denúncia → reportes\n\n" +
        "⚡ Sistema automático e rápido"
      )
      .setColor("#2b2d31");

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

    message.channel.send({ embeds: [embed], components: [row] });
  }
});


// ================= INTERAÇÕES =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const guild = interaction.guild;
  const user = interaction.user;

  // ===== CRIAR TICKET =====
  async function createTicket(type, priority = "normal") {

    const category = guild.channels.cache.find(c => c.name === "TICKETS" && c.type === 4);

    const channel = await guild.channels.create({
      name: `ticket-${type}-${user.username}`,
      type: ChannelType.GuildText,
      parent: category ? category.id : null,
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
        }
      ]
    });

    const embed = new EmbedBuilder()
      .setTitle(`🎫 Ticket ${type.toUpperCase()}`)
      .setDescription(
        `👤 Usuário: ${user}\n` +
        `⚡ Prioridade: ${priority}\n\n` +
        "📌 Explique seu problema abaixo.\n\n" +
        "🔔 Use os botões para interação."
      )
      .setColor(priority === "alta" ? "Red" : "Green");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("call_staff")
        .setLabel("🔔 Chamar Staff")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("🔒 Fechar Ticket")
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({
      content: `${user}`,
      embeds: [embed],
      components: [row]
    });

    interaction.reply({
      content: `🎫 Ticket criado: ${channel}`,
      ephemeral: true
    });

    const log = guild.channels.cache.find(c => c.name === "logs");
    if (log) log.send(`📌 Ticket aberto: ${type} | ${user.tag}`);
  }

  // ===== TIPOS =====
  if (interaction.customId === "ticket_suporte") return createTicket("suporte");
  if (interaction.customId === "ticket_vendas") return createTicket("vendas");
  if (interaction.customId === "ticket_denuncia") return createTicket("denuncia");


  // ===== CHAMAR STAFF =====
  if (interaction.customId === "call_staff") {
    interaction.channel.send(`🔔 ${user} chamou a staff!`);
    return interaction.reply({ content: "📣 Staff notificada!", ephemeral: true });
  }


  // ================= FECHAR =================
  if (interaction.customId === "close_ticket") {

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirm_close")
        .setLabel("✔ Confirmar")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId("cancel_close")
        .setLabel("❌ Cancelar")
        .setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({
      content: "⚠️ Tem certeza que deseja fechar o ticket?",
      components: [row],
      ephemeral: true
    });
  }


  // ===== CONFIRMAR FECHAMENTO =====
  if (interaction.customId === "confirm_close") {

    const log = interaction.guild.channels.cache.find(c => c.name === "logs");
    if (log) log.send(`🔒 Ticket fechado por ${user.tag} | ${interaction.channel.name}`);

    await interaction.channel.send("📜 Gerando transcript...");

    // ===== TRANSCRIPT SIMPLES =====
    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    let transcript = "";

    messages.reverse().forEach(m => {
      transcript += `[${m.author.tag}] ${m.content}\n`;
    });

    console.log("📜 TRANSCRIPT:\n", transcript);

    // ===== FECHAR =====
    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
    }, 5000);

    return interaction.reply({
      content: "🔒 Ticket fechado com sucesso.",
      ephemeral: true
    });
  }


  // ===== CANCELAR =====
  if (interaction.customId === "cancel_close") {
    return interaction.reply({
      content: "❌ Fechamento cancelado.",
      ephemeral: true
    });
  }
});

client.login(process.env.TOKEN);
