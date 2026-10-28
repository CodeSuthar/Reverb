const {
    EmbedBuilder
} = require("discord.js");
const {
    executeViewUpdate
} = require("../../../utils/musicUtils/index");

module.exports = {
    name: "fairplay",
    description: "Toggle FairPlay mode for the music queue.",
    usage: "",
    category: "music",
    aliases: ["fp", "fair", "fairp"],
    player: {
        voice: true,
        active: true,
        sameVoice: true,
        dj: true,
    },
    run: async (message, args, client, prefix) => {
        let guildPlayer = await client.musicManager.players.get(message.guildId);

        try {
            let isFairPlay = Boolean((await guildPlayer.getData?.("fairplay")) || guildPlayer.get?.("fairplay"));
            let newFairPlay = !isFairPlay;

            await guildPlayer.setData("fairplay", newFairPlay);
            if (newFairPlay && typeof guildPlayer.setFairPlay === "function") {
                await guildPlayer.setFairPlay();
            }

            await executeViewUpdate(client, guildPlayer);

            let emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **FairPlay mode has been successfully \`${newFairPlay ? "enabled" : "disabled"}\`.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        } catch (err) {
            (client.logger || console).error(`[FAIRPLAY] Error toggling fairplay:`, err);

            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **An error occurred while trying to toggle \`fairplay\`.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }
    }
};
