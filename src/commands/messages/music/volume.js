
const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "volume",
    description: "Change the volume of the player in the voice channel.",
    usage: "<volume>",
    category: "music",
    aliases: ["vol", "v"],
    player: {
        voice: true,
        active: true,
        sameVoice: true,
        dj: true,
    },
    run: async (message, args, client, prefix) => {
        let guildPlayer = await client.musicManager.players.get(message.guildId);

        if (!args[0]) {
            let emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.volume.default} | **The current volume level is set to \`${guildPlayer.volume}\`.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }

        let volume = Number(args[0]);

        if (!Number.isFinite(volume) || !Number.isInteger(volume)) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **Please provide a valid whole number for the volume.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }

        if (volume < 0 || volume > client.config.music.maxVolume) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **Please provide a volume level between \`0\` and \`${client.config.music.maxVolume}\`.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }

        let currentVolume = guildPlayer.volume;

        if (currentVolume === volume) {
            let emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.volume.default} | **The volume is already set to \`${volume}\`.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }

        try {
            await guildPlayer.setVolume(volume);

            let emb;

            if (currentVolume < volume) {
                emb = new EmbedBuilder()
                    .setColor(client?.color?.hex ?? "#FF66C4")
                    .setDescription(
                        `${client.emojiList.volume.up} | **Successfully increased the volume to \`${volume}\`.**`,
                    );
            } else {
                emb = new EmbedBuilder()
                    .setColor(client?.color?.hex ?? "#FF66C4")
                    .setDescription(
                        `${client.emojiList.volume.down} | **Successfully decreased the volume to \`${volume}\`.**`,
                    );
            }

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
                    `${client.emojiList.cross} | **An error occurred while trying to change the player volume.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }
    }
};