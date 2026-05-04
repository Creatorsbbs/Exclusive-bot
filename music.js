const { EmbedBuilder } = require("discord.js");
const { DisTube } = require("distube");
const { YouTubePlugin } = require("@distube/youtube");

module.exports = (client) => {

  const prefix = "E";

  const distube = new DisTube(client, {
    emitNewSongOnly: true,
    plugins: [new YouTubePlugin()],
  });

  // 🎶 Quando começa a tocar
  distube.on("playSong", (queue, song) => {
    const embed = new EmbedBuilder()
      .setColor("#2f3136")
      .setTitle("🎶 Tocando Agora")
      .setDescription(`**${song.name}**`)
      .addFields(
        { name: "⏱️ Duração", value: song.formattedDuration, inline: true },
        { name: "👤 Pedido por", value: song.user.tag, inline: true }
      )
      .setThumbnail(song.thumbnail);

    queue.textChannel.send({ embeds: [embed] });
  });

  // ❌ ERRO GLOBAL (AGORA MOSTRA O ERRO REAL)
  distube.on("error", (channel, error) => {
    console.error("ERRO PLAY:", error);

    if (channel) {
      channel.send(`❌ Erro ao tocar música:\n\`\`\`${error.message}\`\`\``);
    }
  });

  // 🎧 Comandos
  client.on("messageCreate", async (message) => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    const voiceChannel = message.member.voice.channel;

    // ▶️ PLAY
    if (command === "play") {
      if (!voiceChannel)
        return message.reply("❌ Entra em um canal de voz!");

      const query = args.join(" ");
      if (!query)
        return message.reply("❌ Coloca o nome ou link da música!");

      try {
        await distube.play(voiceChannel, query, {
          member: message.member,
          textChannel: message.channel,
        });
      } catch (e) {
        console.error("ERRO PLAY:", e);
        message.reply("❌ Não consegui tocar essa música!");
      }
    }

    const queue = distube.getQueue(message.guildId);

    // ⏸️ PAUSE
    if (command === "pause") {
      if (!queue) return message.reply("❌ Nada tocando!");

      distube.pause(message.guildId);
      message.channel.send("⏸️ Música pausada!");
    }

    // ▶️ RESUME
    if (command === "resume") {
      if (!queue) return message.reply("❌ Nada tocando!");

      distube.resume(message.guildId);
      message.channel.send("▶️ Música retomada!");
    }

    // ⏭️ SKIP
    if (command === "skip") {
      if (!queue) return message.reply("❌ Nada na fila!");

      try {
        await distube.skip(message.guildId);
        message.channel.send("⏭️ Música pulada!");
      } catch {
        message.reply("❌ Não tem próxima música!");
      }
    }

    // ⏹️ STOP
    if (command === "stop") {
      if (!queue) return message.reply("❌ Nada tocando!");

      distube.stop(message.guildId);
      message.channel.send("⏹️ Música parada!");
    }
  });
};
