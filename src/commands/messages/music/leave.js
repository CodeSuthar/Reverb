const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "leave",
    description: "Make the bot leave your voice channel.",
    usage: "",
    category: "music",
    aliases: ["disconnect", "dc"],
    player: {
        voice: true,
        active: true,
        sameVoice: true,
        dj: true,
    },
    run: async (message, args, client, prefix) => {
        let guildPlayer = await client.musicManager.players.get(message.guildId);

        try {
            await guildPlayer.destroy("User requested to leave the voice channel.");

            let emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.leave} | **Successfully \`left\` the voice channel.**`,
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
                    `${client.emojiList.cross} | **An error occurred while trying to \`leave\` the voice channel.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }
    }
}
