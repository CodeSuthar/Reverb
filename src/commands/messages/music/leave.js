const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "leave",
    description: "Make the bot leave your voice channel.",
    usage: "",
    category: "music",
    aliases: ["disconnect", "dc"],
    run: async (message, args, client, prefix) => {
        let guildPlayer = await client.musicManager.getPlayer(message.guildId);

        if (!guildPlayer || !guildPlayer.connected) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | I am not currently in a voice channel.`,
                );

            return message.reply({
                embeds: [emb]
            });
        }

        if (!message.member.voice.channel || (guildPlayer && guildPlayer.connected && guildPlayer.voiceChannelId !== message.member.voice.channelId)) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | You need to be in the same voice channel as me to use this command.`,
                );

            return message.reply({
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
                    `${client.emojiList.cross} | An error occurred while trying to leave the voice channel.`,
                );

            return message.reply({
                embeds: [emb]
            });
        }
    }
}
