const {
    EmbedBuilder, PermissionFlagsBits
} = require("discord.js");

module.exports = {
    name: "whitelist",
    description: "Manage allowed command channels and bypass roles/users.",
    usage: "<add | remove | channel | role | user | clear | toggle | list> [#channel | @role | @user]",
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
                (m) =>
                    m.user.username?.toLowerCase() === lowerQuery ||
                    m.user.tag?.toLowerCase() === lowerQuery ||
                    (m.nickname && m.nickname.toLowerCase() === lowerQuery) ||
                    m.displayName?.toLowerCase() === lowerQuery
            );
            if (member) return member.user;

            return null;
        };

        try {
            switch (subCommand) {
                case "toggle": {
                    const whitelist = await client.database.getWhitelist(guildId);
                    const hasChannels = whitelist && whitelist.channels && whitelist.channels.length > 0;

                    if (!hasChannels && !whitelist?.mode) {
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("Red")
                                    .setDescription(
                                        `${client.emojiList.cross} | No allowed command channels are configured yet. Please add a channel first using \`${prefix}whitelist add <#channel>\`.`
                                    ),
                            ],
                        });
                    }

                    const currentMode = whitelist ? Boolean(whitelist.mode) : false;
                    const newMode = !currentMode;
                    await client.database.setWhitelistMode(guildId, newMode);

                    const emb = new EmbedBuilder()
                        .setColor(newMode ? (client?.color?.hex ?? "#FF66C4") : "Red")
                        .setDescription(
                            `**${newMode ? client.emojiList.tick : client.emojiList.cross} | Command restriction system has been \`${newMode ? "enabled" : "disabled"}\` for this server.**` +
                            (newMode && !hasChannels
                                ? `\n\n${client.emojiList.warning} **Notice:** No allowed channels are configured yet! Use \`${prefix}whitelist add <#channel>\` so members can run commands.`
                                : "")
                        )
                        .setTimestamp();

                    return message.reply({ embeds: [emb] });
                }

                case "channel": {
                    const action = args[1]?.toLowerCase();
                    const query = args.slice(2).join(" ");
                    const channel = await resolveChannel(query || args[2]);

                    if (action === "add") {
                        if (!channel) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(
                                            `${client.emojiList.cross} | **Please provide a valid text channel to add.**\nUsage: \`${prefix}whitelist channel add <#channel | channelId | channelName>\``
                                        ),
                                ],
                            });
                        }

                        const whitelist = await client.database.getWhitelist(guildId);
                        if (whitelist && whitelist.channels && whitelist.channels.includes(channel.id)) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | The channel ${channel} is already configured as an allowed command channel.`),
                                ],
                            });
                        }

                        await client.database.addWhitelistChannel(guildId, channel.id);
                        await client.database.setWhitelistMode(guildId, true);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully added ${channel} as an allowed command channel and **enabled** command restrictions.`),
                            ],
                        });
                    }

                    if (action === "remove") {
                        if (!channel) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(
                                            `${client.emojiList.cross} | **Please provide a valid channel to remove.**\nUsage: \`${prefix}whitelist channel remove <#channel | channelId | channelName>\``
                                        ),
                                ],
                            });
                        }

                        const whitelist = await client.database.getWhitelist(guildId);
                        if (!whitelist || !whitelist.channels || !whitelist.channels.includes(channel.id)) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | The channel ${channel} is not configured as an allowed command channel.`),
                                ],
                            });
                        }

                        await client.database.removeWhitelistChannel(guildId, channel.id);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully removed ${channel} from allowed command channels.`),
                            ],
                        });
                    }

                    if (action === "clear") {
                        const whitelist = await client.database.getWhitelist(guildId);
                        if (!whitelist || !whitelist.channels || whitelist.channels.length === 0) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | There are no allowed command channels configured for this server.`),
                                ],
                            });
                        }

                        await client.database.clearWhitelistChannels(guildId);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully cleared all allowed command channels for this server.`),
                            ],
                        });
                    }

                    // Direct channel fallback (e.g. r!whitelist channel #music)
                    const directChannel = await resolveChannel(args.slice(1).join(" ") || args[1]);
                    if (directChannel) {
                        const whitelist = await client.database.getWhitelist(guildId);
                        if (whitelist && whitelist.channels && whitelist.channels.includes(directChannel.id)) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | The channel ${directChannel} is already configured as an allowed command channel.`),
                                ],
                            });
                        }

                        await client.database.addWhitelistChannel(guildId, directChannel.id);
                        await client.database.setWhitelistMode(guildId, true);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully added ${directChannel} as an allowed command channel and **enabled** command restrictions.`),
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
                    const query = args.slice(2).join(" ");
                    const role = await resolveRole(query || args[2]);

                    if (action === "add") {
                        if (!role) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(
                                            `${client.emojiList.cross} | **Please provide a valid role to add.**\nUsage: \`${prefix}whitelist role add <@role | roleId | roleName>\``
                                        ),
                                ],
                            });
                        }

                        const whitelist = await client.database.getWhitelist(guildId);
                        if (whitelist && whitelist.roles && whitelist.roles.includes(role.id)) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | The role ${role} is already configured as a bypass role.`),
                                ],
                            });
                        }

                        await client.database.addWhitelistRole(guildId, role.id);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully added ${role} as a bypass role. Members with this role can run commands anywhere.`),
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
                                            `${client.emojiList.cross} | **Please provide a valid role to remove.**\nUsage: \`${prefix}whitelist role remove <@role | roleId | roleName>\``
                                        ),
                                ],
                            });
                        }

                        const whitelist = await client.database.getWhitelist(guildId);
                        if (!whitelist || !whitelist.roles || !whitelist.roles.includes(role.id)) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | The role ${role} is not configured as a bypass role.`),
                                ],
                            });
                        }

                        await client.database.removeWhitelistRole(guildId, role.id);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully removed ${role} from bypass roles.`),
                            ],
                        });
                    }

                    if (action === "clear") {
                        const whitelist = await client.database.getWhitelist(guildId);
                        if (!whitelist || !whitelist.roles || whitelist.roles.length === 0) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | There are no bypass roles configured for this server.`),
                                ],
                            });
                        }

                        await client.database.clearWhitelistRoles(guildId);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully cleared all bypass roles for this server.`),
                            ],
                        });
                    }

                    // Direct role fallback (e.g. r!whitelist role @Admin)
                    const directRole = await resolveRole(args.slice(1).join(" ") || args[1]);
                    if (directRole) {
                        const whitelist = await client.database.getWhitelist(guildId);
                        if (whitelist && whitelist.roles && whitelist.roles.includes(directRole.id)) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | The role ${directRole} is already configured as a bypass role.`),
                                ],
                            });
                        }

                        await client.database.addWhitelistRole(guildId, directRole.id);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully added ${directRole} as a bypass role. Members with this role can run commands anywhere.`),
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
                    const query = args.slice(2).join(" ");
                    const user = await resolveUser(query || args[2]);

                    if (action === "add") {
                        if (!user) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(
                                            `${client.emojiList.cross} | **Please provide a valid user to add.**\nUsage: \`${prefix}whitelist user add <@user | userId | username>\``
                                        ),
                                ],
                            });
                        }

                        const whitelist = await client.database.getWhitelist(guildId);
                        if (whitelist && whitelist.users && whitelist.users.includes(user.id)) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | The user ${user} is already configured as a bypass user.`),
                                ],
                            });
                        }

                        await client.database.addWhitelistUser(guildId, user.id);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully added ${user} as a bypass user. This user can run commands in any channel.`),
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
                                            `${client.emojiList.cross} | **Please provide a valid user to remove.**\nUsage: \`${prefix}whitelist user remove <@user | userId | username>\``
                                        ),
                                ],
                            });
                        }

                        const whitelist = await client.database.getWhitelist(guildId);
                        if (!whitelist || !whitelist.users || !whitelist.users.includes(user.id)) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | The user ${user} is not configured as a bypass user.`),
                                ],
                            });
                        }

                        await client.database.removeWhitelistUser(guildId, user.id);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully removed ${user} from bypass users.`),
                            ],
                        });
                    }

                    if (action === "clear") {
                        const whitelist = await client.database.getWhitelist(guildId);
                        if (!whitelist || !whitelist.users || whitelist.users.length === 0) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | There are no bypass users configured for this server.`),
                                ],
                            });
                        }

                        await client.database.clearWhitelistUsers(guildId);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully cleared all bypass users for this server.`),
                            ],
                        });
                    }

                    // Direct user fallback (e.g. r!whitelist user @John)
                    const directUser = await resolveUser(args.slice(1).join(" ") || args[1]);
                    if (directUser) {
                        const whitelist = await client.database.getWhitelist(guildId);
                        if (whitelist && whitelist.users && whitelist.users.includes(directUser.id)) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | The user ${directUser} is already configured as a bypass user.`),
                                ],
                            });
                        }

                        await client.database.addWhitelistUser(guildId, directUser.id);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully added ${directUser} as a bypass user. This user can run commands in any channel.`),
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
                                    .setDescription(
                                        `${client.emojiList.cross} | **Please provide a channel, role, or user to add.**\nUsage: \`${prefix}whitelist add <#channel | @role | @user>\``
                                    ),
                            ],
                        });
                    }

                    const whitelist = await client.database.getWhitelist(guildId);

                    // 1. Try resolving channel first
                    const channel = await resolveChannel(args[1] || query);
                    if (channel) {
                        if (whitelist && whitelist.channels && whitelist.channels.includes(channel.id)) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | Channel ${channel} is already in the allowed command channels list.`),
                                ],
                            });
                        }

                        await client.database.addWhitelistChannel(guildId, channel.id);
                        await client.database.setWhitelistMode(guildId, true);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully added ${channel} as an allowed command channel and **enabled** command restrictions.`),
                            ],
                        });
                    }

                    // 2. Try resolving role
                    const role = await resolveRole(query || args[1]);
                    if (role) {
                        if (whitelist && whitelist.roles && whitelist.roles.includes(role.id)) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | Role ${role} is already in the bypass roles list.`),
                                ],
                            });
                        }

                        await client.database.addWhitelistRole(guildId, role.id);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully added ${role} as a bypass role. Members with this role can run commands anywhere.`),
                            ],
                        });
                    }

                    // 3. Try resolving user
                    const user = await resolveUser(args[1] || query);
                    if (user) {
                        if (whitelist && whitelist.users && whitelist.users.includes(user.id)) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | User ${user} is already in the bypass users list.`),
                                ],
                            });
                        }

                        await client.database.addWhitelistUser(guildId, user.id);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully added ${user} as a bypass user. This user can run commands anywhere.`),
                            ],
                        });
                    }

                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | Could not resolve \`${query}\` to a valid channel, role, or user on this server.`),
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
                                        `${client.emojiList.cross} | **Please provide a channel, role, or user to remove.**\nUsage: \`${prefix}whitelist remove <#channel | @role | @user>\``
                                    ),
                            ],
                        });
                    }

                    const whitelist = await client.database.getWhitelist(guildId);

                    // 1. Try resolving channel
                    const channel = await resolveChannel(args[1] || query);
                    if (channel && whitelist && whitelist.channels && whitelist.channels.includes(channel.id)) {
                        await client.database.removeWhitelistChannel(guildId, channel.id);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully removed ${channel} from allowed command channels.`),
                            ],
                        });
                    }

                    // 2. Try resolving role
                    const role = await resolveRole(query || args[1]);
                    if (role && whitelist && whitelist.roles && whitelist.roles.includes(role.id)) {
                        await client.database.removeWhitelistRole(guildId, role.id);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully removed ${role} from bypass roles.`),
                            ],
                        });
                    }

                    // 3. Try resolving user
                    const user = await resolveUser(args[1] || query);
                    if (user && whitelist && whitelist.users && whitelist.users.includes(user.id)) {
                        await client.database.removeWhitelistUser(guildId, user.id);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully removed ${user} from bypass users.`),
                            ],
                        });
                    }

                    if (channel && (!whitelist || !whitelist.channels || !whitelist.channels.includes(channel.id))) {
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("Red")
                                    .setDescription(`${client.emojiList.cross} | Channel ${channel} is not in the allowed command channels list.`),
                            ],
                        });
                    }

                    if (role && (!whitelist || !whitelist.roles || !whitelist.roles.includes(role.id))) {
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("Red")
                                    .setDescription(`${client.emojiList.cross} | Role ${role} is not in the bypass roles list.`),
                            ],
                        });
                    }

                    if (user && (!whitelist || !whitelist.users || !whitelist.users.includes(user.id))) {
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("Red")
                                    .setDescription(`${client.emojiList.cross} | User ${user} is not in the bypass users list.`),
                            ],
                        });
                    }

                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(`${client.emojiList.cross} | Could not resolve \`${query}\` to a configured channel, role, or user.`),
                        ],
                    });
                }

                case "clear": {
                    const targetType = args[1]?.toLowerCase();
                    const whitelist = await client.database.getWhitelist(guildId);

                    if (targetType === "channels" || targetType === "channel") {
                        if (!whitelist || !whitelist.channels || whitelist.channels.length === 0) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | There are no allowed command channels configured for this server.`),
                                ],
                            });
                        }

                        await client.database.clearWhitelistChannels(guildId);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully cleared all allowed command channels for this server.`),
                            ],
                        });
                    }

                    if (targetType === "roles" || targetType === "role") {
                        if (!whitelist || !whitelist.roles || whitelist.roles.length === 0) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | There are no bypass roles configured for this server.`),
                                ],
                            });
                        }

                        await client.database.clearWhitelistRoles(guildId);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully cleared all bypass roles for this server.`),
                            ],
                        });
                    }

                    if (targetType === "users" || targetType === "user") {
                        if (!whitelist || !whitelist.users || whitelist.users.length === 0) {
                            return message.reply({
                                embeds: [
                                    new EmbedBuilder()
                                        .setColor("Red")
                                        .setDescription(`${client.emojiList.cross} | There are no bypass users configured for this server.`),
                                ],
                            });
                        }

                        await client.database.clearWhitelistUsers(guildId);
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor(client?.color?.hex ?? "#FF66C4")
                                    .setDescription(`${client.emojiList.tick} | Successfully cleared all bypass users for this server.`),
                            ],
                        });
                    }

                    // Clear all
                    const hasChannels = whitelist && whitelist.channels && whitelist.channels.length > 0;
                    const hasRoles = whitelist && whitelist.roles && whitelist.roles.length > 0;
                    const hasUsers = whitelist && whitelist.users && whitelist.users.length > 0;

                    if (!hasChannels && !hasRoles && !hasUsers && !whitelist?.mode) {
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("Red")
                                    .setDescription(`${client.emojiList.cross} | There are no whitelist settings configured for this server.`),
                            ],
                        });
                    }

                    await client.database.clearWhitelist(guildId, "all");
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor(client?.color?.hex ?? "#FF66C4")
                                .setDescription(`${client.emojiList.tick} | Successfully cleared all whitelist settings and **disabled** command restrictions.`),
                        ],
                    });
                }

                case "list":
                case "status":
                case "show":
                case "info":
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
                            (subCommand && !["list", "status", "info", "show", "help"].includes(subCommand)
                                ? `${client.emojiList.cross} | Invalid subcommand \`${subCommand}\`.\n\n`
                                : "") +
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
                                    `• \`${prefix}whitelist add <#channel | @role | @user>\` - Add an allowed channel, bypass role, or bypass user.`,
                                    `• \`${prefix}whitelist remove <#channel | @role | @user>\` - Remove an allowed channel, bypass role, or bypass user.`,
                                    `• \`${prefix}whitelist channel <add | remove | clear> <#channel>\` - Manage allowed command channels.`,
                                    `• \`${prefix}whitelist role <add | remove | clear> <@role>\` - Manage bypass roles.`,
                                    `• \`${prefix}whitelist user <add | remove | clear> <@user>\` - Manage bypass users.`,
                                    `• \`${prefix}whitelist clear [channels | roles | users | all]\` - Clear configured entries.`,
                                    `• \`${prefix}whitelist toggle\` - Toggle command restrictions on/off.`,
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
