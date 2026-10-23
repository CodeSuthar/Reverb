
const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "fairplay",
    description: "Toggle FairPlay mode for the music queue.",
    usage: "",
    category: "music",
    aliases: ["fp"],
    player: {
        voice: true,
        active: true,
        sameVoice: true,
        dj: true,
    },
    run: async (message, args, client, prefix) => {
        let guildPlayer = await client.musicManager.players.get(message.guildId);

        try {
            let isFairPlay = await guildPlayer.getData("fairplay");
            console.log("Current FairPlay status:", isFairPlay);
            let newFairPlay = !isFairPlay;
            console.log("New FairPlay status:", newFairPlay);

            await guildPlayer.setData("fairplay", newFairPlay);
            await guildPlayer.setFairPlay();

            let emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **FairPlay mode has been successfully \`${newFairPlay ? "enabled" : "disabled"}\`.**`,
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
                    `${client.emojiList.cross} | **An error occurred while trying to toggle \`fairplay\`.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }
    }
};