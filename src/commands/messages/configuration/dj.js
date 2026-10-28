const {
    EmbedBuilder, PermissionFlagsBits
} = require("discord.js");

module.exports = {
    name: "dj",
    description: "Manage DJ roles and users, and toggle DJ mode for the server.",
    usage: "<add | remove | role | user | clear | toggle> [@role | @user]",
    category: "configuration",
    aliases: ["djmode", "djrole", "djuser"],
    permissions: {
        user: [PermissionFlagsBits.ManageGuild],
    },
    run: async (message, args, client, prefix) => {
        const subCommand = args[0]?.toLowerCase();
        const guildId = message.guild.id;

        const resolveRole = async (query) => {
            if (!query) return null;

            // 1. Direct mention regex match
            const mentionMatch = query.match(/^<@&(\d+)>$/);
            if (mentionMatch) {
                const roleId = mentionMatch[1];
                return message.guild.roles.cache.get(roleId) || (await message.guild.roles.fetch(roleId).catch(() => null));
            }

            // 2. Raw snowflake ID
            const cleanId = query.replace(/[<@&>]/g, "");
            if (/^\d{17,20}$/.test(cleanId)) {
                const role = message.guild.roles.cache.get(cleanId) || (await message.guild.roles.fetch(cleanId).catch(() => null));
                if (role) return role;
            }

            // 3. Fallback to message.mentions.roles if present
            if (message.mentions.roles.size > 0) {
                return message.mentions.roles.first();
            }

            // 4. Role name search (case-insensitive)
            return (
                message.guild.roles.cache.find(
                    (r) => r.name.toLowerCase() === query.toLowerCase(),
                ) || null
            );
        };

        const resolveUser = async (query) => {
            if (!query) return null;

            // 1. Direct user mention regex match
            const mentionMatch = query.match(/^<@!?(\d+)>$/);
            if (mentionMatch) {
                const userId = mentionMatch[1];
                return client.users.cache.get(userId) || (await client.users.fetch(userId).catch(() => null));
            }

            // 2. Raw snowflake ID
            const cleanId = query.replace(/[<@!>]/g, "");
            if (/^\d{17,20}$/.test(cleanId)) {
                return client.users.cache.get(cleanId) || (await client.users.fetch(cleanId).catch(() => null));
            }

            // 3. Fallback to message.mentions.users if present
            if (message.mentions.users.size > 0) {
                return message.mentions.users.first();
            }

            // 4. Search by username or member tag
            const lower = query.toLowerCase();
            const member = message.guild.members.cache.find(
                (m) =>
                    m.user.username.toLowerCase() === lower ||
                    m.user.tag.toLowerCase() === lower ||
                    (m.nickname && m.nickname.toLowerCase() === lower)
            );
            return member ? member.user : null;
        };

        try {
            switch (subCommand) {
                case "role": {
                    const action = args[1]?.toLowerCase();
                    const query = args.slice(2).join(" ");
                    const role = await resolveRole(query || args[2]);

                    if (action === "add") {
                        if (!role) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(
                                            `${client.emojiList.cross} | **Please provide a valid role to add.**\nUsage: \`${prefix}dj role add <@role | roleId | roleName>\``
                                        ),
                                ],
                            });
                        }

                        const dj = await client.database.getDJ(guildId);
                        if (dj && dj.roles && dj.roles.includes(role.id)) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | The role ${role} is already configured as a DJ role.`),
                                ],
                            });
                        }

                        await client.database.addDJRole(guildId, role.id);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully added ${role} as a DJ role and **enabled** DJ mode.`),
                            ],
                        });
                    }

                    if (action === "remove") {
                        if (!role) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(
                                            `${client.emojiList.cross} | **Please provide a valid role to remove.**\nUsage: \`${prefix}dj role remove <@role | roleId | roleName>\``
                                        ),
                                ],
                            });
                        }

                        const dj = await client.database.getDJ(guildId);
                        if (!dj || !dj.roles || !dj.roles.includes(role.id)) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | The role ${role} is not configured as a DJ role.`),
                                ],
                            });
                        }

                        await client.database.removeDJRole(guildId, role.id);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully removed ${role} from DJ roles.`),
                            ],
                        });
                    }

                    if (action === "clear") {
                        const dj = await client.database.getDJ(guildId);
                        if (!dj || !dj.roles || dj.roles.length === 0) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | There are no DJ roles configured for this server.`),
                                ],
                            });
                        }

                        await client.database.clearDJRoles(guildId);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully cleared all DJ roles for this server.`),
                            ],
                        });
                    }

                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`Usage: \`${prefix}dj role <add | remove | clear> [role]\``),
                        ],
                    });
                }

                case "user": {
                    const action = args[1]?.toLowerCase();
                    const query = args.slice(2).join(" ");
                    const user = await resolveUser(query || args[2]);

                    if (action === "add") {
                        if (!user) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(
                                            `${client.emojiList.cross} | **Please provide a valid user to add.**\nUsage: \`${prefix}dj user add <@user | userId | username>\``
                                        ),
                                ],
                            });
                        }

                        const dj = await client.database.getDJ(guildId);
                        if (dj && dj.users && dj.users.includes(user.id)) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | The user ${user} is already configured as a DJ user.`),
                                ],
                            });
                        }

                        await client.database.addDJUser(guildId, user.id);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully added ${user} as a DJ user and **enabled** DJ mode.`),
                            ],
                        });
                    }

                    if (action === "remove") {
                        if (!user) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(
                                            `${client.emojiList.cross} | **Please provide a valid user to remove.**\nUsage: \`${prefix}dj user remove <@user | userId | username>\``
                                        ),
                                ],
                            });
                        }

                        const dj = await client.database.getDJ(guildId);
                        if (!dj || !dj.users || !dj.users.includes(user.id)) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | The user ${user} is not configured as a DJ user.`),
                                ],
                            });
                        }

                        await client.database.removeDJUser(guildId, user.id);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully removed ${user} from DJ users.`),
                            ],
                        });
                    }

                    if (action === "clear") {
                        const dj = await client.database.getDJ(guildId);
                        if (!dj || !dj.users || dj.users.length === 0) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | There are no DJ users configured for this server.`),
                                ],
                            });
                        }

                        await client.database.clearDJUsers(guildId);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully cleared all DJ users for this server.`),
                            ],
                        });
                    }

                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`Usage: \`${prefix}dj user <add | remove | clear> [user]\``),
                        ],
                    });
                }

                case "add": {
                    const query = args.slice(1).join(" ");
                    if (!query) {
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("Red")
                                    .setDescription(
                                        `${client.emojiList.cross} | **Please provide a role or user to add.**\nUsage: \`${prefix}dj add <@role | @user>\``
                                    ),
                            ],
                        });
                    }

                    // Try resolving role first
                    const role = await resolveRole(query);
                    if (role) {
                        const dj = await client.database.getDJ(guildId);
                        if (dj && dj.roles && dj.roles.includes(role.id)) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | The role ${role} is already configured as a DJ role.`),
                                ],
                            });
                        }

                        await client.database.addDJRole(guildId, role.id);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully added ${role} as a DJ role and **enabled** DJ mode.`),
                            ],
                        });
                    }

                    // Try resolving user
                    const user = await resolveUser(args[1] || query);
                    if (user) {
                        const dj = await client.database.getDJ(guildId);
                        if (dj && dj.users && dj.users.includes(user.id)) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | The user ${user} is already configured as a DJ user.`),
                                ],
                            });
                        }

                        await client.database.addDJUser(guildId, user.id);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully added ${user} as a DJ user and **enabled** DJ mode.`),
                            ],
                        });
                    }

                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | Could not resolve \`${query}\` to a valid role or user on this server.`),
                        ],
                    });
                }

                case "remove": {
                    const query = args.slice(1).join(" ");
                    if (!query) {
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("Red")
                                    .setDescription(
                                        `${client.emojiList.cross} | **Please provide a role or user to remove.**\nUsage: \`${prefix}dj remove <@role | @user>\``
                                    ),
                            ],
                        });
                    }

                    const dj = await client.database.getDJ(guildId);

                    // Try resolving role first
                    const role = await resolveRole(query);
                    if (role && dj && dj.roles && dj.roles.includes(role.id)) {
                        await client.database.removeDJRole(guildId, role.id);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully removed ${role} from DJ roles.`),
                            ],
                        });
                    }

                    // Try resolving user
                    const user = await resolveUser(args[1] || query);
                    if (user && dj && dj.users && dj.users.includes(user.id)) {
                        await client.database.removeDJUser(guildId, user.id);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully removed ${user} from DJ users.`),
                            ],
                        });
                    }

                    if (role && (!dj || !dj.roles || !dj.roles.includes(role.id))) {
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("Red")
                                    .setDescription(`${client.emojiList.cross} | The role ${role} is not configured as a DJ role.`),
                            ],
                        });
                    }

                    if (user && (!dj || !dj.users || !dj.users.includes(user.id))) {
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("Red")
                                    .setDescription(`${client.emojiList.cross} | The user ${user} is not configured as a DJ user.`),
                            ],
                        });
                    }

                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | Could not resolve \`${query}\` to a configured DJ role or user.`),
                        ],
                    });
                }

                case "clear": {
                    const clearType = args[1]?.toLowerCase();

                    if (clearType === "roles") {
                        await client.database.clearDJRoles(guildId);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully cleared all DJ roles.`),
                            ],
                        });
                    }

                    if (clearType === "users") {
                        await client.database.clearDJUsers(guildId);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully cleared all DJ users.`),
                            ],
                        });
                    }

                    // Clear everything
                    const dj = await client.database.getDJ(guildId);
                    const hasRoles = dj && dj.roles && dj.roles.length > 0;
                    const hasUsers = dj && dj.users && dj.users.length > 0;

                    if (!hasRoles && !hasUsers && !dj?.mode) {
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("Red")
                                    .setDescription(`${client.emojiList.cross} | There are no DJ roles or users configured for this server.`),
                            ],
                        });
                    }

                    await client.database.clearDJ(guildId, "all");
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(client?.color?.hex ?? "#FF66C4")
                                .setDescription(`${client.emojiList.tick} | Successfully cleared all DJ roles, DJ users, and **disabled** DJ mode.`),
                        ],
                    });
                }

                case "toggle": {
                    const dj = await client.database.getDJ(guildId);
                    const hasRoles = dj && dj.roles && dj.roles.length > 0;
                    const hasUsers = dj && dj.users && dj.users.length > 0;

                    if (!hasRoles && !hasUsers && !dj?.mode) {
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("Red")
                                    .setDescription(
                                        `${client.emojiList.cross} | No DJ roles or users are configured yet. Please add a role or user first using \`${prefix}dj add <@role | @user>\`.`
                                    ),
                            ],
                        });
                    }

                    const currentMode = dj ? Boolean(dj.mode) : false;
                    const newMode = !currentMode;

                    await client.database.setDJ(guildId, newMode);

                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(newMode ? (client?.color?.hex ?? "#FF66C4") : "Red")
                                .setDescription(
                                    `**${newMode ? client.emojiList.tick : client.emojiList.cross} | DJ mode has been \`${newMode ? "enabled" : "disabled"}\` for this server.**` +
                                    (newMode && !hasRoles && !hasUsers
                                        ? `\n\n${client.emojiList.warning} **Notice:** No DJ roles or users are set yet! Use \`${prefix}dj add <@role | @user>\` so members can control music.`
                                        : "")
                                ),
                        ],
                    });
                }

                case "list":
                case "status":
                case "info":
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
                            (subCommand && !["list", "status", "info", "help"].includes(subCommand)
                                ? `${client.emojiList.cross} | Invalid subcommand \`${subCommand}\`.\n\n`
                                : "") +
                            `Control music playback permissions with authorized DJ roles and users.\n` +
                            `Status: **${isEnabled ? `${client.emojiList.enabled} Enabled` : `${client.emojiList.disabled} Disabled`}**\n\n` +
                            (isEnabled && (!dj.roles || dj.roles.length === 0) && (!dj.users || dj.users.length === 0)
                                ? `${client.emojiList.warning} **Warning:** DJ mode is enabled but no roles or users are configured yet! Add one using \`${prefix}dj add <@role | @user>\`.\n\n`
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
                            },
                            {
                                name: "Available Subcommands",
                                value: [
                                    `• \`${prefix}dj add <@role | @user>\` - Add an authorized DJ role or user.`,
                                    `• \`${prefix}dj remove <@role | @user>\` - Remove an authorized DJ role or user.`,
                                    `• \`${prefix}dj role <add | remove | clear> <@role>\` - Manage DJ roles.`,
                                    `• \`${prefix}dj user <add | remove | clear> <@user>\` - Manage DJ users.`,
                                    `• \`${prefix}dj clear [roles | users | all]\` - Clear configured entries.`,
                                    `• \`${prefix}dj toggle\` - Toggle DJ mode on or off.`,
                                ].join("\n"),
                                inline: false,
                            }
                        )
                        .setFooter({
                            text: "Members with Manage Server permission can always use DJ commands.",
                        })
                        .setTimestamp();

                    return message.reply({
                        embeds: [emb],
                    });
                }
            }
        } catch (err) {
            console.error("Error in DJ message command:", err);

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(
                            `${client.emojiList.cross} | An error occurred while executing the \`dj\` command.`,
                        ),
                ],
            });
        }
    },
};
