const {
    EmbedBuilder
} = require("discord.js");

module.exports = {
    name: "shuffle",
    description: "Shuffle the songs in the queue.",
    usage: "",
    category: "music",
    aliases: ["sh"],
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
                    `${client.emojiList.cross} | **There are no songs in the queue to shuffle.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }

        const isFairPlay = (await guildPlayer.getData?.("fairplay")) || guildPlayer.get?.("fairplay");
        if (isFairPlay) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **The queue cannot be shuffled while FairPlay is enabled.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }

        try {
            await guildPlayer.queue.shuffle();

            let emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **Successfully \`shuffled\` the queue.**`,
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
                    `${client.emojiList.cross} | **An error occurred while trying to \`shuffle\` the queue.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }
    }
};