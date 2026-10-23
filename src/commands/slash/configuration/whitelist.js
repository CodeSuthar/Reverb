const { EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

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
                    const current = await client.database.getWhitelist(guildId);
                    const newMode = !current.mode;
                    await client.database.setWhitelistMode(guildId, newMode);

                    const emb = new EmbedBuilder()
                        .setColor(newMode ? (client?.color?.hex ?? "#FF66C4") : "Red")
                        .setDescription(
                            `**${newMode ? client.emojiList.tick : client.emojiList.cross} | Command restriction system has been \`${newMode ? "enabled" : "disabled"}\` for this server.**\n` +
                            (newMode && (!current.channels || current.channels.length === 0)
                                ? `⚠️ **Notice:** No allowed channels are configured yet. Use \`/whitelist channel action:Add\` so members can run commands.`
                                : "")
                        )
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [emb] });
                }

                case "channel": {
                    const action = interaction.options.getString("action");
                    const channel = interaction.options.getChannel("target");

                    if (action === "add") {
                        const added = await client.database.addWhitelistChannel(guildId, channel.id);
                        await client.database.setWhitelistMode(guildId, true);

                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(added
                                ? `${client.emojiList.tick} | Successfully added ${channel} as an allowed command channel and **enabled** command restrictions.`
                                : `${client.emojiList.cross} | Channel ${channel} is already in the allowed command channels list.`
                            );
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    if (action === "remove") {
                        const removed = await client.database.removeWhitelistChannel(guildId, channel.id);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(removed
                                ? `${client.emojiList.tick} | Successfully removed ${channel} from allowed command channels.`
                                : `${client.emojiList.cross} | Channel ${channel} is not in the allowed channels list.`
                            );
                        return await interaction.editReply({ embeds: [emb] });
                    }
                    break;
                }

                case "role": {
                    const action = interaction.options.getString("action");
                    const role = interaction.options.getRole("target");

                    if (action === "add") {
                        const added = await client.database.addWhitelistRole(guildId, role.id);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(added
                                ? `${client.emojiList.tick} | Successfully added ${role} as a bypass role. Members with this role can run commands anywhere.`
                                : `${client.emojiList.cross} | Role ${role} is already in the bypass roles list.`
                            );
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    if (action === "remove") {
                        const removed = await client.database.removeWhitelistRole(guildId, role.id);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(removed
                                ? `${client.emojiList.tick} | Successfully removed ${role} from bypass roles.`
                                : `${client.emojiList.cross} | Role ${role} is not in the bypass roles list.`
                            );
                        return await interaction.editReply({ embeds: [emb] });
                    }
                    break;
                }

                case "user": {
                    const action = interaction.options.getString("action");
                    const user = interaction.options.getUser("target");

                    if (action === "add") {
                        const added = await client.database.addWhitelistUser(guildId, user.id);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(added
                                ? `${client.emojiList.tick} | Successfully added ${user} as a bypass user. This user can run commands in any channel.`
                                : `${client.emojiList.cross} | User ${user} is already in the bypass users list.`
                            );
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    if (action === "remove") {
                        const removed = await client.database.removeWhitelistUser(guildId, user.id);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(removed
                                ? `${client.emojiList.tick} | Successfully removed ${user} from bypass users.`
                                : `${client.emojiList.cross} | User ${user} is not in the bypass users list.`
                            );
                        return await interaction.editReply({ embeds: [emb] });
                    }
                    break;
                }

                case "clear": {
                    const clearType = interaction.options.getString("type");
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
                                ? `${client.emojiList.warning} **Warning:** System is enabled but no channels are whitelisted yet! Use \`/whitelist channel\` to allow a channel.\n\n`
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
