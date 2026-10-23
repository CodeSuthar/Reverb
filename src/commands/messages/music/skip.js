
const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "skip",
    description: "Skip the currently playing song.",
    usage: "",
    category: "music",
    aliases: ["s"],
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
            let emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **Successfully skipped [${guildPlayer.current.title}](${guildPlayer.current.uri}).**`,
                );
            await guildPlayer.skip();

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
                    `${client.emojiList.cross} | **An error occurred while trying to \`skip\` the current song.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }
    }
};