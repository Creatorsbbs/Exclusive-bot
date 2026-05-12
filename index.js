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

const { QuickDB } = require("quick.db");
const db = new QuickDB();

// ================= DADOS =================
const ticketOwners = new Map();
const ticketData = new Map();

// ================= CLIENT =================
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

require("./forca")(client);

// ================= START =================
client.once("ready", async () => {
  console.log(`🤖 Online como ${client.user.tag}`);

  client.guilds.cache.forEach(guild => setupServer(guild));
});

// ================= AUTO SETUP =================
async function setupServer(guild) {
  try {

    // ================= CARGO STAFF =================
    let staffRoleId = await db.get(`staffRole_${guild.id}`);
let staffRole = staffRoleId ? guild.roles.cache.get(staffRoleId) : null;

if (!staffRole) {
  staffRole = await guild.roles.create({
    name: "STAFF",
    color: "Red"
  });

  await db.set(`staffRole_${guild.id}`, staffRole.id);
  console.log("✔ Cargo STAFF criado");
}

    // ================= CANAL LOGS =================
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

    // ================= CATEGORIA TICKETS =================
    let ticketCategory = guild.channels.cache.find(
      c => c.name === "🎫 TICKETS" &&
      c.type === ChannelType.GuildCategory
    );

    if (!ticketCategory) {

      ticketCategory = await guild.channels.create({
        name: "🎫 TICKETS",
        type: ChannelType.GuildCategory
      });

      console.log("✔ Categoria de tickets criada");
    }

  } catch (err) {
    console.log("Erro setup:", err);
  }
}

// ================= PAINEL =================
client.on("interactionCreate", async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "painel") {

      await interaction.deferReply();

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
    console.log("Erro painel:", err);
    if (interaction.deferred) {
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
  name: `🎫-${type}-${user.username.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
  type: ChannelType.GuildText,

  parent: guild.channels.cache.find(
    c => c.name === "🎫 TICKETS" && c.type === ChannelType.GuildCategory
  )?.id,

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

    ticketOwners.set(channel.id, user.id);

    ticketData.set(channel.id, {
      createdAt: new Date(),
      messages: 0,
      users: new Set([user.id])
    });

    const embed = new EmbedBuilder()
      .setTitle(`🎫 Ticket ${type}`)
      .setDescription(`Olá ${user}, Olá!
Seu ticket foi criado com sucesso e nossa equipe já foi notificada.

Seja bem-vindo(a) ao sistema de atendimento. Para que possamos oferecer o melhor suporte possível, pedimos que envie abaixo todas as informações relacionadas ao seu problema, dúvida ou solicitação.

📌 Informações importantes

> • Descreva seu problema de forma clara e detalhada.
> • Caso necessário, envie prints, vídeos ou comprovantes.
> • Evite mencionar membros da equipe sem necessidade.
> • Mantenha o respeito durante todo o atendimento.»

⏳ Tempo de resposta

Nossa equipe responderá assim que possível. O tempo pode variar dependendo da quantidade de tickets abertos no momento.

🔒 Privacidade

Este canal é privado e visível apenas para você e a equipe responsável pelo suporte.

Agradecemos pela paciência e preferência. ✨
Equipe de Suporte`)
      .setColor("Green");

    const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId("call_staff")
    .setLabel("🔔 Chamar Staff")
    .setStyle(ButtonStyle.Primary),

  new ButtonBuilder()
    .setCustomId("notify_client")
    .setLabel("📨 Notificar Cliente")
    .setStyle(ButtonStyle.Success),

  new ButtonBuilder()
    .setCustomId("close_ticket")
    .setLabel("🔒 Fechar")
    .setStyle(ButtonStyle.Danger)
);

    await channel.send({
  content: `🔔 <@&${staffRole.id}> <@${guild.ownerId}> ${user}`,
  embeds: [embed],
  components: [row]
});

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
  if (interaction.customId === "ticket_parceria") return createTicket("parceria");

  if (interaction.customId === "call_staff") {
    interaction.channel.send(`🔔 <@&${staffRole.id}> ${user} chamou a staff!`);
    return interaction.reply({ content: "Staff notificada!", ephemeral: true });
  }

  // ================= NOTIFICAR CLIENTE =================
if (interaction.customId === "notify_client") {

  const ownerId = ticketOwners.get(interaction.channel.id);

  if (!ownerId) {
    return interaction.reply({
      content: "❌ Dono do ticket não encontrado.",
      ephemeral: true
    });
  }

  try {

    const ticketUser = await client.users.fetch(ownerId);

    const embed = new EmbedBuilder()
      .setTitle("📨 Atualização no Atendimento")
      .setDescription(`
Olá ${ticketUser},

Sua ticket recebeu uma nova resposta da equipe.

Volte ao servidor para continuar o atendimento.
`)
      .setColor("Blue")
      .setTimestamp();

    await ticketUser.send({ embeds: [embed] });

    return interaction.reply({
      content: "✅ Cliente notificado no privado.",
      ephemeral: true
    });

  } catch (err) {

    return interaction.reply({
      content: "❌ Não consegui enviar mensagem no privado do cliente.",
      ephemeral: true
    });
  }
}

  if (interaction.customId === "close_ticket") {
    await interaction.deferUpdate();

    const channel = interaction.channel;
    const closer = interaction.user;

    const ownerId = ticketOwners.get(channel.id);
    const owner = ownerId ? await guild.members.fetch(ownerId).catch(() => null) : null;

    const data = ticketData.get(channel.id);

    const embed = new EmbedBuilder()
      .setTitle("🔒 Ticket Fechado")
      .setColor("Red")
      .addFields(
        { name: "🏠 Servidor", value: guild.name },
        { name: "🎫 Ticket", value: channel.name },
        { name: "👤 Fechado por", value: closer.tag },
        { name: "👤 Aberto por", value: owner ? owner.user.tag : "Desconhecido" },
        { name: "💬 Mensagens", value: data ? `${data.messages}` : "0" },
        { name: "👥 Participantes", value: data ? [...data.users].length.toString() : "0" },
        { name: "📅 Aberto em", value: data ? `<t:${Math.floor(data.createdAt / 1000)}:F>` : "Desconhecido" }
      );

    const log = guild.channels.cache.find(c => c.name === "logs");
    if (log) log.send({ embeds: [embed] });

    if (owner) owner.send({ embeds: [embed] }).catch(() => {});

    await channel.send("🔒 Fechando ticket...");

    setTimeout(() => {
      ticketOwners.delete(channel.id);
      ticketData.delete(channel.id);
      channel.delete().catch(() => {});
    }, 4000);
  }
});

// ================= CONTADOR DE MENSAGENS =================
client.on("messageCreate", (message) => {
  if (!message.guild) return;

  const data = ticketData.get(message.channel.id);
  if (!data) return;

  data.messages++;

  if (!data.users.has(message.author.id)) {
    data.users.add(message.author.id);
  }
});

client.login(process.env.TOKEN);
