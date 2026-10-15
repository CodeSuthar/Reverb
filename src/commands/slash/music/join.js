const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("join")
        .setDescription("Make the bot join your voice channel to play music."),
    run: async (client, interaction) => {
        await interaction.deferReply();

        let guildPlayer = await client.player.guildPlayer(interaction.guildId);

        if (!interaction.member.voice.channel) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | You need to be in a voice channel to use this command.`,
                );
                
            return await interaction.editReply({
                embeds: [emb]
            });
        }

        if (guildPlayer && guildPlayer.queue && guildPlayer.queue.channel.id !== interaction.member.voice.channelId) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | I am already playing music in ${guildPlayer.queue.channel}. Please join that channel to listen.`,
                );
            
            return await interaction.editReply({
                embeds: [emb]
            });
        }

        if (guildPlayer && guildPlayer.queue && guildPlayer.queue.size === 0 && guildPlayer.queue.channel.id === interaction.member.voice.channelId) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | I am already in your voice channel, but there are no songs in the queue. Use \`/play <song>\` to add a song to the queue.`,
                );

            return await interaction.editReply({
                embeds: [emb]
            });
        }

        if (guildPlayer && guildPlayer.queue && guildPlayer.queue.size > 0 && guildPlayer.queue.channel.id === interaction.member.voice.channelId) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | I am already in your voice channel and playing music. Use \`/play <song>\` to add a song to the queue.`,
                );

            return await interaction.editReply({
                embeds: [emb]
            });
        }

        let voiceChannelToJoin = interaction.member.voice.channel;

        if (!guildPlayer) {
            try {
                let join = client.emojiList.join;

                guildPlayer = await client.player.manager.nodes.create(interaction.guildId, {
                    leaveOnEmpty: true,
                    leaveOnEmptyCooldown: 300000, // 5 minutes
                    leaveOnEnd: true,
                    leaveOnEndCooldown: 300000, // 5 minutes
                    leaveOnStop: true,
                    leaveOnStopCooldown: 600000, // 10 minutes
                    selfDeaf: true,
                    volume: 100,
                    bufferingTimeout: 200,
                    metadata: {
                        textChannel: interaction.channelId,
                        playingMessage: null
                    },
                });

                await guildPlayer.connect(voiceChannelToJoin.id);

                let emb = new EmbedBuilder()
                    .setColor("#FF66C4")
                    .setDescription(
                        `${join} | Successfully joined your voice channel: ${voiceChannelToJoin}.`,
                    );

                return await interaction.editReply({
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
                        `${client.emojiList.cross} | An error occurred while trying to join your voice channel.`,
                    );

                return await interaction.editReply({
                    embeds: [emb]
                });
            }
        }
    }
}
