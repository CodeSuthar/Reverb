const {
    EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ChannelType
} = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("whitelist")
        .setDescription("Manage allowed command channels and bypass roles/users.")
        .addSubcommand((sub) =>
            sub
                .setName("toggle")
                .setDescription("Toggle command restriction mode on or off.")
        )
        .addSubcommand((sub) =>
            sub
                .setName("list")
                .setDescription("View whitelist status, allowed channels, and bypass roles/users.")
        )
        .addSubcommand((sub) =>
            sub
                .setName("add")
                .setDescription("Add an allowed command channel, bypass role, or bypass user.")
                .addChannelOption((opt) =>
                    opt
                        .setName("channel")
                        .setDescription("The text channel to allow commands in")
                        .setRequired(false)
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                )
                .addRoleOption((opt) =>
                    opt
                        .setName("role")
                        .setDescription("The role to grant bypass permissions")
                        .setRequired(false)
                )
                .addUserOption((opt) =>
                    opt
                        .setName("user")
                        .setDescription("The user to grant bypass permissions")
                        .setRequired(false)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("remove")
                .setDescription("Remove an allowed command channel, bypass role, or bypass user.")
                .addChannelOption((opt) =>
                    opt
                        .setName("channel")
                        .setDescription("The text channel to remove from allowed channels")
                        .setRequired(false)
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                )
                .addRoleOption((opt) =>
                    opt
                        .setName("role")
                        .setDescription("The role to remove from bypass roles")
                        .setRequired(false)
                )
                .addUserOption((opt) =>
                    opt
                        .setName("user")
                        .setDescription("The user to remove from bypass users")
                        .setRequired(false)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("channel")
                .setDescription("Add or remove an allowed command channel.")
                .addStringOption((opt) =>
                    opt
                        .setName("action")
                        .setDescription("Choose action")
                        .setRequired(true)
                        .addChoices(
                            { name: "➕ Add", value: "add" },
                            { name: "➖ Remove", value: "remove" }
                        )
                )
                .addChannelOption((opt) =>
                    opt
                        .setName("target")
                        .setDescription("The text channel to allow or disallow")
                        .setRequired(true)
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("role")
                .setDescription("Add or remove a bypass role (can run commands anywhere).")
                .addStringOption((opt) =>
                    opt
                        .setName("action")
                        .setDescription("Choose action")
                        .setRequired(true)
                        .addChoices(
                            { name: "➕ Add", value: "add" },
                            { name: "➖ Remove", value: "remove" }
                        )
                )
                .addRoleOption((opt) =>
                    opt
                        .setName("target")
                        .setDescription("The role to grant or revoke bypass permissions")
                        .setRequired(true)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("user")
                .setDescription("Add or remove a bypass user (can run commands anywhere).")
                .addStringOption((opt) =>
                    opt
                        .setName("action")
                        .setDescription("Choose action")
                        .setRequired(true)
                        .addChoices(
                            { name: "➕ Add", value: "add" },
                            { name: "➖ Remove", value: "remove" }
                        )
                )
                .addUserOption((opt) =>
                    opt
                        .setName("target")
                        .setDescription("The user to grant or revoke bypass permissions")
                        .setRequired(true)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("clear")
                .setDescription("Clear configured whitelist entries.")
                .addStringOption((opt) =>
                    opt
                        .setName("type")
                        .setDescription("Select what to clear")
                        .setRequired(true)
                        .addChoices(
                            { name: "📍 Channels Only", value: "channels" },
                            { name: "🛡️ Roles Only", value: "roles" },
                            { name: "👤 Users Only", value: "users" },
                            { name: "💥 Everything (Reset & Disable)", value: "all" }
                        )
                )
        ),
    permissions: {
        user: [PermissionFlagsBits.ManageGuild],
    },
    run: async (client, interaction) => {
        await interaction.deferReply();
        const subCommand = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        try {
            switch (subCommand) {
                case "toggle": {
                    const whitelist = await client.database.getWhitelist(guildId);
                    const hasChannels = whitelist && whitelist.channels && whitelist.channels.length > 0;

                    if (!hasChannels && !whitelist?.mode) {
                        const emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(
                                `${client.emojiList.cross} | No allowed command channels are configured yet. Please add a channel first using \`/whitelist add\` or \`/whitelist channel\`.`
                            );
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    const currentMode = whitelist ? Boolean(whitelist.mode) : false;
                    const newMode = !currentMode;
                    await client.database.setWhitelistMode(guildId, newMode);

                    const emb = new EmbedBuilder()
                        .setColor(newMode ? (client?.color?.hex ?? "#FF66C4") : "Red")
                        .setDescription(
                            `**${newMode ? client.emojiList.tick : client.emojiList.cross} | Command restriction system has been \`${newMode ? "enabled" : "disabled"}\` for this server.**` +
                            (newMode && !hasChannels
                                ? `\n\n${client.emojiList.warning} **Notice:** No allowed channels are configured yet! Use \`/whitelist add\` so members can run commands.`
                                : "")
                        )
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [emb] });
                }

                case "add": {
                    const channel = interaction.options.getChannel("channel");
                    const role = interaction.options.getRole("role");
                    const user = interaction.options.getUser("user");

                    if (!channel && !role && !user) {
                        const emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(`${client.emojiList.cross} | **Please provide a channel, role, or user to add.**`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    const whitelist = await client.database.getWhitelist(guildId);

                    if (channel) {
                        if (whitelist && whitelist.channels && whitelist.channels.includes(channel.id)) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | The channel ${channel} is already configured as an allowed command channel.`);
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        await client.database.addWhitelistChannel(guildId, channel.id);
                        await client.database.setWhitelistMode(guildId, true);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(`${client.emojiList.tick} | Successfully added ${channel} as an allowed command channel and **enabled** command restrictions.`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    if (role) {
                        if (whitelist && whitelist.roles && whitelist.roles.includes(role.id)) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | The role ${role} is already configured as a bypass role.`);
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        await client.database.addWhitelistRole(guildId, role.id);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(`${client.emojiList.tick} | Successfully added ${role} as a bypass role. Members with this role can run commands anywhere.`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    if (user) {
                        if (whitelist && whitelist.users && whitelist.users.includes(user.id)) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | The user ${user} is already configured as a bypass user.`);
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        await client.database.addWhitelistUser(guildId, user.id);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(`${client.emojiList.tick} | Successfully added ${user} as a bypass user. This user can run commands in any channel.`);
                        return await interaction.editReply({ embeds: [emb] });
                    }
                    break;
                }

                case "remove": {
                    const channel = interaction.options.getChannel("channel");
                    const role = interaction.options.getRole("role");
                    const user = interaction.options.getUser("user");

                    if (!channel && !role && !user) {
                        const emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(`${client.emojiList.cross} | **Please provide a channel, role, or user to remove.**`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    const whitelist = await client.database.getWhitelist(guildId);

                    if (channel) {
                        if (!whitelist || !whitelist.channels || !whitelist.channels.includes(channel.id)) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | The channel ${channel} is not configured as an allowed command channel.`);
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        await client.database.removeWhitelistChannel(guildId, channel.id);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(`${client.emojiList.tick} | Successfully removed ${channel} from allowed command channels.`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    if (role) {
                        if (!whitelist || !whitelist.roles || !whitelist.roles.includes(role.id)) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | The role ${role} is not configured as a bypass role.`);
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        await client.database.removeWhitelistRole(guildId, role.id);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(`${client.emojiList.tick} | Successfully removed ${role} from bypass roles.`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    if (user) {
                        if (!whitelist || !whitelist.users || !whitelist.users.includes(user.id)) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | The user ${user} is not configured as a bypass user.`);
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        await client.database.removeWhitelistUser(guildId, user.id);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(`${client.emojiList.tick} | Successfully removed ${user} from bypass users.`);
                        return await interaction.editReply({ embeds: [emb] });
                    }
                    break;
                }

                case "channel": {
                    const action = interaction.options.getString("action");
                    const channel = interaction.options.getChannel("target");
                    const whitelist = await client.database.getWhitelist(guildId);

                    if (action === "add") {
                        if (whitelist && whitelist.channels && whitelist.channels.includes(channel.id)) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | The channel ${channel} is already configured as an allowed command channel.`);
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        await client.database.addWhitelistChannel(guildId, channel.id);
                        await client.database.setWhitelistMode(guildId, true);

                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(`${client.emojiList.tick} | Successfully added ${channel} as an allowed command channel and **enabled** command restrictions.`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    if (action === "remove") {
                        if (!whitelist || !whitelist.channels || !whitelist.channels.includes(channel.id)) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | The channel ${channel} is not configured as an allowed command channel.`);
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        await client.database.removeWhitelistChannel(guildId, channel.id);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(`${client.emojiList.tick} | Successfully removed ${channel} from allowed command channels.`);
                        return await interaction.editReply({ embeds: [emb] });
                    }
                    break;
                }

                case "role": {
                    const action = interaction.options.getString("action");
                    const role = interaction.options.getRole("target");
                    const whitelist = await client.database.getWhitelist(guildId);

                    if (action === "add") {
                        if (whitelist && whitelist.roles && whitelist.roles.includes(role.id)) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | The role ${role} is already configured as a bypass role.`);
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        await client.database.addWhitelistRole(guildId, role.id);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(`${client.emojiList.tick} | Successfully added ${role} as a bypass role. Members with this role can run commands anywhere.`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    if (action === "remove") {
                        if (!whitelist || !whitelist.roles || !whitelist.roles.includes(role.id)) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | The role ${role} is not configured as a bypass role.`);
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        await client.database.removeWhitelistRole(guildId, role.id);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(`${client.emojiList.tick} | Successfully removed ${role} from bypass roles.`);
                        return await interaction.editReply({ embeds: [emb] });
                    }
                    break;
                }

                case "user": {
                    const action = interaction.options.getString("action");
                    const user = interaction.options.getUser("target");
                    const whitelist = await client.database.getWhitelist(guildId);

                    if (action === "add") {
                        if (whitelist && whitelist.users && whitelist.users.includes(user.id)) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | The user ${user} is already configured as a bypass user.`);
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        await client.database.addWhitelistUser(guildId, user.id);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(`${client.emojiList.tick} | Successfully added ${user} as a bypass user. This user can run commands in any channel.`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    if (action === "remove") {
                        if (!whitelist || !whitelist.users || !whitelist.users.includes(user.id)) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | The user ${user} is not configured as a bypass user.`);
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        await client.database.removeWhitelistUser(guildId, user.id);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(`${client.emojiList.tick} | Successfully removed ${user} from bypass users.`);
                        return await interaction.editReply({ embeds: [emb] });
                    }
                    break;
                }

                case "clear": {
                    const clearType = interaction.options.getString("type");
                    const whitelist = await client.database.getWhitelist(guildId);

                    if (clearType === "channels") {
                        if (!whitelist || !whitelist.channels || whitelist.channels.length === 0) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | There are no allowed command channels configured for this server.`);
                            return await interaction.editReply({ embeds: [emb] });
                        }
                    } else if (clearType === "roles") {
                        if (!whitelist || !whitelist.roles || whitelist.roles.length === 0) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | There are no bypass roles configured for this server.`);
                            return await interaction.editReply({ embeds: [emb] });
                        }
                    } else if (clearType === "users") {
                        if (!whitelist || !whitelist.users || whitelist.users.length === 0) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | There are no bypass users configured for this server.`);
                            return await interaction.editReply({ embeds: [emb] });
                        }
                    } else if (clearType === "all") {
                        const hasChannels = whitelist && whitelist.channels && whitelist.channels.length > 0;
                        const hasRoles = whitelist && whitelist.roles && whitelist.roles.length > 0;
                        const hasUsers = whitelist && whitelist.users && whitelist.users.length > 0;
                        if (!hasChannels && !hasRoles && !hasUsers && !whitelist?.mode) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | There are no whitelist settings configured for this server.`);
                            return await interaction.editReply({ embeds: [emb] });
                        }
                    }

                    await client.database.clearWhitelist(guildId, clearType);

                    const labels = {
                        channels: "all allowed command channels",
                        roles: "all bypass roles",
                        users: "all bypass users",
                        all: "all whitelist settings and disabled command restrictions",
                    };

                    const emb = new EmbedBuilder()
                        .setColor(client?.color?.hex ?? "#FF66C4")
                        .setDescription(`${client.emojiList.tick} | Successfully cleared ${labels[clearType] || "settings"}.`);
                    return await interaction.editReply({ embeds: [emb] });
                }

                case "list":
                default: {
                    const whitelist = await client.database.getWhitelist(guildId);
                    const isEnabled = whitelist ? Boolean(whitelist.mode) : false;

                    const channelsList = whitelist && whitelist.channels && whitelist.channels.length > 0
                        ? whitelist.channels.map((id) => `<#${id}>`).join(", ")
                        : "*None (Commands can run in any channel)*";

                    const rolesList = whitelist && whitelist.roles && whitelist.roles.length > 0
                        ? whitelist.roles.map((id) => `<@&${id}>`).join(", ")
                        : "*None*";

                    const usersList = whitelist && whitelist.users && whitelist.users.length > 0
                        ? whitelist.users.map((id) => `<@${id}>`).join(", ")
                        : "*None*";

                    const emb = new EmbedBuilder()
                        .setColor(client?.color?.hex ?? "#FF66C4")
                        .setTitle(`${client.emojiList.shield} Command Channel & Whitelist Configuration`)
                        .setDescription(
                            `Control where users can run bot commands and configure who can bypass restrictions.\n` +
                            `Status: **${isEnabled ? `${client.emojiList.enabled} Enabled` : `${client.emojiList.disabled} Disabled`}**\n\n` +
                            (isEnabled && (!whitelist.channels || whitelist.channels.length === 0)
                                ? `${client.emojiList.warning} **Warning:** System is enabled but no channels are whitelisted yet! Use \`/whitelist add\` or \`/whitelist channel\` to allow a channel.\n\n`
                                : "")
                        )
                        .addFields(
                            {
                                name: `${client.emojiList.pin} Allowed Command Channels`,
                                value: channelsList,
                                inline: false,
                            },
                            {
                                name: `${client.emojiList.shield} Bypass Roles (Can Run Anywhere)`,
                                value: rolesList,
                                inline: true,
                            },
                            {
                                name: `${client.emojiList.user} Bypass Users (Can Run Anywhere)`,
                                value: usersList,
                                inline: true,
                            }
                        )
                        .setFooter({
                            text: "Members with Manage Server permission can always run commands in any channel.",
                        })
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [emb] });
                }
            }
        } catch (err) {
            console.error("Error in whitelist slash command:", err);
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(`${client.emojiList.cross} | An error occurred while executing the \`/whitelist\` command.`),
                ],
            });
        }
    },
};
