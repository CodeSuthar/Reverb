const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    name: "whitelist",
    description: "Manage allowed command channels and bypass roles/users.",
    usage: "<add | remove | clear | toggle | list> [channel | role | user]",
    category: "configuration",
    aliases: ["cmdchannel", "botchannel", "channels", "wl"],
    permissions: {
        user: [PermissionFlagsBits.ManageGuild],
    },
    run: async (message, args, client, prefix) => {
        const subCommand = args[0]?.toLowerCase();
        const guildId = message.guild.id;

        // Helpers to resolve Channel, Role, or User from arguments
        const resolveChannel = async (query) => {
            if (!query) return null;

            // 1. Direct channel mention regex
            const mentionMatch = query.match(/^<#(\d+)>$/);
            if (mentionMatch) {
                const chanId = mentionMatch[1];
                return message.guild.channels.cache.get(chanId) || (await message.guild.channels.fetch(chanId).catch(() => null));
            }

            // 2. Raw snowflake ID
            const cleanId = query.replace(/[<#>]/g, "");
            if (/^\d{17,20}$/.test(cleanId)) {
                const chan = message.guild.channels.cache.get(cleanId) || (await message.guild.channels.fetch(cleanId).catch(() => null));
                if (chan) return chan;
            }

            // 3. Fallback to message.mentions.channels if present in message
            if (message.mentions.channels.size > 0) {
                return message.mentions.channels.first();
            }

            // 4. Search by channel name (case-insensitive)
            const nameQuery = query.toLowerCase().replace(/^#/, "");
            return message.guild.channels.cache.find((c) => c.name.toLowerCase() === nameQuery) || null;
        };

        const resolveRole = async (query) => {
            if (!query) return null;

            // 1. Direct role mention regex
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

            // 3. Fallback to message.mentions.roles if present in message
            if (message.mentions.roles.size > 0) {
                return message.mentions.roles.first();
            }

            // 4. Search by role name (case-insensitive)
            return message.guild.roles.cache.find((r) => r.name.toLowerCase() === query.toLowerCase()) || null;
        };

        const resolveUser = async (query) => {
            if (!query) return null;

            // 1. Direct user mention regex
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

            // 3. Fallback to message.mentions.users if present in message
            if (message.mentions.users.size > 0) {
                return message.mentions.users.first();
            }

            // 4. Search by username or display name
            const lowerQuery = query.toLowerCase();
            const member = message.guild.members.cache.find(
                (m) => m.user.tag?.toLowerCase() === lowerQuery || m.user.username?.toLowerCase() === lowerQuery || m.displayName?.toLowerCase() === lowerQuery
            );
            if (member) return member.user;

            return null;
        };

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
                                ? `${client.emojiList.warning} **Notice:** No allowed channels are configured yet. Please add a channel using \`${prefix}whitelist add <#channel>\` so members can run commands.`
                                : "")
                        )
                        .setTimestamp();

                    return message.reply({ embeds: [emb] });
                }

                case "channel": {
                    const action = args[1]?.toLowerCase();
                    const target = await resolveChannel(args[2]);

                    if (action === "add") {
                        if (!target) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | **Please mention or provide the ID/name of a valid text channel.**\nUsage: \`${prefix}whitelist channel add <#channel | channelId>\``),
                                ],
                            });
                        }
                        const added = await client.database.addWhitelistChannel(guildId, target.id);
                        if (!added) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | Channel ${target} is already on the allowed command channels list.`),
                                ],
                            });
                        }
                        await client.database.setWhitelistMode(guildId, true);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully added ${target} as an allowed command channel and **enabled** command restrictions.`),
                            ],
                        });
                    }

                    if (action === "remove") {
                        if (!target) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | **Please mention or provide the ID of a valid channel to remove.**\nUsage: \`${prefix}whitelist channel remove <#channel>\``),
                                ],
                            });
                        }
                        const removed = await client.database.removeWhitelistChannel(guildId, target.id);
                        if (!removed) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | Channel ${target} is not in the allowed channels list.`),
                                ],
                            });
                        }
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully removed ${target} from the allowed command channels list.`),
                            ],
                        });
                    }

                    if (action === "clear") {
                        await client.database.clearWhitelistChannels(guildId);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully cleared all allowed command channels.`),
                            ],
                        });
                    }

                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`Usage: \`${prefix}whitelist channel <add | remove | clear> <#channel>\``),
                        ],
                    });
                }

                case "role": {
                    const action = args[1]?.toLowerCase();
                    const target = await resolveRole(args.slice(2).join(" "));

                    if (action === "add") {
                        if (!target) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | **Please mention or provide the ID/name of a valid role.**\nUsage: \`${prefix}whitelist role add <@role | roleId | roleName>\``),
                                ],
                            });
                        }
                        const added = await client.database.addWhitelistRole(guildId, target.id);
                        if (!added) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | Role ${target} is already configured as a bypass role.`),
                                ],
                            });
                        }
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully added ${target} as a bypass role. Members with this role can run commands anywhere.`),
                            ],
                        });
                    }

                    if (action === "remove") {
                        if (!target) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | **Please mention or provide a valid role to remove.**\nUsage: \`${prefix}whitelist role remove <@role>\``),
                                ],
                            });
                        }
                        const removed = await client.database.removeWhitelistRole(guildId, target.id);
                        if (!removed) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | Role ${target} is not in the bypass roles list.`),
                                ],
                            });
                        }
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully removed ${target} from bypass roles.`),
                            ],
                        });
                    }

                    if (action === "clear") {
                        await client.database.clearWhitelistRoles(guildId);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully cleared all bypass roles.`),
                            ],
                        });
                    }

                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`Usage: \`${prefix}whitelist role <add | remove | clear> <@role>\``),
                        ],
                    });
                }

                case "user": {
                    const action = args[1]?.toLowerCase();
                    const target = await resolveUser(args[2]);

                    if (action === "add") {
                        if (!target) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | **Please mention or provide a valid user.**\nUsage: \`${prefix}whitelist user add <@user>\``),
                                ],
                            });
                        }
                        const added = await client.database.addWhitelistUser(guildId, target.id);
                        if (!added) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | User ${target} is already configured as a bypass user.`),
                                ],
                            });
                        }
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully added ${target} as a bypass user. This user can run commands in any channel.`),
                            ],
                        });
                    }

                    if (action === "remove") {
                        if (!target) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | **Please mention or provide a valid user to remove.**\nUsage: \`${prefix}whitelist user remove <@user>\``),
                                ],
                            });
                        }
                        const removed = await client.database.removeWhitelistUser(guildId, target.id);
                        if (!removed) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | User ${target} is not in the bypass users list.`),
                                ],
                            });
                        }
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully removed ${target} from bypass users.`),
                            ],
                        });
                    }

                    if (action === "clear") {
                        await client.database.clearWhitelistUsers(guildId);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully cleared all bypass users.`),
                            ],
                        });
                    }

                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`Usage: \`${prefix}whitelist user <add | remove | clear> <@user>\``),
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
                                    .setDescription(`${client.emojiList.cross} | **Please provide a channel, role, or user to add.**\nUsage: \`${prefix}whitelist add <#channel | @role | @user>\``),
                            ],
                        });
                    }

                    const channel = await resolveChannel(args[1]);
                    if (channel) {
                        const added = await client.database.addWhitelistChannel(guildId, channel.id);
                        await client.database.setWhitelistMode(guildId, true);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(added
                                        ? `${client.emojiList.tick} | Successfully added ${channel} as an allowed command channel and **enabled** command restrictions.`
                                        : `${client.emojiList.cross} | Channel ${channel} is already in the allowed command channels list.`
                                    ),
                            ],
                        });
                    }

                    const role = await resolveRole(query);
                    if (role) {
                        const added = await client.database.addWhitelistRole(guildId, role.id);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(added
                                        ? `${client.emojiList.tick} | Successfully added ${role} as a bypass role. Members with this role can run commands anywhere.`
                                        : `${client.emojiList.cross} | Role ${role} is already in the bypass roles list.`
                                    ),
                            ],
                        });
                    }

                    const user = await resolveUser(args[1]);
                    if (user) {
                        const added = await client.database.addWhitelistUser(guildId, user.id);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(added
                                        ? `${client.emojiList.tick} | Successfully added ${user} as a bypass user. This user can run commands anywhere.`
                                        : `${client.emojiList.cross} | User ${user} is already in the bypass users list.`
                                    ),
                            ],
                        });
                    }

                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | Could not resolve \`${query}\` to a valid channel, role, or user.`),
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
                                    .setDescription(`${client.emojiList.cross} | **Please provide a channel, role, or user to remove.**\nUsage: \`${prefix}whitelist remove <#channel | @role | @user>\``),
                            ],
                        });
                    }

                    const channel = await resolveChannel(args[1]);
                    if (channel) {
                        const removed = await client.database.removeWhitelistChannel(guildId, channel.id);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(removed
                                        ? `${client.emojiList.tick} | Successfully removed ${channel} from allowed command channels.`
                                        : `${client.emojiList.cross} | Channel ${channel} is not in the allowed channels list.`
                                    ),
                            ],
                        });
                    }

                    const role = await resolveRole(query);
                    if (role) {
                        const removed = await client.database.removeWhitelistRole(guildId, role.id);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(removed
                                        ? `${client.emojiList.tick} | Successfully removed ${role} from bypass roles.`
                                        : `${client.emojiList.cross} | Role ${role} is not in the bypass roles list.`
                                    ),
                            ],
                        });
                    }

                    const user = await resolveUser(args[1]);
                    if (user) {
                        const removed = await client.database.removeWhitelistUser(guildId, user.id);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(removed
                                        ? `${client.emojiList.tick} | Successfully removed ${user} from bypass users.`
                                        : `${client.emojiList.cross} | User ${user} is not in the bypass users list.`
                                    ),
                            ],
                        });
                    }

                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | Could not resolve \`${query}\` to a valid channel, role, or user.`),
                        ],
                    });
                }

                case "clear": {
                    const targetType = args[1]?.toLowerCase();
                    if (targetType === "channels" || targetType === "channel") {
                        await client.database.clearWhitelistChannels(guildId);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully cleared all allowed command channels.`),
                            ],
                        });
                    }
                    if (targetType === "roles" || targetType === "role") {
                        await client.database.clearWhitelistRoles(guildId);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully cleared all bypass roles.`),
                            ],
                        });
                    }
                    if (targetType === "users" || targetType === "user") {
                        await client.database.clearWhitelistUsers(guildId);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully cleared all bypass users.`),
                            ],
                        });
                    }

                    await client.database.clearWhitelist(guildId, "all");
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(client?.color?.hex ?? "#FF66C4")
                                .setDescription(`${client.emojiList.tick} | Successfully cleared all whitelist settings and disabled command restrictions.`),
                        ],
                    });
                }

                case "list":
                case "status":
                case "show":
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
                                ? `${client.emojiList.warning} **Warning:** System is enabled but no channels are whitelisted yet! Use \`${prefix}whitelist add <#channel>\` to allow a channel.\n\n`
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
                            },
                            {
                                name: "Available Subcommands",
                                value: [
                                    `• \`${prefix}whitelist toggle\` - Toggle command restrictions on/off.`,
                                    `• \`${prefix}whitelist add <#channel | @role | @user>\` - Add an allowed channel, bypass role, or bypass user.`,
                                    `• \`${prefix}whitelist remove <#channel | @role | @user>\` - Remove from whitelist.`,
                                    `• \`${prefix}whitelist clear [channels | roles | users | all]\` - Clear configured entries.`,
                                    `• \`${prefix}whitelist list\` - Show this configuration panel.`,
                                ].join("\n"),
                                inline: false,
                            }
                        )
                        .setFooter({
                            text: "Members with Manage Server permission can always run commands in any channel.",
                        })
                        .setTimestamp();

                    return message.reply({ embeds: [emb] });
                }
            }
        } catch (err) {
            console.error("Error in whitelist command:", err);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(`${client.emojiList.cross} | An error occurred while executing the \`whitelist\` command.`),
                ],
            });
        }
    },
};
