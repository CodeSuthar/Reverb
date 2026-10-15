const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "join",
    description: "Make the bot join your voice channel to play music.",
    usage: "",
    category: "music",
    aliases: ["j"],
    run: async (message, args, client, prefix) => {
        let guildPlayer = client.musicManager.getPlayer(message.guildId);

        console.log({
            guildPlayer: guildPlayer ? "exists" : "does not exist",
            connected: guildPlayer ? guildPlayer.connected : "N/A",
            voiceChannelId: guildPlayer ? guildPlayer.voiceChannelId : "N/A",
            memberVoiceChannelId: message.member.voice.channel ? message.member.voice.channel.id : "N/A",
            voiceChannelMembers: guildPlayer ? guildPlayer.voiceChannel.members.size : "N/A",
            queueLength: guildPlayer ? guildPlayer.queue.tracks.length : "N/A"
        });

        if (!message.member.voice.channel) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | You need to be in a voice channel to use this command.`,
                );

            return message.reply({
                embeds: [emb]
            });
        }

        if (
            guildPlayer && 
            guildPlayer.connected && 
            guildPlayer.voiceChannelId !== message.member.voice.channelId
        ) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | I am already playing music in ${guildPlayer.voiceChannel}. Please join that channel to listen.`,
                );
            
            return message.reply({
                embeds: [emb]
            });
        }

        if (
            guildPlayer && 
            guildPlayer.connected && 
            (!guildPlayer.queue.current && guildPlayer.queue.tracks.length === 0) && 
            guildPlayer.voiceChannelId === message.member.voice.channelId
        ) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | I am already in your voice channel, but there are no songs in the queue. Use \`${prefix}play <song>\` to add a song to the queue.`,
                );

            return message.reply({
                embeds: [emb]
            });
        }

        if (
            guildPlayer && 
            guildPlayer.connected && 
            (guildPlayer.queue.current || guildPlayer.queue.tracks.length > 0) && 
            guildPlayer.voiceChannelId === message.member.voice.channelId
        ) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | I am already in your voice channel and playing music. Use \`${prefix}play <song>\` to add a song to the queue.`,
                );

            return message.reply({
                embeds: [emb]
            });
        }

        let voiceChannelToJoin = message.member.voice.channel;

        if (!guildPlayer) {
            try {
                let join = client.emojiList.join;

                guildPlayer = await client.musicManager.createPlayer({
                    guildId: message.guildId,
                    voiceChannelId: voiceChannelToJoin.id,
                    textChannelId: message.channelId,
                    selfDeaf: true,
                    selfMute: false,
                    volume: client.config.music.defaultVolume,
                    vcRegion: voiceChannelToJoin.rtcRegion || null,
                })
                
                if (!guildPlayer.connected) await guildPlayer.connect();

                let emb = new EmbedBuilder()
                    .setColor("#FF66C4")
                    .setDescription(
                        `${join} | Successfully joined your voice channel: ${voiceChannelToJoin}.`,
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
                        `${client.emojiList.cross} | An error occurred while trying to join your voice channel.`,
                    );

                return message.reply({
                    embeds: [emb]
                });
            }
        }
    }
}
