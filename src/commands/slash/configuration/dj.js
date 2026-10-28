const {
    EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits
} = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("dj")
        .setDescription("Manage DJ roles and users, and toggle DJ mode for the server.")
        .addSubcommand((sub) =>
            sub
                .setName("toggle")
                .setDescription("Toggle DJ mode on or off.")
        )
        .addSubcommand((sub) =>
            sub
                .setName("list")
                .setDescription("View DJ mode status, configured roles, and configured users.")
        )
        .addSubcommand((sub) =>
            sub
                .setName("add")
                .setDescription("Add an authorized DJ role or user.")
                .addMentionableOption((opt) =>
                    opt
                        .setName("target")
                        .setDescription("The role or user to add as DJ")
                        .setRequired(true)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("remove")
                .setDescription("Remove an authorized DJ role or user.")
                .addMentionableOption((opt) =>
                    opt
                        .setName("target")
                        .setDescription("The role or user to remove from DJ")
                        .setRequired(true)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("role")
                .setDescription("Add or remove an authorized DJ role.")
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
                        .setDescription("The role to grant or revoke DJ permissions")
                        .setRequired(true)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("user")
                .setDescription("Add or remove an authorized DJ user.")
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
                        .setDescription("The user to grant or revoke DJ permissions")
                        .setRequired(true)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName("clear")
                .setDescription("Clear configured DJ entries.")
                .addStringOption((opt) =>
                    opt
                        .setName("type")
                        .setDescription("Select what to clear")
                        .setRequired(true)
                        .addChoices(
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
                    const dj = await client.database.getDJ(guildId);
                    const hasRoles = dj && dj.roles && dj.roles.length > 0;
                    const hasUsers = dj && dj.users && dj.users.length > 0;

                    if (!hasRoles && !hasUsers && !dj?.mode) {
                        const emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(
                                `${client.emojiList.cross} | No DJ roles or users are configured yet. Please add a role or user first using \`/dj add\`.`
                            );
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    const currentMode = dj ? Boolean(dj.mode) : false;
                    const newMode = !currentMode;

                    await client.database.setDJ(guildId, newMode);

                    const emb = new EmbedBuilder()
                        .setColor(newMode ? (client?.color?.hex ?? "#FF66C4") : "Red")
                        .setDescription(
                            `**${newMode ? client.emojiList.tick : client.emojiList.cross} | DJ mode has been \`${newMode ? "enabled" : "disabled"}\` for this server.**` +
                            (newMode && !hasRoles && !hasUsers
                                ? `\n\n${client.emojiList.warning} **Notice:** No DJ roles or users are set yet! Use \`/dj add\` so members can control music.`
                                : "")
                        );

                    return await interaction.editReply({ embeds: [emb] });
                }

                case "add": {
                    const mentionable = interaction.options.getMentionable("target");
                    const isRole = Boolean(mentionable.guild && mentionable.color !== undefined && !mentionable.user);
                    const role = isRole ? mentionable : null;
                    const user = !isRole ? (mentionable.user || mentionable) : null;

                    if (role) {
                        const dj = await client.database.getDJ(guildId);
                        if (dj && dj.roles && dj.roles.includes(role.id)) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | The role ${role} is already configured as a DJ role.`);
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        await client.database.addDJRole(guildId, role.id);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(`${client.emojiList.tick} | Successfully added ${role} as a DJ role and **enabled** DJ mode.`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    if (user) {
                        const dj = await client.database.getDJ(guildId);
                        if (dj && dj.users && dj.users.includes(user.id)) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | The user ${user} is already configured as a DJ user.`);
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        await client.database.addDJUser(guildId, user.id);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(`${client.emojiList.tick} | Successfully added ${user} as a DJ user and **enabled** DJ mode.`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    const emb = new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(`${client.emojiList.cross} | Please provide a valid role or user to add.`);
                    return await interaction.editReply({ embeds: [emb] });
                }

                case "remove": {
                    const mentionable = interaction.options.getMentionable("target");
                    const isRole = Boolean(mentionable.guild && mentionable.color !== undefined && !mentionable.user);
                    const role = isRole ? mentionable : null;
                    const user = !isRole ? (mentionable.user || mentionable) : null;
                    const dj = await client.database.getDJ(guildId);

                    if (role) {
                        if (!dj || !dj.roles || !dj.roles.includes(role.id)) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | The role ${role} is not configured as a DJ role.`);
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        await client.database.removeDJRole(guildId, role.id);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(`${client.emojiList.tick} | Successfully removed ${role} from DJ roles.`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    if (user) {
                        if (!dj || !dj.users || !dj.users.includes(user.id)) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | The user ${user} is not configured as a DJ user.`);
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        await client.database.removeDJUser(guildId, user.id);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(`${client.emojiList.tick} | Successfully removed ${user} from DJ users.`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    const emb = new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(`${client.emojiList.cross} | Please provide a valid role or user to remove.`);
                    return await interaction.editReply({ embeds: [emb] });
                }

                case "role": {
                    const action = interaction.options.getString("action");
                    const role = interaction.options.getRole("target");

                    if (action === "add") {
                        const dj = await client.database.getDJ(guildId);
                        if (dj && dj.roles && dj.roles.includes(role.id)) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | The role ${role} is already configured as a DJ role.`);
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        await client.database.addDJRole(guildId, role.id);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(`${client.emojiList.tick} | Successfully added ${role} as a DJ role and **enabled** DJ mode.`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    if (action === "remove") {
                        const dj = await client.database.getDJ(guildId);
                        if (!dj || !dj.roles || !dj.roles.includes(role.id)) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | The role ${role} is not configured as a DJ role.`);
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        await client.database.removeDJRole(guildId, role.id);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(`${client.emojiList.tick} | Successfully removed ${role} from DJ roles.`);
                        return await interaction.editReply({ embeds: [emb] });
                    }
                    break;
                }

                case "user": {
                    const action = interaction.options.getString("action");
                    const user = interaction.options.getUser("target");

                    if (action === "add") {
                        const dj = await client.database.getDJ(guildId);
                        if (dj && dj.users && dj.users.includes(user.id)) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | The user ${user} is already configured as a DJ user.`);
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        await client.database.addDJUser(guildId, user.id);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(`${client.emojiList.tick} | Successfully added ${user} as a DJ user and **enabled** DJ mode.`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    if (action === "remove") {
                        const dj = await client.database.getDJ(guildId);
                        if (!dj || !dj.users || !dj.users.includes(user.id)) {
                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | The user ${user} is not configured as a DJ user.`);
                            return await interaction.editReply({ embeds: [emb] });
                        }

                        await client.database.removeDJUser(guildId, user.id);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(`${client.emojiList.tick} | Successfully removed ${user} from DJ users.`);
                        return await interaction.editReply({ embeds: [emb] });
                    }
                    break;
                }

                case "clear": {
                    const clearType = interaction.options.getString("type");

                    if (clearType === "roles") {
                        await client.database.clearDJRoles(guildId);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(`${client.emojiList.tick} | Successfully cleared all DJ roles.`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    if (clearType === "users") {
                        await client.database.clearDJUsers(guildId);
                        const emb = new EmbedBuilder()
                            .setColor(client?.color?.hex ?? "#FF66C4")
                            .setDescription(`${client.emojiList.tick} | Successfully cleared all DJ users.`);
                        return await interaction.editReply({ embeds: [emb] });
                    }

                    await client.database.clearDJ(guildId, "all");
                    const emb = new EmbedBuilder()
                        .setColor(client?.color?.hex ?? "#FF66C4")
                        .setDescription(`${client.emojiList.tick} | Successfully cleared all DJ roles, DJ users, and **disabled** DJ mode.`);
                    return await interaction.editReply({ embeds: [emb] });
                }

                case "list":
                default: {
                    const dj = await client.database.getDJ(guildId);
                    const isEnabled = dj ? Boolean(dj.mode) : false;

                    const roleList =
                        dj && dj.roles && dj.roles.length > 0
                            ? dj.roles.map((r) => `<@&${r}>`).join(", ")
                            : "*None*";

                    const userList =
                        dj && dj.users && dj.users.length > 0
                            ? dj.users.map((u) => `<@${u}>`).join(", ")
                            : "*None*";

                    const emb = new EmbedBuilder()
                        .setColor(client?.color?.hex ?? "#FF66C4")
                        .setTitle(`${client.emojiList.shield} DJ System Configuration`)
                        .setDescription(
                            `Control music playback permissions with authorized DJ roles and users.\n` +
                            `Status: **${isEnabled ? `${client.emojiList.enabled} Enabled` : `${client.emojiList.disabled} Disabled`}**\n\n` +
                            (isEnabled && (!dj.roles || dj.roles.length === 0) && (!dj.users || dj.users.length === 0)
                                ? `${client.emojiList.warning} **Warning:** DJ mode is enabled but no roles or users are configured yet! Use \`/dj add\` to configure one.\n\n`
                                : "")
                        )
                        .addFields(
                            {
                                name: `${client.emojiList.shield} Configured DJ Roles`,
                                value: roleList,
                                inline: true,
                            },
                            {
                                name: `${client.emojiList.user} Configured DJ Users`,
                                value: userList,
                                inline: true,
                            }
                        )
                        .setFooter({
                            text: "Members with Manage Server permission can always use DJ commands.",
                        })
                        .setTimestamp();

                    return await interaction.editReply({ embeds: [emb] });
                }
            }
        } catch (err) {
            console.error("Error in DJ slash command:", err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | An error occurred while executing the DJ command.`);
            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
