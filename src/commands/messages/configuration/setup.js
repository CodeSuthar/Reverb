const {
    EmbedBuilder,
    ChannelType,
    PermissionFlagsBits,
} = require("discord.js");
const { buildSetupView } = require("../../../utils/buildSetupView");

module.exports = {
    name: "setup",
    description: "Configure or manage the song-requests text channel.",
    usage: "<create | delete | info>",
    category: "configuration",
    aliases: ["set"],
    player: null,
    permissions: {
        client: [
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.ManageMessages,
        ],
        user: [PermissionFlagsBits.ManageGuild],
    },
    run: async (message, args, client, prefix) => {
        const subCommand = args[0]?.toLowerCase();

        try {
            switch (subCommand) {
                case "create": {
                    if (
                        !message.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels) ||
                        !message.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)
                    ) {
                        let emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(
                                `**${client.emojiList.cross} | I need the \`Manage Channels\` and \`Manage Messages\` permissions to create the song-requests setup.**`,
                            );

                        return message.reply({
                            embeds: [emb],
                        });
                    }

                    const data = await client.database.getSetup(message.guild.id);
                    if (data?.textChannelId && data?.messageId) {
                        const existingChannel =
                            message.guild.channels.cache.get(data.textChannelId) ||
                            (await message.guild.channels.fetch(data.textChannelId).catch(() => null));

                        if (existingChannel) {
                            let emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(
                                    `**${client.emojiList.cross} | A song-requests channel already exists in this server: ${existingChannel}.**`,
                                );

                            return message.reply({
                                embeds: [emb],
                            });
                        }
                    }

                    const botName = client?.config?.bot?.name || client?.user?.username || "Reverb";

                    // 1. Create Category / Parent Channel
                    const parentChannel = await message.guild.channels.create({
                        name: `${botName.toUpperCase()} - MUSIC`,
                        type: ChannelType.GuildCategory,
                    });

                    // 2. Create Text Channel inside Category
                    const textChannel = await message.guild.channels.create({
                        name: `${botName.toLowerCase().replace(/\s+/g, "-")}-song-requests`,
                        type: ChannelType.GuildText,
                        parent: parentChannel.id,
                        topic: `Song requests for ${botName}. Send a song title or link here to start playing!`,
                    });

                    // 3. Create Voice Channel inside Category
                    const voiceChannel = await message.guild.channels.create({
                        name: `${botName} Voice`,
                        type: ChannelType.GuildVoice,
                        parent: parentChannel.id,
                    });

                    const player = client.musicManager?.players?.get(message.guild.id);
                    const setupView = buildSetupView(client, player);
                    const setupMessage = await textChannel.send(setupView);

                    await client.database.setSetup(message.guild.id, {
                        parentChannelId: parentChannel.id,
                        textChannelId: textChannel.id,
                        voiceChannelId: voiceChannel.id,
                        messageId: setupMessage.id,
                    });

                    let emb = new EmbedBuilder()
                        .setColor(client?.color?.hex ?? "#FF66C4")
                        .setTitle("Song Request Setup Created")
                        .setDescription(
                            `**${client.emojiList.tick} | Successfully created the song-requests setup!**\n\n` +
                            `• **Category:** ${parentChannel}\n` +
                            `• **Text Channel:** ${textChannel}\n` +
                            `• **Voice Channel:** ${voiceChannel}`
                        )
                        .addFields({
                            name: `${client.emojiList.lightbulb} Note`,
                            value: "You can rename or move any channel. category & voice channel can be deleted. The song-requests system can work on the text channel alone!\n" +
                            `To remove the setup, use \`${prefix}setup delete\`.`,
                        });

                    return message.reply({
                        embeds: [emb],
                    });
                }

                case "delete": {
                    const data = await client.database.getSetup(message.guild.id);

                    if (!data) {
                        let emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(
                                `**${client.emojiList.cross} | No song-requests channel is currently configured for this server.**`,
                            );

                        return message.reply({
                            embeds: [emb],
                        });
                    }

                    await client.database.deleteSetup(message.guild.id);

                    // Delete text channel if available
                    if (data.textChannelId) {
                        const textChannel =
                            message.guild.channels.cache.get(data.textChannelId) ||
                            (await message.guild.channels.fetch(data.textChannelId).catch(() => null));
                        if (textChannel) await textChannel.delete().catch(() => null);
                    }

                    // Delete voice channel if available
                    const voiceChanId = data.voiceChannelId;
                    if (voiceChanId) {
                        const voiceChannel =
                            message.guild.channels.cache.get(voiceChanId) ||
                            (await message.guild.channels.fetch(voiceChanId).catch(() => null));
                        if (voiceChannel) await voiceChannel.delete().catch(() => null);
                    }

                    // Delete category channel if available
                    if (data.parentChannelId) {
                        const parentChannel =
                            message.guild.channels.cache.get(data.parentChannelId) ||
                            (await message.guild.channels.fetch(data.parentChannelId).catch(() => null));
                        if (parentChannel) await parentChannel.delete().catch(() => null);
                    }

                    let emb = new EmbedBuilder()
                        .setColor(client?.color?.hex ?? "#FF66C4")
                        .setDescription(
                            `**${client.emojiList.tick} | Successfully deleted and disabled the song-requests setup.**`,
                        );

                    return message.reply({
                        embeds: [emb],
                    });
                }

                case "info": {
                    const data = await client.database.getSetup(message.guild.id);

                    if (!data) {
                        let emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(
                                `**${client.emojiList.cross} | No song-requests channel is currently configured for this server.**`,
                            );

                        return message.reply({
                            embeds: [emb],
                        });
                    }

                    const textChannel = data.textChannelId
                        ? message.guild.channels.cache.get(data.textChannelId) ||
                          (await message.guild.channels.fetch(data.textChannelId).catch(() => null))
                        : null;

                    const voiceChannel = data.voiceChannelId
                        ? message.guild.channels.cache.get(data.voiceChannelId) ||
                          (await message.guild.channels.fetch(data.voiceChannelId).catch(() => null))
                        : null;

                    const parentChannel = data.parentChannelId
                        ? message.guild.channels.cache.get(data.parentChannelId) ||
                          (await message.guild.channels.fetch(data.parentChannelId).catch(() => null))
                        : null;

                    if (!textChannel) {
                        let emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(
                                `**${client.emojiList.cross} | The configured song-requests text channel could not be found. It may have been deleted manually.**`,
                            );

                        return message.reply({
                            embeds: [emb],
                        });
                    }

                    let emb = new EmbedBuilder()
                        .setColor(client?.color?.hex ?? "#FF66C4")
                        .setTitle("Song Request Channel Information")
                        .addFields(
                            {
                                name: "Category",
                                value: parentChannel ? `${parentChannel}` : "`None / Deleted`",
                                inline: true,
                            },
                            {
                                name: "Text Channel",
                                value: `${textChannel}`,
                                inline: true,
                            },
                            {
                                name: "Voice Channel",
                                value: voiceChannel ? `${voiceChannel}` : "`None / Deleted`",
                                inline: true,
                            },
                            {
                                name: "Message ID",
                                value: `\`${data.messageId}\``,
                                inline: true,
                            },
                        )
                        .setFooter({
                            text: `Use "${prefix}setup delete" to remove this setup.`,
                        });

                    return message.reply({
                        embeds: [emb],
                    });
                }

                default: {
                    const data = await client.database.getSetup(message.guild.id);

                    const textChannel = data?.textChannelId
                        ? message.guild.channels.cache.get(data.textChannelId) ||
                          (await message.guild.channels.fetch(data.textChannelId).catch(() => null))
                        : null;

                    const voiceChannel = data?.voiceChannelId
                        ? message.guild.channels.cache.get(data.voiceChannelId) ||
                          (await message.guild.channels.fetch(data.voiceChannelId).catch(() => null))
                        : null;

                    const parentChannel = data?.parentChannelId
                        ? message.guild.channels.cache.get(data.parentChannelId) ||
                          (await message.guild.channels.fetch(data.parentChannelId).catch(() => null))
                        : null;

                    const statusValue = textChannel
                        ? `Configured in ${textChannel}`
                        : data
                          ? "Text Channel Missing (Deleted Manually)"
                          : "Not Configured";

                    let emb = new EmbedBuilder()
                        .setColor(client?.color?.hex ?? "#FF66C4")
                        .setTitle("Song Request Channel Setup")
                        .setDescription(
                            subCommand && !["status", "info", "help"].includes(subCommand)
                                ? `**${client.emojiList.cross} | Invalid subcommand \`${subCommand}\`.**\n\n`
                                : null
                        )
                        .addFields(
                            {
                                name: "Setup Status",
                                value: statusValue,
                                inline: true,
                            },
                            ...(textChannel
                                ? [
                                      {
                                          name: "Category",
                                          value: parentChannel ? `${parentChannel}` : "`None / Deleted`",
                                          inline: true,
                                      },
                                      {
                                          name: "Voice Channel",
                                          value: voiceChannel ? `${voiceChannel}` : "`None / Deleted`",
                                          inline: true,
                                      },
                                      {
                                          name: "Message ID",
                                          value: `\`${data.messageId}\``,
                                          inline: true,
                                      },
                                  ]
                                : []),
                            {
                                name: "Available Subcommands",
                                value: [
                                    `• \`${prefix}setup create\` - Creates a dedicated song-requests channel with music buttons.`,
                                    `• \`${prefix}setup delete\` - Deletes the song-requests setup and created channels.`,
                                    `• \`${prefix}setup info\` - Displays details about the configured song-requests channels.`,
                                ].join("\n"),
                                inline: false,
                            },
                        );

                    return message.reply({
                        embeds: [emb],
                    });
                }
            }
        } catch (err) {
            console.dir(err, { depth: null });

            if (err.errors) {
                console.dir(err.errors, { depth: null });
            }

            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `**${client.emojiList.cross} | An error occurred while executing the \`setup\` command.**`,
                );

            return message.reply({
                embeds: [emb],
            });
        }
    },
};
