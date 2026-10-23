const { EmbedBuilder } = require("discord.js");

const ACCENT_COLOR = 0xFF66C4;
const FILTER_NAME = "vaporwave";
const DISPLAY_NAME = "Vaporwave";

module.exports = {
    name: "vaporwave",
    description: "Toggle the Vaporwave (slowed & relaxed pitch) audio filter.",
    usage: "[on | off]",
    category: "filter",
    aliases: ["vw", "vaperwave"],
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
        const currentlyActive = guildPlayer.filters.isActive(FILTER_NAME);
        let shouldEnable = !currentlyActive;

        if (arg === "on" || arg === "enable" || arg === "1") {
            shouldEnable = true;
        } else if (arg === "off" || arg === "disable" || arg === "0") {
            shouldEnable = false;
        }

        try {
            if (shouldEnable) {
                guildPlayer.filters.enable(FILTER_NAME);
            } else {
                guildPlayer.filters.disable(FILTER_NAME);
            }

            await guildPlayer.filters.apply();

            const status = shouldEnable ? "enabled" : "disabled";
            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **The \`${DISPLAY_NAME}\` filter has been \`${status}\`.**`,
                );

            return message.reply({ embeds: [emb] });
        } catch (err) {
            console.error(`Error toggling filter ${FILTER_NAME}:`, err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **An error occurred while updating the \`${DISPLAY_NAME}\` filter.**`,
                );

            return message.reply({ embeds: [emb] });
        }
    },
};
