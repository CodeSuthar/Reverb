const {
    EmbedBuilder
} = require("discord.js");

module.exports = {
    name: "loop",
    description: "Loop the currently playing track or queue.",
    usage: "",
    category: "music",
    aliases: ["l", "repeat"],
    player: {
        voice: true,
        active: true,
        sameVoice: true,
        playing: true,
        dj: true,
    },
    run: async (message, args, client, prefix) => {
        let guildPlayer = await client.musicManager.players.get(message.guildId);

        let arg = args[0]        

        try {
            let loopMessage = '';
            if (arg) {
                if (arg === "track" || arg === "t" || arg === "song" || arg === "s") {
                    guildPlayer.setLoop('track');
                    loopMessage = `${client.emojiList.loop.track} | **The player is now set to loop the \`current track\`.**`;
                } else if (arg === "queue" || arg === "q") {
                    guildPlayer.setLoop('queue');
                    loopMessage = `${client.emojiList.loop.queue} | **The player is now set to loop the \`queue\`.**`;
                } else if (arg === "off" || arg === "o") {
                    guildPlayer.setLoop('off');
                    loopMessage = `${client.emojiList.loop.off} | **The player is now set to \`not loop\`.**`;
                } else {
                    loopMessage = `${client.emojiList.cross} | **Invalid loop option provided. Please use \`track\`, \`queue\`, or \`off\`.**`;
                }
            } else {
                switch (guildPlayer.loop) {
                    case 'off':
                        guildPlayer.setLoop('track');
                        loopMessage = `${client.emojiList.loop.track} | **The player is now set to loop the \`current track\`.**`;
                        break;
                    case 'track':
                        guildPlayer.setLoop('queue');
                        loopMessage = `${client.emojiList.loop.queue} | **The player is now set to loop the \`queue\`.**`;
                        break;
                    case 'queue':
                        guildPlayer.setLoop('off');
                        loopMessage = `${client.emojiList.loop.off} | **The player is now set to \`not loop\`.**`;
                        break;
                }
            }
            
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client?.color?.hex ?? "#FF66C4")
                        .setDescription(loopMessage)
                ]
            });
        } catch (err) {
            console.dir(err, { depth: null });

            if (err.errors) {
                console.dir(err.errors, { depth: null });
            }

            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **An error occurred while trying to \`pause\` the player.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }
    }
}