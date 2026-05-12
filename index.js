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

const ticketOwners = new Map();
const ticketData = new Map();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

require("./forca")(client);

// ================= READY =================
client.once("ready", async () => {
  console.log(`🤖 Online como ${client.user.tag}`);

  client.guilds.cache.forEach(guild => setupServer(guild));
});

// ================= SETUP =================
async function setupServer(guild) {
  try {

    // ===== STAFF ROLE (SEM DUPLICAR) =====
    let staffRoleId = await db.get(`staffRole_${guild.id}`);
    let staffRole = null;

    if (staffRoleId) {
      staffRole =
        guild.roles.cache.get(staffRoleId) ||
        await guild.roles.fetch(staffRoleId).catch(() => null);
    }

    if (!staffRole) {
      staffRole = guild.roles.cache.find(r => r.name === "STAFF");

      if (!staffRole) {
        staffRole = await guild.roles.create({
          name: "STAFF",
          color: "Red"
        });
        console.log("✔ Cargo STAFF criado");
      }

      await db.set(`staffRole_${guild.id}`, staffRole.id);
    }

    // ===== LOGS =====
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

    // ===== CATEGORIA =====
    let ticketCategory = guild.channels.cache.find(
      c => c.name === "🎫 TICKETS" && c.type === ChannelType.GuildCategory
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
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "painel") {

    const embed = new EmbedBuilder()
      .setTitle("🎫 CENTRAL DE ATENDIMENTO")
      .setDescription("Clique nos botões para abrir um ticket.")
      .setColor("#2b2d31");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ticket_suporte").setLabel("Suporte").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("ticket_vendas").setLabel("Vendas").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("ticket_denuncia").setLabel("Denúncia").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("ticket_parceria").setLabel("Parceria").setStyle(ButtonStyle.Secondary)
    );

    return interaction.reply({ embeds: [embed], components: [row] });
  }
});

// ================= TICKETS =================
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const guild = interaction.guild;
  const user = interaction.user;

  const staffRoleId = await db.get(`staffRole_${guild.id}`);
  const staffRole = staffRoleId ? guild.roles.cache.get(staffRoleId) : null;

  const category = guild.channels.cache.find(
    c => c.name === "🎫 TICKETS" && c.type === ChannelType.GuildCategory
  );

  async function createTicket(type) {

    const channel = await guild.channels.create({
      name: `ticket-${type}-${user.username}`,
      type: ChannelType.GuildText,
      parent: category?.id,

      permissionOverwrites: [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        { id: staffRole?.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] }
      ]
    });

    ticketOwners.set(channel.id, user.id);

    ticketData.set(channel.id, {
      createdAt: Date.now(),
      messages: 0,
      users: new Set([user.id])
    });

    // ===== EMBED TICKET =====
    const embed = new EmbedBuilder()
      .setTitle(`🎫 Ticket ${type}`)
      .setDescription("Explique seu problema aqui.")
      .setColor("Green");

    await channel.send({
      content: `<@&${staffRole?.id}> ${user}`,
      embeds: [embed]
    });

    // ===== LOG ABERTURA =====
    const log = guild.channels.cache.find(c => c.name === "logs");

    if (log) {
      log.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("🎫 Ticket Aberto")
            .setColor("Green")
            .addFields(
              { name: "Usuário", value: user.tag },
              { name: "Tipo", value: type },
              { name: "Canal", value: channel.name },
              { name: "Data", value: `<t:${Math.floor(Date.now() / 1000)}:F>` }
            )
        ]
      });
    }

    return interaction.reply({ content: `Ticket criado: ${channel}`, ephemeral: true });
  }

  if (interaction.customId === "ticket_suporte") return createTicket("suporte");
  if (interaction.customId === "ticket_vendas") return createTicket("vendas");
  if (interaction.customId === "ticket_denuncia") return createTicket("denuncia");
  if (interaction.customId === "ticket_parceria") return createTicket("parceria");

  if (interaction.customId === "close_ticket") {

    const channel = interaction.channel;
    const data = ticketData.get(channel.id);

    const log = guild.channels.cache.find(c => c.name === "logs");

    if (log) {
      log.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("🔒 Ticket Fechado")
            .setColor("Red")
            .addFields(
              { name: "Canal", value: channel.name },
              { name: "Mensagens", value: String(data?.messages || 0) },
              { name: "Usuários", value: String(data?.users?.size || 0) },
              { name: "Fechado por", value: interaction.user.tag }
            )
        ]
      });
    }

    ticketOwners.delete(channel.id);
    ticketData.delete(channel.id);

    return channel.delete().catch(() => {});
  }
});

// ================= CONTADOR =================
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
