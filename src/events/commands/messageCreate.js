const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");

const REQUIRED_PERMISSIONS = [
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.EmbedLinks,
];

const FRIENDLY_PERMISSION_NAMES = {
    ManageGuild: "Manage Server",
    ViewGuildInsights: "View Server Insights",
    UseVAD: "Use Voice Activity",
    Stream: "Video / Stream",
    SendTTSMessages: "Send Text-to-Speech Messages",
    ModerateMembers: "Timeout / Moderate Members",
    SendPolls: "Create Polls",
    UseApplicationCommands: "Use Application Commands",
    CreateInstantInvite: "Create Instant Invite",
    ReadMessageHistory: "Read Message History",
    ManageEmojisAndStickers: "Manage Emojis and Stickers",
    ManageGuildExpressions: "Manage Expressions",
    CreateGuildExpressions: "Create Expressions",
    UseExternalEmojis: "Use External Emojis",
    UseExternalStickers: "Use External Stickers",
    UseExternalSounds: "Use External Sounds",
    UseExternalApps: "Use External Apps",
    SetVoiceChannelStatus: "Set Voice Channel Status",
    SendVoiceMessages: "Send Voice Messages",
    SendMessagesInThreads: "Send Messages in Threads",
    CreatePublicThreads: "Create Public Threads",
    CreatePrivateThreads: "Create Private Threads",
    ViewCreatorMonetizationAnalytics: "View Creator Monetization Analytics",
    UseEmbeddedActivities: "Use Embedded Activities",
    BypassSlowmode: "Bypass Slowmode",
};

const FRIENDLY_TO_KEY = {
    manageserver: "ManageGuild",
    "manage server": "ManageGuild",
    viewserverinsights: "ViewGuildInsights",
    "view server insights": "ViewGuildInsights",
    timeout: "ModerateMembers",
    moderatemembers: "ModerateMembers",
    "moderate members": "ModerateMembers",
};

const PERMISSION_NAMES = new Map();
for (const [key, bit] of Object.entries(PermissionFlagsBits)) {
    const formatted = FRIENDLY_PERMISSION_NAMES[key] || key.replace(/([A-Z])/g, " $1").trim();
    const display = `\`${formatted}\``;
    PERMISSION_NAMES.set(bit, display);
    PERMISSION_NAMES.set(key, display);
    PERMISSION_NAMES.set(key.toLowerCase(), display);
}

function resolvePermission(perm) {
    if (typeof perm === "bigint") return perm;
    if (typeof perm === "string") {
        if (PermissionFlagsBits[perm] !== undefined) {
            return PermissionFlagsBits[perm];
        }
        const lower = perm.toLowerCase().replace(/[\s_]+/g, "");
        if (FRIENDLY_TO_KEY[lower] && PermissionFlagsBits[FRIENDLY_TO_KEY[lower]] !== undefined) {
            return PermissionFlagsBits[FRIENDLY_TO_KEY[lower]];
        }
        for (const key of Object.keys(PermissionFlagsBits)) {
            if (key.toLowerCase() === lower) {
                return PermissionFlagsBits[key];
            }
        }
    }
    return perm;
}

function getPermissionName(permission) {
    if (PERMISSION_NAMES.has(permission)) {
        return PERMISSION_NAMES.get(permission);
    }
    if (typeof permission === "string") {
        const lower = permission.toLowerCase().replace(/[\s_]+/g, "");
        if (PERMISSION_NAMES.has(lower)) {
            return PERMISSION_NAMES.get(lower);
        }
        return `\`${permission.replace(/([A-Z])/g, " $1").trim()}\``;
    }
    return `\`${permission}\``;
}

const VOICE_PERMISSIONS = [
    PermissionFlagsBits.Connect,
    PermissionFlagsBits.Speak,
    PermissionFlagsBits.MuteMembers,
    PermissionFlagsBits.DeafenMembers,
    PermissionFlagsBits.MoveMembers,
    PermissionFlagsBits.PrioritySpeaker,
    PermissionFlagsBits.Stream,
    PermissionFlagsBits.UseVAD,
    PermissionFlagsBits.UseSoundboard,
    PermissionFlagsBits.UseExternalSounds,
    PermissionFlagsBits.SetVoiceChannelStatus,
    PermissionFlagsBits.SendVoiceMessages,
    PermissionFlagsBits.RequestToSpeak,
];

