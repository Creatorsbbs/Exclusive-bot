module.exports = (client) => {

  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const args = message.content.split(" ");
    const cmd = args[0];

    // ===== BAN =====
    if (cmd === "!ban") {
      if (!message.member.permissions.has("BanMembers"))
        return message.reply("❌ Você não tem permissão.");

      const user = message.mentions.members.first();
      if (!user) return message.reply("Marca alguém.");

      await user.ban();
      message.reply(`🔨 ${user.user.tag} foi banido.`);
    }

    // ===== KICK =====
    if (cmd === "!kick") {
      if (!message.member.permissions.has("KickMembers"))
        return message.reply("❌ Você não tem permissão.");

      const user = message.mentions.members.first();
      if (!user) return message.reply("Marca alguém.");

      await user.kick();
      message.reply(`👢 ${user.user.tag} foi expulso.`);
    }

    // ===== CASTIGO (timeout) =====
    if (cmd === "!castigar") {
      if (!message.member.permissions.has("ModerateMembers"))
        return message.reply("❌ Você não tem permissão.");

      const user = message.mentions.members.first();
      if (!user) return message.reply("Marca alguém.");

      await user.timeout(10 * 60 * 1000); // 10 minutos
      message.reply(`⏳ ${user.user.tag} ficou de castigo por 10 minutos.`);
    }

    // ===== BLOQUEAR LINKS =====
    const linkRegex = /(https?:\/\/|discord\.gg\/)/i;

    if (linkRegex.test(message.content)) {
      if (!message.member.permissions.has("ManageMessages")) {
        await message.delete();

        message.channel.send(
          `🚫 ${message.author}, não envie links aqui.\nAss: Eris`
        );
      }
    }

  });

};
