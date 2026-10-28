const {
    EmbedBuilder
} = require("discord.js");

module.exports = {
    name: "stop",
    description: "Stop the currently playing music and clears the queue.",
    usage: "",
    category: "music",
    aliases: ["st", "end"],
    player: {
        voice: true,
        active: true,
        sameVoice: true,
        playing: true,
        dj: true,
    },
    run: async (message, args, client, prefix) => {
        let guildPlayer = await client.musicManager.players.get(message.guildId);

        try {
            await guildPlayer.stop();
            await guildPlayer.queue.clear();

            let emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.pause} | **Successfully \`stopped\` the player.**`,
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
                    `${client.emojiList.cross} | **An error occurred while trying to \`stop\` the player.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }
    }
}