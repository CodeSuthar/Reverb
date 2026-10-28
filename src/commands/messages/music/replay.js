const {
    EmbedBuilder
} = require("discord.js");

const {
    convertMillisecondsToTime
} = require("../../../utils/musicUtils/index");

module.exports = {
    name: "replay",
    description: "Replay the current song from the beginning.",
    usage: "",
    category: "music",
    aliases: ["rp", "replaytrack", "replaycurrent"],
    player: {
        voice: true,
        active: true,
        sameVoice: true,
        playing: true,
        dj: true,
    },
    run: async (message, args, client, prefix) => {
        let guildPlayer = await client.musicManager.players.get(message.guildId);

        if (!guildPlayer.current.isSeekable || guildPlayer.current.isStream) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **The current song cannot be replayed from the beginning because it is not seekable.**`,
                );

            return message.reply({
                embeds: [emb],
            });
        }

        try {
            await guildPlayer.seek(0);

            let track = guildPlayer.current;

            let emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **Replaying *[${track.title}](${track.uri})* from the beginning.**`,
                )
                .addFields([
                    {
                        name: "Duration",
                        value: `\`${track.duration ? `${convertMillisecondsToTime(track.duration)}` : track.isStream ? `${client.emojiList?.livestream} Live Stream` : "Unknown Duration"}\``,
                        inline: true,
                    },
                    {
                        name: "Replayed By",
                        value: `${track.requester || message.member}`,
                        inline: true,
                    },
                ])
                .setTimestamp();

            if (track.artworkUrl) emb.setThumbnail(track.artworkUrl);

            return message.reply({
                embeds: [emb],
            });
        } catch (err) {
            console.dir(err, { depth: null });

            if (err.errors) {
                console.dir(err.errors, { depth: null });
            }

            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **An error occurred while trying to \`replay\` the song.**`,
                );

            return message.reply({
                embeds: [emb],
            });
        }
    }
};