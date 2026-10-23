const { EmbedBuilder } = require("discord.js");

const ACCENT_COLOR = 0xFF66C4;

module.exports = {
    name: "bassboost",
    description: "Adjust the bass boost audio filter level.",
    usage: "[low | medium | high | off]",
    category: "filter",
    aliases: ["bb", "bass"],
    player: {
        voice: true,
        active: true,
        sameVoice: true,
        playing: true,
        dj: true,
    },
    run: async (message, args, client, prefix) => {
        const guildPlayer = await client.musicManager.players.get(message.guildId);

        // Determine current bass boost level
        let currentLevel = "off";
        if (guildPlayer.filters.isActive("bassboost-high")) {
            currentLevel = "high";
        } else if (guildPlayer.filters.isActive("bassboost-medium")) {
            currentLevel = "medium";
        } else if (guildPlayer.filters.isActive("bassboost-low")) {
            currentLevel = "low";
        }

        let targetLevel = "off";
        const inputArg = args[0]?.toLowerCase();

        try {
            if (inputArg) {
                if (inputArg === "low" || inputArg === "l" || inputArg === "1") {
                    targetLevel = "low";
                } else if (inputArg === "medium" || inputArg === "med" || inputArg === "m" || inputArg === "mid" || inputArg === "2") {
                    targetLevel = "medium";
                } else if (inputArg === "high" || inputArg === "h" || inputArg === "hard" || inputArg === "3") {
                    targetLevel = "high";
                } else if (
                    inputArg === "off" ||
                    inputArg === "o" ||
                    inputArg === "disable" ||
                    inputArg === "none" ||
                    inputArg === "0" ||
                    inputArg === "clear" ||
                    inputArg === "reset"
                ) {
                    targetLevel = "off";
                } else {
                    const emb = new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(
                            `${client.emojiList.cross} | **Invalid bass boost level.**\nPlease use \`low\`, \`medium\`, \`high\`, or \`off\`.`,
                        );

                    return message.reply({ embeds: [emb] });
                }
            } else {
                // Cycle through levels like loop.js on no arguments: off -> low -> medium -> high -> off
                switch (currentLevel) {
                    case "off":
                        targetLevel = "low";
                        break;
                    case "low":
                        targetLevel = "medium";
                        break;
                    case "medium":
                        targetLevel = "high";
                        break;
                    case "high":
                        targetLevel = "off";
                        break;
                }
            }

            // Disable all bassboost levels first to ensure clean level transition
            guildPlayer.filters.disable("bassboost-low");
            guildPlayer.filters.disable("bassboost-medium");
            guildPlayer.filters.disable("bassboost-high");

            if (targetLevel !== "off") {
                guildPlayer.filters.enable(`bassboost-${targetLevel}`);
            }

            await guildPlayer.filters.apply();

            const description = targetLevel === "off"
                ? `${client.emojiList.tick} | **Bass Boost has been \`disabled\`.**`
                : `${client.emojiList.tick} | **The player is now set to \`${targetLevel.toUpperCase()}\` Bass Boost.**`;

            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(description);

            return message.reply({ embeds: [emb] });
        } catch (err) {
            console.error("Error setting bassboost:", err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **An error occurred while updating the bass boost filter.**`,
                );

            return message.reply({ embeds: [emb] });
        }
    },
};