module.exports = {
    name: "messageCreate",
    run: async (client, message) => {
        if (!message.guild || !message.channel || !message.id || message.author.bot) return;

        let prefix = client.config?.bot?.prefix || client.prefix || "r!";
        if (client.database) {
            try {
                prefix = await client.database.getPrefix(message.guildId);
            } catch {
                prefix = client.config?.bot?.prefix || client.prefix || "r!";
            }
        }

        const clientMention = new RegExp(`^<@!?${client.user.id}>( |)$`);
        const isMention = message.content.match(clientMention);

        const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`);
        const isPrefixMatch = prefixRegex.test(message.content);

        // If not a mention and not a prefix command, ignore immediately
        if (!isMention && !isPrefixMatch) return;

        // Check required client channel permissions
        const me = message.guild.members.me || (await message.guild.members.fetchMe().catch(() => null));
        if (!me) return;

        const channelPerms = message.channel.permissionsFor(me);
        if (!channelPerms) return;

        // Silently exit if bot cannot view channel
        if (!channelPerms.has(PermissionFlagsBits.ViewChannel)) return;

        // Validate SendMessages, ReadMessageHistory, ViewChannel, EmbedLinks
        const missingRequired = REQUIRED_PERMISSIONS.filter((perm) => !channelPerms.has(perm));
        if (missingRequired.length > 0) {
            const missingNames = missingRequired.map(getPermissionName).join(", ");
            if (channelPerms.has(PermissionFlagsBits.SendMessages)) {
                return message.reply({
                    content: `${client.emojiList.cross} | I need the following permissions in this channel to function properly: ${missingNames}.`,
                }).catch(() => null);
            } else {
                return message.author.send({
                    content: `${client.emojiList.cross} | I am missing required permissions in <#${message.channel.id}> (**${message.guild.name}**): ${missingNames}.`,
                }).catch(() => null);
            }
        }

        if (isMention) {
            const botName = client?.config?.bot?.name || client?.user?.username || "Reverb";
            const defaultPrefix = client?.config?.bot?.prefix || client.prefix || "r!";
            let msg = prefix === defaultPrefix
                ? `I am **${botName}**, a music bot for Discord. My default prefix is \`${prefix}\`. You can change my prefix using the \`${prefix}setprefix\` command.\n\n> To view my commands, use \`${prefix}help\`.`
                : `I am **${botName}**, a music bot for Discord. My current prefix is \`${prefix}\`. You can change my prefix using the \`${prefix}setprefix\` command.\n\n> To view my commands, use \`${prefix}help\`.`;

            let embed = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(`${msg}`);

            return message.reply({ embeds: [embed] });
        }

        const [matchedPrefix] = message.content.match(prefixRegex);
        const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
        const cmd = args.shift()?.toLowerCase();
        if (!cmd) return;

        let command = client.commands.get(cmd);
        if (!command) command = client.commands.get(client.aliases.get(cmd));

        if (command) {
            try {
                if (command.developerOnly && !client.developerIds.includes(message.author.id)) {
                    return message.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setColor("Red")
                                .setDescription(
                                    `${client.emojiList.cross} | This command is restricted to bot developers only.`,
                                ),
                        ],
                    });
                }

                // Whitelist / Command Channel Restriction Check
                const whitelist = await client.database.getWhitelist(message.guildId);
                if (whitelist && whitelist.mode) {
                    const isDev = client.developerIds?.includes(message.author.id);
                    const hasManageGuild = message.member?.permissions?.has(PermissionFlagsBits.ManageGuild);
                    const isBypassUser = whitelist.users && whitelist.users.includes(message.author.id);
                    const isBypassRole = whitelist.roles && whitelist.roles.some((roleId) => message.member?.roles?.cache?.has(roleId));

                    const canBypass = isDev || hasManageGuild || isBypassUser || isBypassRole;

                    if (!canBypass) {
                        const isAllowedChannel = whitelist.channels && whitelist.channels.includes(message.channel.id);
                        if (!isAllowedChannel) {
                            const allowedChannelsText = whitelist.channels && whitelist.channels.length > 0
                                ? whitelist.channels.map((id) => `<#${id}>`).join(", ")
                                : "*None configured*";

                            const bypassRolesText = whitelist.roles && whitelist.roles.length > 0
                                ? whitelist.roles.map((id) => `<@&${id}>`).join(", ")
                                : "*None*";

                            const bypassUsersText = whitelist.users && whitelist.users.length > 0
                                ? whitelist.users.map((id) => `<@${id}>`).join(", ")
                                : "*None*";

                            const emb = new EmbedBuilder()
                                .setColor("Red")
                                .setTitle(`${client.emojiList.cross} Command Not Allowed Here`)
                                .setDescription(
                                    `You cannot run bot commands in this channel (<#${message.channel.id}>). Please use one of the authorized command channels below.`
                                )
                                .addFields(
                                    {
                                        name: `${client.emojiList.pin} Allowed Channels`,
                                        value: allowedChannelsText,
                                        inline: false,
                                    },
                                    {
                                        name: `${client.emojiList.shield} Roles Allowed Anywhere`,
                                        value: bypassRolesText,
                                        inline: true,
                                    },
                                    {
                                        name: `${client.emojiList.user} Users Allowed Anywhere`,
                                        value: bypassUsersText,
                                        inline: true,
                                    }
                                )
                                .setFooter({
                                    text: "Tip: Server administrators with Manage Server can execute commands in any channel.",
                                })
                                .setTimestamp();

                            const replyMsg = await message.reply({ embeds: [emb] }).catch(() => null);
                            if (replyMsg) {
                                setTimeout(() => replyMsg.delete().catch(() => null), 8000);
                            }
                            return;
                        }
                    }
                }

                // Check command-specific client permissions (supports every permission in PermissionFlagsBits)
                const clientPermissions =
                    command.permissions?.client ||
                    command.permissions?.bot ||
                    command.clientPermissions ||
                    command.botPermissions;

                if (clientPermissions) {
                    const clientReq = Array.isArray(clientPermissions)
                        ? clientPermissions
                        : [clientPermissions];

                    const voiceChannel = message.member?.voice?.channel;
                    const missingClient = clientReq.filter((rawPerm) => {
                        const perm = resolvePermission(rawPerm);
                        const isVoice = VOICE_PERMISSIONS.includes(perm);
                        const targetPerms = (isVoice && voiceChannel)
                            ? voiceChannel.permissionsFor(me)
                            : channelPerms;

                        return !targetPerms?.has(perm) && !me.permissions.has(perm);
                    });

                    if (missingClient.length > 0) {
                        const names = missingClient.map(getPermissionName).join(", ");
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("Red")
                                    .setDescription(
                                        `${client.emojiList.cross} | I need the following permission(s) to execute this command: ${names}.`,
                                    ),
                            ],
                        });
                    }
                }

                // Check command-specific user permissions (supports every permission in PermissionFlagsBits)
                const userPermissions =
                    command.permissions?.user ||
                    command.userPermissions;

                if (userPermissions) {
                    const userReq = Array.isArray(userPermissions)
                        ? userPermissions
                        : [userPermissions];

                    const missingUser = userReq.filter((rawPerm) => {
                        const perm = resolvePermission(rawPerm);
                        return !message.member.permissions.has(perm);
                    });

                    if (missingUser.length > 0) {
                        const names = missingUser.map(getPermissionName).join(", ");
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("Red")
                                    .setDescription(
                                        `${client.emojiList.cross} | You need the following permission(s) to use this command: ${names}.`,
                                    ),
                            ],
                        });
                    }
                }

                // Check command player prerequisites (voice, active player, same voice, playing, dj)
                const playerConfig = typeof command.player === "function"
                    ? command.player(message, args)
                    : command.player;

                if (playerConfig) {
                    if (playerConfig.voice && !message.member?.voice?.channelId) {
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("Red")
                                    .setDescription(
                                        `${client.emojiList.cross} | **You need to be in a voice channel to use this command.**`,
                                    ),
                            ],
                        });
                    }

                    const guildPlayer = await client.musicManager.players.get(message.guildId);

                    if (playerConfig.active && (!guildPlayer || !guildPlayer.connected)) {
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("Red")
                                    .setDescription(
                                        `${client.emojiList.cross} | **There is no active music player in this server.**`,
                                    ),
                            ],
                        });
                    }

                    if (
                        playerConfig.sameVoice &&
                        guildPlayer &&
                        guildPlayer.connected &&
                        guildPlayer.voiceChannelId !== message.member?.voice?.channelId
                    ) {
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("Red")
                                    .setDescription(
                                        `${client.emojiList.cross} | **You need to be in the same voice channel (<#${guildPlayer.voiceChannelId}>) as me to use this command.**`,
                                    ),
                            ],
                        });
                    }

                    if (playerConfig.playing && (!guildPlayer || !guildPlayer.current)) {
                        return message.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor("Red")
                                    .setDescription(
                                        `${client.emojiList.cross} | **There is no music currently playing in this server.**`,
                                    ),
                            ],
                        });
                    }

                    if (playerConfig.dj) {
                        const isBotDev = client.developerIds?.includes(message.author.id);
                        if (!isBotDev) {
                            const dj = await client.database.getDJ(message.guildId);

                            if (dj && dj.mode) {
                                const hasRoles = Array.isArray(dj.roles) && dj.roles.length > 0;
                                const hasUsers = Array.isArray(dj.users) && dj.users.length > 0;

                                if (!hasRoles && !hasUsers) {
                                    return message.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor("Red")
                                                .setDescription(
                                                    `${client.emojiList.cross} | DJ mode is enabled, but no DJ role or user is set. Please configure a DJ role or user using the \`${prefix}dj add <@role | @user>\` command.`,
                                                ),
                                        ],
                                    });
                                }

                                const isDJ =
                                    (hasRoles && dj.roles.some((roleId) => message.member?.roles?.cache?.has(roleId))) ||
                                    (hasUsers && dj.users.includes(message.author.id)) ||
                                    message.member?.permissions?.has(PermissionFlagsBits.ManageGuild);

                                if (!isDJ) {
                                    return message.reply({
                                        embeds: [
                                            new EmbedBuilder()
                                                .setColor("Red")
                                                .setDescription(
                                                    `${client.emojiList.cross} | **You need a configured DJ role, DJ user permission, or \`Manage Server\` permission to use this command.**`,
                                                ),
                                        ],
                                    });
                                }
                            }
                        }
                    }
                }

                await command.run(message, args, client, prefix);
            } catch (err) {
                (client.logger || require("../../utils/logger")).error(`Error executing command ${command.name}:`, err);
            }
        }
    }
};
