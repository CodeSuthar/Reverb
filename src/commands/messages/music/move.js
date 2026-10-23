const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "move",
    description: "Move a song to a different position in the queue.",
    usage: "<from> to <to>",
    category: "music",
    aliases: ["mv"],
    player: {
        voice: true,
        active: true,
        sameVoice: true,
        playing: true,
        dj: true,
    },
    run: async (message, args, client, prefix) => {
        let guildPlayer = await client.musicManager.players.get(message.guildId);

        if (!guildPlayer.queue.tracks.length) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **There are no songs in the queue to move.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }

        let from;
        let to;

        if (args.length === 3 && args[1].toLowerCase() === "to") {
            from = Number(args[0]);
            to = Number(args[2]);
        } else if (args.length === 2) {
            from = Number(args[0]);
            to = Number(args[1]);
        } else {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **Invalid usage. Use \`${prefix}move <from> to <to>\`.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }

        if (!Number.isInteger(from) || !Number.isInteger(to)) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **Both positions must be valid whole numbers.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }

        let fromIndex = from - 1;
        let toIndex = to - 1;
        let queueLength = guildPlayer.queue.tracks.length;

        if (fromIndex < 0 || fromIndex >= queueLength || toIndex < 0 || toIndex >= queueLength) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **Please provide positions between \`1\` and \`${queueLength}\`.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }

        if (fromIndex === toIndex) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **The song is already at position \`${from}\`.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }

        try {
            let track = guildPlayer.queue.tracks[fromIndex];

            guildPlayer.queue.tracks.splice(fromIndex, 1);
            guildPlayer.queue.tracks.splice(toIndex, 0, track);

            let emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **Moved *[${track.title}](${track.uri})* from position \`${from}\` to \`${to}\`.**`,
                )
                .addFields([
                    {
                        name: "Previous Position",
                        value: `\`${from}\``,
                        inline: true,
                    },
                    {
                        name: "New Position",
                        value: `\`${to}\``,
                        inline: true,
                    },
                    {
                        name: "Requester",
                        value: `${message.member}`,
                        inline: true,
                    },
                ])
                .setTimestamp();

            if (track.artworkUrl) emb.setThumbnail(track.artworkUrl);

            return message.reply({
                embeds: [emb]
            });
        } catch (err) {
            console.dir(err, { depth: null });

            if (err.errors) {
                console.dir(err.errors, { depth: null });
            }

            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **An error occurred while trying to \`move\` the song.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }
    }
};