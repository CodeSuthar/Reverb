const {
    EmbedBuilder,
    ChannelType,
    PermissionFlagsBits,
    SlashCommandBuilder,
} = require("discord.js");
const { buildSetupView } = require("../../../utils/buildSetupView");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("setup")
        .setDescription("Configure or manage the song-requests text channel.")
        .addSubcommand((sub) =>
            sub.setName("create").setDescription("Create and initialize the music request channel.")
        )
        .addSubcommand((sub) =>
            sub.setName("delete").setDescription("Delete the existing music request channel.")
        )
        .addSubcommand((sub) =>
            sub.setName("info").setDescription("Display info about the music request channel.")
        ),
    permissions: {
        client: [
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.ManageMessages,
        ],
        user: [PermissionFlagsBits.ManageGuild],
    },
    run: async (client, interaction) => {
        await interaction.deferReply();

        const subCommand = interaction.options.getSubcommand();

        try {
            switch (subCommand) {
                case "create": {
                    const data = await client.database.getSetup(interaction.guildId);
                    if (data?.textChannelId && data?.messageId) {
                        const existingChannel =
                            interaction.guild.channels.cache.get(data.textChannelId) ||
                            (await interaction.guild.channels.fetch(data.textChannelId).catch(() => null));

                        if (existingChannel) {
                            let emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(
                                    `**${client.emojiList.cross} | A song-requests channel already exists in this server: ${existingChannel}.**`
                                );

                            return await interaction.editReply({ embeds: [emb] });
                        }
                    }

                    const botName = client?.config?.bot?.name || client?.user?.username || "Reverb";

                    const parentChannel = await interaction.guild.channels.create({
                        name: `${botName} Music Zone`,
                        type: ChannelType.GuildCategory,
                    });

                    const textChannel = await interaction.guild.channels.create({
                        name: `${botName.toLowerCase()}-song-requests`,
                        type: ChannelType.GuildText,
                        parent: parentChannel.id,
                        topic: `Music request channel for ${botName}. Simply send song names or URLs here to play!`,
                    });

                    const viewPayload = buildSetupView(client, interaction.guildId);
                    const bannerMsg = await textChannel.send(viewPayload);

                    await client.database.setSetup(
                        interaction.guildId,
                        textChannel.id,
                        bannerMsg.id,
                        parentChannel.id
                    );

                    let emb = new EmbedBuilder()
                        .setColor(client?.color?.hex ?? "#FF66C4")
                        .setDescription(
                            `**${client.emojiList.tick} | Successfully configured the song-requests channel: ${textChannel}.**`
                        );

                    return await interaction.editReply({ embeds: [emb] });
                }

                case "delete": {
                    const data = await client.database.getSetup(interaction.guildId);

                    if (!data?.textChannelId) {
                        let emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(
                                `**${client.emojiList.cross} | There is no song-requests channel configured for this server.**`
                            );

                        return await interaction.editReply({ embeds: [emb] });
                    }

                    const channel =
                        interaction.guild.channels.cache.get(data.textChannelId) ||
                        (await interaction.guild.channels.fetch(data.textChannelId).catch(() => null));

                    if (channel) {
                        await channel.delete("User requested to delete the setup channel.").catch(() => null);
                    }

                    if (data.categoryChannelId) {
                        const category =
                            interaction.guild.channels.cache.get(data.categoryChannelId) ||
                            (await interaction.guild.channels.fetch(data.categoryChannelId).catch(() => null));
                        if (category) {
                            await category.delete("User requested to delete setup category.").catch(() => null);
                        }
                    }

                    await client.database.deleteSetup(interaction.guildId);

                    let emb = new EmbedBuilder()
                        .setColor(client?.color?.hex ?? "#FF66C4")
                        .setDescription(
                            `**${client.emojiList.tick} | Successfully deleted the song-requests channel configuration.**`
                        );

                    return await interaction.editReply({ embeds: [emb] });
                }

                case "info": {
                    const data = await client.database.getSetup(interaction.guildId);

                    if (!data?.textChannelId) {
                        let emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(
                                `**${client.emojiList.cross} | There is no song-requests channel configured for this server.**`
                            );

                        return await interaction.editReply({ embeds: [emb] });
                    }

                    let emb = new EmbedBuilder()
                        .setColor(client?.color?.hex ?? "#FF66C4")
                        .setTitle("Song Request Channel Configuration")
                        .setDescription(
                            `• **Channel:** <#${data.textChannelId}> (\`${data.textChannelId}\`)\n` +
                            `• **Message ID:** \`${data.messageId || "N/A"}\`\n` +
                            `• **Category:** ${data.categoryChannelId ? `<#${data.categoryChannelId}>` : "None"}`
                        );

                    return await interaction.editReply({ embeds: [emb] });
                }
            }
        } catch (err) {
            console.dir(err, { depth: null });

            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `**${client.emojiList.cross} | An error occurred while executing the setup command.**`
                );

            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
