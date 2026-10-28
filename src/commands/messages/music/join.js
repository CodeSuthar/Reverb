const {
    EmbedBuilder, 
    PermissionFlagsBits
} = require("discord.js");

module.exports = {
    name: "join",
    description: "Make the bot join your voice channel to play music.",
    usage: "",
    category: "music",
    aliases: ["j", "summon", "joinvoice", "connect"],
    permissions: {
        client: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
    },
    player: {
        voice: true,
        sameVoice: true,
    },
    run: async (message, args, client, prefix) => {
        let guildPlayer = client.musicManager.players.get(message.guildId);

        if (
            guildPlayer &&
            guildPlayer.connected &&
            guildPlayer.voiceChannelId === message.member.voice.channelId
        ) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **I am already connected to your voice channel.**`,
                );

            return message.reply({
                embeds: [emb],
            });
        }

        let voiceChannelToJoin = message.member.voice.channel;

        if (!guildPlayer) {
            try {
                let join = client.emojiList.join;

                guildPlayer = await client.musicManager.players.create({
                    guildId: message.guildId,
                    voiceChannelId: voiceChannelToJoin.id,
                    textChannelId: message.channelId,
                });
                
                if (!guildPlayer.connected) await guildPlayer.connect();

                let emb = new EmbedBuilder()
                    .setColor(client?.color?.hex ?? "#FF66C4")
                    .setDescription(
                        `${join} | **Successfully \`joined\` the voice channel ${voiceChannelToJoin}.**`,
                    );

                return message.reply({
                    embeds: [emb],
                });
            } catch (err) {
                console.dir(err, { depth: null });

                if (err.errors) {
                    console.dir(err.errors, { depth: null });
                }

                let emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `${client.emojiList.cross} | **An error occurred while trying to \`join\` your voice channel.**`,
                    );

                return message.reply({
                    embeds: [emb],
                });
            }
        }
    },
};
