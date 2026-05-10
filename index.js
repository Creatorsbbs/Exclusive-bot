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

const ticketOwners = new Map();
let ticketCounter = 0;

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
        .setImage("https://cdn.discordapp.com/attachments/1264564541979627604/1502803579617022033/file_00000000e3b471f5ab60e7c25276f1ae.png?ex=6a010a66&is=69ffb8e6&hm=abdba49be0b8e2e9a01ed53a7006e5df1557b6b6d0231a9374a795983a70230d&")
      
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
      name: `🎫-${type}-${user.username.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        }
        
         ticketOwners.set(channel.id, user.id);
      
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
      .setDescription(`👤 ${user}\nOlá!
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

  const guild = interaction.guild;
  const channel = interaction.channel;
  const closer = interaction.user;

  const ownerId = ticketOwners.get(channel.id);
  const owner = await guild.members.fetch(ownerId).catch(() => null);

  const embed = new EmbedBuilder()
    .setTitle("🔒 Ticket Fechado")
    .setColor("Red")
    .addFields(
      { name: "🏠 Servidor", value: guild.name },
      { name: "🎫 Ticket", value: channel.name },
      { name: "👤 Fechado por", value: closer.tag },
      { name: "👤 Aberto por", value: owner ? owner.user.tag : "Desconhecido" }
    );

  if (owner) {
    owner.send({ embeds: [embed] }).catch(() => {});
  }

  await interaction.deferUpdate();
    
  await interaction.deferUpdate();
await interaction.channel.send("🔒 Fechando ticket...");

  setTimeout(() => {
    channel.delete().catch(() => {});
    ticketOwners.delete(channel.id);
  }, 4000);
  }
});

client.login(process.env.TOKEN);
