const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("leave")
        .setDescription("Make the bot leave your voice channel."),
    run: async (client, interaction) => {
        await interaction.deferReply();

        let guildPlayer = await client.musicManager.getPlayer(interaction.guildId);

        if (!guildPlayer || !guildPlayer.connected) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | I am not currently in a voice channel.`,
                );

            return await interaction.editReply({
                embeds: [emb]
            });
        }

        if (!interaction.member.voice.channel || (guildPlayer && guildPlayer.connected && guildPlayer.voiceChannelId !== interaction.member.voice.channelId)) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | You need to be in the same voice channel as me to use this command.`,
                );

            return await interaction.editReply({
                embeds: [emb]
            });
        }

        try {
            await guildPlayer.destroy("User requested to leave the voice channel.");

            let emb = new EmbedBuilder()
                .setColor("#FF66C4")
                .setDescription(
                    `${client.emojiList.leave} | Successfully left the voice channel.`,
                );
            
            return await interaction.editReply({
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
                    `${client.emojiList.cross} | An error occurred while trying to leave the voice channel.`,
                );

            return await interaction.editReply({
                embeds: [emb]
            });
        }
    }
};
