const {
    EmbedBuilder
} = require("discord.js");

module.exports = {
    name: "pause",
    description: "Pause the currently playing music.",
    usage: "",
    category: "music",
    aliases: ["hold"],
    player: {
        voice: true,
        active: true,
        sameVoice: true,
        playing: true,
        dj: true,
    },
    run: async (message, args, client, prefix) => {
        let guildPlayer = await client.musicManager.players.get(message.guildId);

        if (guildPlayer.paused) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **The player is already \`paused\`.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }
        

        try {
            await guildPlayer.pause();

            let emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.pause} | **Successfully \`paused\` the player.**`,
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
                    `${client.emojiList.cross} | **An error occurred while trying to \`pause\` the player.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }
    }
}