const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("join")
        .setDescription("Make the bot join your voice channel to play music."),
    run: async (client, interaction) => {
        await interaction.deferReply();

        let guildPlayer = client.musicManager.getPlayer(interaction.guildId);

        console.log({
            guildPlayer: guildPlayer ? "exists" : "does not exist",
            connected: guildPlayer ? guildPlayer.connected : "N/A",
            voiceChannelId: guildPlayer ? guildPlayer.voiceChannelId : "N/A",
            memberVoiceChannelId: interaction.member.voice.channel ? interaction.member.voice.channel.id : "N/A",
            voiceChannelMembers: guildPlayer && guildPlayer.voiceChannel ? guildPlayer.voiceChannel.members.size : "N/A",
            queueLength: guildPlayer ? guildPlayer.queue.tracks.length : "N/A"
        });

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

        if (
            guildPlayer && 
            guildPlayer.connected && 
            guildPlayer.voiceChannelId !== interaction.member.voice.channelId
        ) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | I am already playing music in ${guildPlayer.voiceChannel}. Please join that channel to listen.`,
                );
            
            return await interaction.editReply({
                embeds: [emb]
            });
        }

        if (
            guildPlayer && 
            guildPlayer.connected && 
            (!guildPlayer.queue.current && guildPlayer.queue.tracks.length === 0) && 
            guildPlayer.voiceChannelId === interaction.member.voice.channelId
        ) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | I am already in your voice channel, but there are no songs in the queue. Use \`/play <song>\` to add a song to the queue.`,
                );

            return await interaction.editReply({
                embeds: [emb]
            });
        }

        if (
            guildPlayer && 
            guildPlayer.connected && 
            (guildPlayer.queue.current || guildPlayer.queue.tracks.length > 0) && 
            guildPlayer.voiceChannelId === interaction.member.voice.channelId
        ) {
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

                guildPlayer = await client.musicManager.createPlayer({
                    guildId: interaction.guildId,
                    voiceChannelId: voiceChannelToJoin.id,
                    textChannelId: interaction.channelId,
                    selfDeaf: true,
                    selfMute: false,
                    volume: client.config.music.defaultVolume,
                    vcRegion: voiceChannelToJoin.rtcRegion || null,
                });
                
                if (!guildPlayer.connected) await guildPlayer.connect();

                let emb = new EmbedBuilder()
                    .setColor("#FF66C4")
                    .setDescription(
                        `${join} | Successfully joined your voice channel: ${voiceChannelToJoin}.`,
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
                        `${client.emojiList.cross} | An error occurred while trying to join your voice channel.`,
                    );

                return await interaction.editReply({
                    embeds: [emb]
                });
            }
        }
    }
};