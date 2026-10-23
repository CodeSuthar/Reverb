const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("247")
        .setDescription("Toggle 24/7 mode to keep the bot in the voice channel."),
    permissions: {
        client: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
        user: [PermissionFlagsBits.ManageGuild],
    },
    player: {
        voice: true,
        sameVoice: true,
    },
    run: async (client, interaction) => {
        await interaction.deferReply();

        let voiceChannel = interaction.member.voice.channel;
        let guildPlayer = client.musicManager.players.get(interaction.guildId);

        try {
            const stayData = await client.database.getTwentyFourSeven(interaction.guildId);

            if (stayData) {
                await client.database.deleteTwentyFourSeven(interaction.guildId);

                if (guildPlayer && typeof guildPlayer.setAutoLeave === "function") {
                    guildPlayer.setAutoLeave(true);
                }

                let emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `**${client.emojiList.cross} | 24/7 mode has been \`disabled\` for this server.**`
                    );

                return await interaction.editReply({ embeds: [emb] });
            } else {
                await client.database.setTwentyFourSeven(
                    interaction.guildId,
                    interaction.channelId,
                    voiceChannel.id
                );

                if (!guildPlayer) {
                    guildPlayer = await client.musicManager.players.create({
                        guildId: interaction.guildId,
                        voiceChannelId: voiceChannel.id,
                        textChannelId: interaction.channelId,
                        autoLeave: false,
                    });
                }

                if (guildPlayer && typeof guildPlayer.setAutoLeave === "function") {
                    guildPlayer.setAutoLeave(false);
                }

                if (!guildPlayer.connected) {
                    await guildPlayer.connect();
                }

                let emb = new EmbedBuilder()
                    .setColor(client?.color?.hex ?? "#FF66C4")
                    .setDescription(
                        `**${client.emojiList.tick} | 24/7 mode has been \`enabled\` for this server in ${voiceChannel}.**`
                    );

                return await interaction.editReply({ embeds: [emb] });
            }
        } catch (err) {
            console.dir(err, { depth: null });

            if (err.errors) {
                console.dir(err.errors, { depth: null });
            }

            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `**${client.emojiList.cross} | An error occurred while trying to toggle 24/7 mode.**`
                );

            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
