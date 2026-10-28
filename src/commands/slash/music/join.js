const {
    EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits
} = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("join")
        .setDescription("Make the bot join your voice channel to play music."),
    permissions: {
        client: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
    },
    player: {
        voice: true,
        sameVoice: true,
    },
    run: async (client, interaction) => {
        await interaction.deferReply();
        let guildPlayer = client.musicManager.players.get(interaction.guildId);

        if (
            guildPlayer &&
            guildPlayer.connected &&
            guildPlayer.voiceChannelId === interaction.member.voice.channelId
        ) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **I am already connected to your voice channel.**`
                );

            return await interaction.editReply({ embeds: [emb] });
        }

        const voiceChannelToJoin = interaction.member.voice.channel;

        if (!guildPlayer) {
            try {
                guildPlayer = await client.musicManager.players.create({
                    guildId: interaction.guildId,
                    voiceChannelId: voiceChannelToJoin.id,
                    textChannelId: interaction.channelId,
                });

                if (!guildPlayer.connected) await guildPlayer.connect();

                const emb = new EmbedBuilder()
                    .setColor(client?.color?.hex ?? "#FF66C4")
                    .setDescription(
                        `${client.emojiList.join} | **Successfully \`joined\` the voice channel ${voiceChannelToJoin}.**`
                    );

                return await interaction.editReply({ embeds: [emb] });
            } catch (err) {
                console.error(err);
                const emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `${client.emojiList.cross} | **An error occurred while trying to \`join\` your voice channel.**`
                    );

                return await interaction.editReply({ embeds: [emb] });
            }
        }
    },
};
