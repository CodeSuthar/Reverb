const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    name: "247",
    description: "Toggle 24/7 mode to keep the bot in the voice channel.",
    usage: "",
    category: "configuration",
    aliases: ["stay", "24/7", "24-7"],
    permissions: {
        client: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
        user: [PermissionFlagsBits.ManageGuild],
    },
    player: {
        voice: true,
        sameVoice: true,
    },
    run: async (message, args, client, prefix) => {
        let voiceChannel = message.member.voice.channel;
        let guildPlayer = client.musicManager.players.get(message.guildId);

        try {
            const stayData = await client.database.getTwentyFourSeven(message.guildId);

            if (stayData) {
                await client.database.deleteTwentyFourSeven(message.guildId);

                if (guildPlayer && typeof guildPlayer.setAutoLeave === "function") {
                    guildPlayer.setAutoLeave(true);
                }

                let emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `**${client.emojiList.cross} | 24/7 mode has been \`disabled\` for this server.**`,
                    );

                return message.reply({
                    embeds: [emb],
                });
            } else {
                await client.database.setTwentyFourSeven(
                    message.guildId,
                    message.channelId,
                    voiceChannel.id
                );

                if (!guildPlayer) {
                    guildPlayer = await client.musicManager.players.create({
                        guildId: message.guildId,
                        voiceChannelId: voiceChannel.id,
                        textChannelId: message.channelId,
                        autoLeave: false,
                    });
                }

                if (guildPlayer && typeof guildPlayer.setAutoLeave === "function") {
                    guildPlayer.setAutoLeave(false);
                }

                if (!guildPlayer.connected) {
                    await guildPlayer.connect();
                }

                let emb = new EmbedBuilder()
                    .setColor(client?.color?.hex ?? "#FF66C4")
                    .setDescription(
                        `**${client.emojiList.tick} | 24/7 mode has been \`enabled\` for this server.**`,
                    )
                    .addFields([
                        {
                            name: "Voice Channel",
                            value: `${voiceChannel}`,
                            inline: true,
                        },
                        {
                            name: "Text Channel",
                            value: `${message.channel}`,
                            inline: true,
                        }
                    ]);

                return message.reply({
                    embeds: [emb],
                });
            }
        } catch (err) {
            console.dir(err, { depth: null });

            if (err.errors) {
                console.dir(err.errors, { depth: null });
            }

            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `**${client.emojiList.cross} | An error occurred while trying to toggle \`24/7\` mode.**`,
                );

            return message.reply({
                embeds: [emb],
            });
        }
    },
};
