const {
    EmbedBuilder
} = require("discord.js");

module.exports = {
    name: "skipto",
    description: "Skip to a specific song in the queue.",
    usage: "<number>",
    category: "music",
    aliases: ["skt"],
    player: {
        voice: true,
        active: true,
        sameVoice: true,
        playing: true,
        dj: true,
    },
    run: async (message, args, client, prefix) => {
        let guildPlayer = await client.musicManager.players.get(message.guildId);

        let num = Number(args[0]);

        if (
            !args[0] ||
            !Number.isInteger(num) ||
            num < 1 ||
            num > guildPlayer.queue.tracks.length
        ) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **Please provide a valid queue position between 1 and ${guildPlayer.queue.tracks.length}.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }

        try {
            let track = guildPlayer.queue.tracks[num - 1];

            await guildPlayer.skip(num - 1);

            let emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **Skipped to [${track.title}](${track.uri}).**`,
                );

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
                    `${client.emojiList.cross} | **An error occurred while trying to skip to that song.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }
    }
};