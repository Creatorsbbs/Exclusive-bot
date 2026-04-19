const { PermissionsBitField } = require('discord.js');

module.exports = (client) => {

  const confirmacoes = new Map();

  client.on("messageCreate", async (message) => {

    if (!message.guild) return;
    if (message.author.bot) return;

    const args = message.content.trim().split(/\s+/);
    const comando = args[0]?.toLowerCase();

    // ================= BLOQUEAR LINKS =================
    const linkRegex = /(discord\.gg\/|discord\.com\/invite\/)\S+/i;

    if (linkRegex.test(message.content)) {

  // ignora moderador
  if (message.member && message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;

  try {
    await message.delete();

    return message.reply({
  content: "❌ Não envie links de convite aqui.",
  allowedMentions: { repliedUser: true }
});

} catch (err) {
    console.log("Erro ao deletar:", err);
  }
      }
    }

    // ================= CONFIRMAÇÃO =================
    if (confirmacoes.has(message.author.id)) {
      const data = confirmacoes.get(message.author.id);

      if (!data || message.channel.id !== data.channelId) return;

      if (comando.startsWith("!")) {
        return message.reply("⚠️ Responda 'sim' ou 'não' antes de usar outro comando.");
      }

      const resposta = message.content.toLowerCase();

      if (resposta === "sim") {
        confirmacoes.delete(message.author.id);

        try {
          if (data.tipo === "ban") {
            if (!data.user.bannable) throw new Error();
            await data.user.ban();
            return message.reply(`✅ ${data.user.user.tag} foi banido.`);
          }

          if (data.tipo === "kick") {
            if (!data.user.kickable) throw new Error();
            await data.user.kick();
            return message.reply(`✅ ${data.user.user.tag} foi expulso.`);
          }

          if (data.tipo === "castigar") {
            if (!data.user.moderatable) throw new Error();
            await data.user.timeout(10 * 60 * 1000);
            return message.reply(`✅ ${data.user.user.tag} ficou de castigo.`);
          }
        } catch (err) {
  console.log(err);
  return message.reply("❌ Não consegui executar essa ação.");
        }
      }

      if (["não", "nao"].includes(resposta)) {
        confirmacoes.delete(message.author.id);
        return message.reply("❌ Ação cancelada.");
      }

      return;
    }

    function validarAlvo(user) {
      if (!user) return "Marque alguém.";

      if (user.id === message.author.id) return "❌ Você não pode se punir.";

      if (user.id === message.guild.ownerId) return "❌ Não pode punir o dono.";

      if (user.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return "❌ Não pode punir administrador.";
      }

      if (message.member.roles.highest.position <= user.roles.highest.position) {
        return "❌ Cargo igual ou maior que o seu.";
      }

      return null;
    }

    // ================= BAN =================
    if (comando === "!ban") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
        return message.reply("❌ Sem permissão.");
      }

      const user = message.mentions.members.first();
      const erro = validarAlvo(user);
      if (erro) return message.reply(erro);

      confirmacoes.delete(message.author.id);
      confirmacoes.set(message.author.id, {
        tipo: "ban",
        user,
        channelId: message.channel.id
      });

      setTimeout(() => confirmacoes.delete(message.author.id), 30000);

      return message.reply(`⚠️ Confirmar BAN em ${user.user.tag}? (sim/não - 30s)`);
    }

    // ================= KICK =================
    if (comando === "!kick") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
        return message.reply("❌ Sem permissão.");
      }

      const user = message.mentions.members.first();
      const erro = validarAlvo(user);
      if (erro) return message.reply(erro);

      confirmacoes.delete(message.author.id);
      confirmacoes.set(message.author.id, {
        tipo: "kick",
        user,
        channelId: message.channel.id
      });

      setTimeout(() => confirmacoes.delete(message.author.id), 30000);

      return message.reply(`⚠️ Confirmar KICK em ${user.user.tag}? (sim/não - 30s)`);
    }

    // ================= CASTIGAR =================
    if (comando === "!castigar") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
        return message.reply("❌ Sem permissão.");
      }

      const user = message.mentions.members.first();
      const erro = validarAlvo(user);
      if (erro) return message.reply(erro);

      confirmacoes.delete(message.author.id);
      confirmacoes.set(message.author.id, {
        tipo: "castigar",
        user,
        channelId: message.channel.id
      });

      setTimeout(() => confirmacoes.delete(message.author.id), 30000);

      return message.reply(`⚠️ Confirmar CASTIGO em ${user.user.tag}? (sim/não - 30s)`);
    }

  });

};
