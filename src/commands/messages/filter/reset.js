const { EmbedBuilder } = require("discord.js");

const ACCENT_COLOR = 0xFF66C4;

module.exports = {
    name: "reset",
    description: "Clear and reset all applied audio filters from the music player.",
    usage: "",
    category: "filter",
    aliases: ["resetfilters", "clearfilters", "clearfilter", "cf", "rf", "resetfilter"],
    player: {
        voice: true,
        active: true,
        sameVoice: true,
        playing: true,
        dj: true,
    },
    run: async (message, args, client, prefix) => {
        const guildPlayer = await client.musicManager.players.get(message.guildId);

        try {
            guildPlayer.filters.clear();
            await guildPlayer.filters.apply();

            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **Successfully cleared all audio filters from the player.**`,
                );

            return message.reply({ embeds: [emb] });
        } catch (err) {
            console.error(err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **An error occurred while resetting audio filters.**`,
                );

            return message.reply({ embeds: [emb] });
        }
    },
};
