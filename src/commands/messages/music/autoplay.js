const {
    EmbedBuilder
} = require("discord.js");

module.exports = {
    name: "autoplay",
    description: "Toggle autoplay for the music player.",
    usage: "",
    category: "music",
    aliases: ["ap", "auto", "autop"],
    player: {
        voice: true,
        active: true,
        sameVoice: true,
        dj: true,
    },
    run: async (message, args, client, prefix) => {
        let guildPlayer = await client.musicManager.players.get(message.guildId);

        try {
            let isAutoplay = guildPlayer.autoPlay;

            await guildPlayer.setAutoPlay(!isAutoplay);

            let emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **Autoplay has been successfully \`${!isAutoplay ? "enabled" : "disabled"}\`.**`,
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
                    `${client.emojiList.cross} | **An error occurred while trying to toggle \`autoplay\`.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }
    }
};
