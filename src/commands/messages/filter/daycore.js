const {
    EmbedBuilder
} = require("discord.js");
const filterName = "daycore";
const displayName = "Daycore";

module.exports = {
    name: "daycore",
    description: "Toggle the Daycore (anti-nightcore, slowed pitch) audio filter.",
    usage: "[on | off]",
    category: "filter",
    aliases: ["dc", "day", "daycorefilter", "daycoresound"],
    player: {
        voice: true,
        active: true,
        sameVoice: true,
        playing: true,
        dj: true,
    },
    run: async (message, args, client, prefix) => {
        const guildPlayer = await client.musicManager.players.get(message.guildId);

        const arg = args[0]?.toLowerCase();
        const currentlyActive = guildPlayer.filters.isActive(filterName);
        let shouldEnable = !currentlyActive;

        if (arg === "on" || arg === "enable" || arg === "1") {
            shouldEnable = true;
        } else if (arg === "off" || arg === "disable" || arg === "0") {
            shouldEnable = false;
        }

        try {
            if (shouldEnable) {
                guildPlayer.filters.enable(filterName);
            } else {
                guildPlayer.filters.disable(filterName);
            }

            await guildPlayer.filters.apply();

            const status = shouldEnable ? "enabled" : "disabled";
            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **The \`${displayName}\` filter has been \`${status}\`.**`,
                );

            return message.reply({ embeds: [emb] });
        } catch (err) {
            console.error(`Error toggling filter ${filterName}:`, err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **An error occurred while updating the \`${displayName}\` filter.**`,
                );

            return message.reply({ embeds: [emb] });
        }
    },
};
