
const { EmbedBuilder } = require("discord.js");

const {
    convertMillisecondsToTime
} = require("../../../utils/musicUtils/index");

module.exports = {
    name: "remove",
    description: "Remove a song from the queue.",
    usage: "<song number>",
    category: "music",
    aliases: ["rm"],
    player: {
        voice: true,
        active: true,
        sameVoice: true,
        dj: true,
    },
    run: async (message, args, client, prefix) => {
        let guildPlayer = await client.musicManager.players.get(message.guildId);

        if (!args.length) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **Please provide a song number to remove.\nUsage: \`${prefix}remove <song number>\`**`,
                );

            return message.reply({
                embeds: [emb],
            });
        }

        if (!guildPlayer.queue.tracks.length) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **There are no songs in the queue to remove.**`,
                );

            return message.reply({
                embeds: [emb],
            });
        }

        let songNumber = Number(args[0]);

        if (
            !Number.isInteger(songNumber) ||
            songNumber <= 0 ||
            songNumber > guildPlayer.queue.tracks.length
        ) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **Please provide a valid song number between \`1\` and \`${guildPlayer.queue.tracks.length}\`.**`,
                );

            return message.reply({
                embeds: [emb],
            });
        }

        try {
            let track = guildPlayer.queue.tracks[songNumber - 1];

            await guildPlayer.queue.remove(songNumber - 1);

            let emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **Removed *[${track.title}](${track.uri})* from the queue.**`,
                )
                .addFields([
                    {
                        name: "Duration",
                        value: `\`${track.duration ? `${convertMillisecondsToTime(track.duration)}` : track.isStream ? `${client.emojiList?.livestream} Live Stream ]` : "Unknown Duration"}\``,
                        inline: true,
                    },
                    {
                        name: "Position",
                        value: `\`${songNumber}\``,
                        inline: true,
                    },
                    {
                        name: "Requester",
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
                    `${client.emojiList.cross} | **An error occurred while trying to \`remove\` the song.**`,
                );

            return message.reply({
                embeds: [emb],
            });
        }
    }
};