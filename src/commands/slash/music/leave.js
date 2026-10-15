const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("leave")
        .setDescription("Make the bot leave your voice channel."),
    run: async (client, interaction) => {
        await interaction.deferReply();

        let guildPlayer = await client.player.guildPlayer(interaction.guildId);

        if (!guildPlayer || !guildPlayer.queue) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | I am not currently in a voice channel.`,
                );

            return interaction.editReply({
                embeds: [emb]
            });
        }

        if (!interaction.member.voice.channel || (guildPlayer && guildPlayer.queue && guildPlayer.queue.channel.id !== interaction.member.voice.channelId)) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | You need to be in the same voice channel as me to use this command.`,
                );

            return interaction.editReply({
                embeds: [emb]
            });
        }

        try {
            await guildPlayer.queue.delete();

            let emb = new EmbedBuilder()
                .setColor("#FF66C4")
                .setDescription(
                    `${client.emojiList.leave} | Successfully left the voice channel.`,
                );
            
            return interaction.editReply({
                embeds: [emb]
            });
        } catch (error) {
            console.dir(err, { depth: null });

            if (err.errors) {
                console.dir(err.errors, { depth: null });
            }

            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | An error occurred while trying to leave the voice channel.`,
                );

            return interaction.editReply({
                embeds: [emb]
            });
        }
    }
}
