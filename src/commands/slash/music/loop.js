const {
    EmbedBuilder, SlashCommandBuilder
} = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("loop")
        .setDescription("Loop the currently playing track or queue.")
        .addStringOption((opt) =>
            opt
                .setName("mode")
                .setDescription("Loop mode to set")
                .setRequired(false)
                .addChoices(
                    { name: "Track", value: "track" },
                    { name: "Queue", value: "queue" },
                    { name: "Off", value: "off" }
                )
        ),
    player: {
        voice: true,
        active: true,
        sameVoice: true,
        playing: true,
        dj: true,
    },
    run: async (client, interaction) => {
        await interaction.deferReply();
        const guildPlayer = await client.musicManager.players.get(interaction.guildId);
        const mode = interaction.options.getString("mode");

        try {
            let loopMessage = "";
            if (mode) {
                guildPlayer.setLoop(mode);
                if (mode === "track") {
                    loopMessage = `${client.emojiList.loop.track} | **The player is now set to loop the \`current track\`.**`;
                } else if (mode === "queue") {
                    loopMessage = `${client.emojiList.loop.queue} | **The player is now set to loop the \`queue\`.**`;
                } else {
                    loopMessage = `${client.emojiList.loop.off} | **The player is now set to \`not loop\`.**`;
                }
            } else {
                switch (guildPlayer.loop) {
                    case "off":
                        guildPlayer.setLoop("track");
                        loopMessage = `${client.emojiList.loop.track} | **The player is now set to loop the \`current track\`.**`;
                        break;
                    case "track":
                        guildPlayer.setLoop("queue");
                        loopMessage = `${client.emojiList.loop.queue} | **The player is now set to loop the \`queue\`.**`;
                        break;
                    case "queue":
                        guildPlayer.setLoop("off");
                        loopMessage = `${client.emojiList.loop.off} | **The player is now set to \`not loop\`.**`;
                        break;
                }
            }

            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(loopMessage);

            return await interaction.editReply({ embeds: [emb] });
        } catch (err) {
            console.error(err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **An error occurred while trying to \`loop\` the music.**`
                );

            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
