const {
    EmbedBuilder
} = require("discord.js");

module.exports = {
    name: "clearqueue",
    description: "Clear all upcoming tracks from the queue.",
    usage: "",
    category: "music",
    aliases: ["cq", "clear", "clearq"],
    player: {
        voice: true,
        active: true,
        sameVoice: true,
        dj: true,
    },
    run: async (message, args, client, prefix) => {
        let guildPlayer = await client.musicManager.players.get(message.guildId);

        if (guildPlayer.queue.tracks.length === 0) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **There are no tracks in the queue to clear.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }

        try {
            await guildPlayer.queue.clear();

            let emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **The queue has been successfully cleared.**`,
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
                    `${client.emojiList.cross} | **An error occurred while trying to \`clear\` the queue.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }
    }
};