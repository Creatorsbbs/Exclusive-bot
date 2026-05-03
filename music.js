const { EmbedBuilder } = require("discord.js");
const { DisTube } = require("distube");
const { YtDlpPlugin } = require("@distube/yt-dlp");

// 🔥 força ffmpeg no Railway
const ffmpeg = require("ffmpeg-static");
process.env.FFMPEG_PATH = ffmpeg;

module.exports = (client) => {

  const prefix = "E";

  const distube = new DisTube(client, {
    emitNewSongOnly: true,
    plugins: [new YtDlpPlugin()],
    ffmpeg: {
      path: process.env.FFMPEG_PATH,
    },
  });

  // 🎶 quando toca música
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

  // ❌ erro
  distube.on("error", (channel, error) => {
    console.error("ERRO REAL:", error);
    if (channel) channel.send("❌ Erro ao tocar música.");
  });

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
        return message.reply("❌ Coloca nome ou link!");

      try {
        await distube.play(voiceChannel, query, {
          member: message.member,
          textChannel: message.channel,
        });
      } catch (e) {
        console.error("ERRO PLAY:", e);
        message.reply("❌ Erro ao tocar música.");
      }
    }

    // 🔎 fila correta
    const queue = distube.getQueue(message.guild);

    // ⏸️ PAUSE
    if (command === "pause") {
      if (!queue) return message.reply("❌ Nada tocando!");
      distube.pause(message.guild);
      message.channel.send("⏸️ Pausado!");
    }

    // ▶️ RESUME
    if (command === "resume") {
      if (!queue) return message.reply("❌ Nada tocando!");
      distube.resume(message.guild);
      message.channel.send("▶️ Voltou!");
    }

    // ⏭️ SKIP
    if (command === "skip") {
      if (!queue) return message.reply("❌ Nada na fila!");
      try {
        await distube.skip(message.guild);
        message.channel.send("⏭️ Pulou!");
      } catch {
        message.reply("❌ Não tem próxima!");
      }
    }

    // ⏹️ STOP
    if (command === "stop") {
      if (!queue) return message.reply("❌ Nada tocando!");
      distube.stop(message.guild);
      message.channel.send("⏹️ Parado!");
    }
  });
};
