const {
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SectionBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
} = require("discord.js");

const accentColor = 0xFF66C4;

// Ordered category sequence for navigation buttons
const CATEGORY_ORDER = [
    "home",
    "music",
    "filter",
    "playlist",
    "configuration",
    "info",
    "developer",
];

// Rich Subcommand Definitions for commands that act as command groups
const SUBCOMMANDS_DATA = {
    playlist: [
        {
            name: "playlist create",
            syntax: "playlist create <name> [public | private]",
            slash: "/playlist create name:<name> [privacy:<public|private>]",
            desc: "Create a new empty custom playlist in your library with optional privacy.",
            example: "playlist create workout_hits private",
        },
        {
            name: "playlist privacy",
            syntax: "playlist privacy <name> [public | private]",
            slash: "/playlist privacy name:<name> setting:<public|private>",
            desc: "Toggle or set a playlist's privacy. Private playlists are hidden from others and unclonable.",
            example: "playlist privacy chill_beats private",
        },
        {
            name: "playlist delete",
            syntax: "playlist delete <name>",
            slash: "/playlist delete name:<name>",
            desc: "Permanently delete one of your saved custom playlists.",
            example: "playlist delete old_songs",
        },
        {
            name: "playlist add",
            syntax: "playlist add <name> [song | url]",
            slash: "/playlist add name:<name> [song:<song>]",
            desc: "Add a track or URL to your playlist (adds current track if omitted).",
            example: "playlist add party_vibes Bohemian Rhapsody",
        },
        {
            name: "playlist remove",
            syntax: "playlist remove <name> <position>",
            slash: "/playlist remove name:<name> song:<position>",
            desc: "Remove a specific track from your playlist by position number.",
            example: "playlist remove party_vibes 3",
        },
        {
            name: "playlist list",
            syntax: "playlist list [@user | playlist_name]",
            slash: "/playlist list [user:<@user>] [page:<page>]",
            desc: "View playlists (public in reply, private in DMs) or view another user's public playlists.",
            example: "playlist list @User",
        },
        {
            name: "playlist load",
            syntax: "playlist load <name>",
            slash: "/playlist load name:<name>",
            desc: "Load and play an entire saved custom playlist in your voice channel.",
            example: "playlist load chill_evening",
        },
        {
            name: "playlist clone",
            syntax: "playlist clone <name> <@user>",
            slash: "/playlist steal user:<@user> name:<name>",
            desc: "Clone another user's public custom playlist into your personal library (private playlists cannot be cloned).",
            example: "playlist clone rap_legends @User",
        },
    ],
    setup: [
        {
            name: "setup create",
            syntax: "setup create",
            slash: "/setup create",
            desc: "Create and initialize the dedicated song-requests channel with interactive controls.",
            example: "setup create",
        },
        {
            name: "setup delete",
            syntax: "setup delete",
            slash: "/setup delete",
            desc: "Delete the existing song-requests channel and disable the setup system.",
            example: "setup delete",
        },
        {
            name: "setup info",
            syntax: "setup info",
            slash: "/setup info",
            desc: "Display status and information regarding the active song-requests channel.",
            example: "setup info",
        },
    ],
    dj: [
        {
            name: "dj add",
            syntax: "dj add <@role | @user>",
            slash: "/dj add target:<@role | @user>",
            desc: "Add an authorized DJ role or user to the DJ list and enable DJ mode.",
            example: "dj add @DJ",
        },
        {
            name: "dj remove",
            syntax: "dj remove <@role | @user>",
            slash: "/dj remove target:<@role | @user>",
            desc: "Remove a role or user from the authorized DJ list.",
            example: "dj remove @DJ",
        },
        {
            name: "dj role",
            syntax: "dj role <add | remove | clear> <@role>",
            slash: "/dj role action:<add|remove> target:<@role>",
            desc: "Manage server roles permitted to control music in DJ mode.",
            example: "dj role add @DJ",
        },
        {
            name: "dj user",
            syntax: "dj user <add | remove | clear> <@user>",
            slash: "/dj user action:<add|remove> target:<@user>",
            desc: "Manage individual users permitted to control music in DJ mode.",
            example: "dj user add @User",
        },
        {
            name: "dj clear",
            syntax: "dj clear [roles | users | all]",
            slash: "/dj clear type:<roles | users | all>",
            desc: "Clear configured DJ roles, DJ users, or reset everything.",
            example: "dj clear all",
        },
        {
            name: "dj toggle",
            syntax: "dj toggle",
            slash: "/dj toggle",
            desc: "Toggle DJ mode requirement on or off for player controls.",
            example: "dj toggle",
        },
        {
            name: "dj list",
            syntax: "dj list",
            slash: "/dj list",
            desc: "View current DJ mode status, configured roles, and configured users.",
            example: "dj list",
        },
    ],
    whitelist: [
        {
            name: "whitelist toggle",
            syntax: "whitelist toggle",
            slash: "/whitelist toggle",
            desc: "Toggle command channel restriction mode on or off.",
            example: "whitelist toggle",
        },
        {
            name: "whitelist add",
            syntax: "whitelist add <#channel | @role | @user>",
            slash: "/whitelist channel action:add target:<channel>",
            desc: "Add an allowed command channel, bypass role, or bypass user.",
            example: "whitelist add #bot-commands",
        },
        {
            name: "whitelist remove",
            syntax: "whitelist remove <#channel | @role | @user>",
            slash: "/whitelist channel action:remove target:<channel>",
            desc: "Remove an allowed channel, bypass role, or bypass user.",
            example: "whitelist remove #general",
        },
        {
            name: "whitelist clear",
            syntax: "whitelist clear [channels | roles | users | all]",
            slash: "/whitelist clear type:<type>",
            desc: "Clear whitelist channels, roles, users, or reset everything.",
            example: "whitelist clear all",
        },
        {
            name: "whitelist list",
            syntax: "whitelist list",
            slash: "/whitelist list",
            desc: "View current whitelist status, allowed channels, and bypass roles/users.",
            example: "whitelist list",
        },
    ],
};

/**
 * Returns Category configuration details
 */
function getCategoryMeta(client, category) {
    const categories = client.emojiList.categories;
    switch (category) {
        case "home":
            return {
                id: "home",
                name: "Home & Overview",
                emoji: categories.home,
                desc: "Bot overview, features, and quick links.",
            };
        case "music":
            return {
                id: "music",
                name: "Music & Playback",
                emoji: categories.music,
                desc: "High-performance playback controls, queue management, volume, and lyrics.",
            };
        case "filter":
            return {
                id: "filter",
                name: "Audio Equalizer & Filters",
                emoji: categories.filter,
                desc: "Audio enhancement DSP filters: 8D, Bassboost, Nightcore, Vaporwave, and more.",
            };
        case "playlist":
            return {
                id: "playlist",
                name: "Custom Playlists",
                emoji: categories.playlist,
                desc: "Create, save, manage, play, and clone custom music playlists.",
            };
        case "configuration":
            return {
                id: "configuration",
                name: "Configuration & Setup",
                emoji: categories.configuration,
                desc: "Custom server prefixes, 24/7 stay mode, DJ roles, and song-requests channel.",
            };
        case "info":
            return {
                id: "info",
                name: "Information & Utility",
                emoji: categories.info,
                desc: "Bot statistics, ping, shard statuses, about, and invite links.",
            };
        case "developer":
            return {
                id: "developer",
                name: "Developer Controls",
                emoji: categories.developer,
                desc: "Bot owner diagnostics, restarts, shutdowns, and guild inspection. Developers can be configured in config.reverb.js.",
            };
        default:
            return {
                id: "home",
                name: "Overview",
                emoji: categories.home,
                desc: "Overview of all commands.",
            };
    }
}

/**
 * Evaluates whether developer commands, statistics, and category should be displayed in the help menu and args.
 *
 * @param {object} params
 * @param {import("../structures/client.js")} params.client
 * @param {boolean} [params.isDeveloper=false]
 * @returns {boolean}
 */
function shouldDisplayDeveloper({ client, isDeveloper = false }) {
    const setting =
        client?.config?.bot?.showDeveloperCommandsInHelp ??
        client?.config?.help?.showDeveloperCommands ??
        client?.showDeveloperCommandsInHelp;

    // Explicit boolean setting:
    if (setting === true) return true;
    if (setting === false) return false;

    // "developers" / "devOnly" setting: only show to authorized developers
    if (setting === "developers" || setting === "devOnly" || setting === "developer") {
        return Boolean(isDeveloper);
    }

    // Default: only show to authorized developers if undefined/unconfigured
    return Boolean(isDeveloper);
}

/**
 * Builds the Components V2 Container for the Help Menu.
 *
 * @param {object} options
 * @param {import("../structures/client.js")} options.client
 * @param {string} [options.category="home"]
 * @param {string} [options.prefix="r!"]
 * @param {boolean} [options.isDeveloper=false]
 * @param {boolean} [options.disabled=false]
 * @returns {{ container: ContainerBuilder, components: ContainerBuilder[], flags: number }}
 */
function buildHelpView({
    client,
    category = "home",
    prefix = client?.config?.bot?.prefix || client?.prefix || "r!",
    isDeveloper = false,
    disabled = false,
}) {
    const accentColor = client?.color?.number ?? accentColor;
    const botName = client?.botName || "Reverb";
    const canShowDev = shouldDisplayDeveloper({ client, isDeveloper });
    const currentCat = CATEGORY_ORDER.includes(category)
        ? (category === "developer" && !canShowDev ? "home" : category)
        : "home";
    const meta = getCategoryMeta(client, currentCat);

    const container = new ContainerBuilder().setAccentColor(accentColor);

    // 1. Header Text Display
    const headerTitle = `# ${client.emojiList.headphones} | ${botName} • Help Desk`;
    const headerSubtitle = `-# High-performance Discord music bot with 24/7 playback, filters, and custom playlists.`;
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`${headerTitle}\n${headerSubtitle}`),
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    // 2. Body Content based on active category
    if (currentCat === "home") {
        // Count totals
        let totalCmds = client.commands?.size || 56;
        if (!canShowDev && client.commands) {
            let nonDevCount = 0;
            client.commands.forEach((c) => {
                if (c.category?.toLowerCase() !== "developer" && !c.developerOnly) {
                    nonDevCount++;
                }
            });
            totalCmds = nonDevCount;
        }
        const totalCategories = canShowDev ? 6 : 5;

        const overviewLines = [
            `### Welcome to ${botName}!`,
            `Use the interactive select menu below to explore all available commands by category. You can also inspect specific commands or subcommands using:`,
            `> \`${prefix}help <command | subcommand>\` or \`/help [command]\``,
            "",
            `**Bot Statistics:**`,
            `• **Prefix:** \`${prefix}\` (Supports slash commands \`/\`)`,
            `• **Total Modules:** \`${totalCategories} Categories\``,
            `• **Available Commands:** \`${totalCmds} Commands\``,
        ];

        if (canShowDev) {
            overviewLines.push(
                `• **Developers:** Configurable in \`config.reverb.js\` (under \`bot.developerIds\`)`,
            );
        }

        overviewLines.push(
            "",
            `**Explore Categories:**`,
            `• ${getCategoryMeta(client, "music").emoji} **Music & Playback** — Play, Pause, Skip, Queue, Volume, Seek, Lyrics, Autoplay`,
            `• ${getCategoryMeta(client, "filter").emoji} **Audio Filters** — 8D, Bassboost, Nightcore, Vaporwave, Equalizer dashboard`,
            `• ${getCategoryMeta(client, "playlist").emoji} **Custom Playlists** — Create, Add, Remove, List, Play, and Clone playlists`,
            `• ${getCategoryMeta(client, "configuration").emoji} **Configuration** — Song-requests setup, DJ roles, 24/7 mode, Custom prefix`,
            `• ${getCategoryMeta(client, "info").emoji} **Information** — Ping, Bot info, Shards, System stats, Invite links`,
        );

        if (canShowDev) {
            overviewLines.push(
                `• ${getCategoryMeta(client, "developer").emoji} **Developer** — Bot administration commands (Configured in \`config.reverb.js\`)`,
            );
        }

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(overviewLines.join("\n")),
        );
    } else {
        // Specific Category Listing
        const lines = [
            `## ${meta.emoji} | ${meta.name}`,
            `-# ${meta.desc}`,
            "",
        ];

        // Custom formatting for categories with subcommands
        if (currentCat === "playlist") {
            lines.push(`**Subcommands Listing:**`);
            for (const sub of SUBCOMMANDS_DATA.playlist) {
                lines.push(`• \`${sub.name}\` — ${sub.desc}`);
            }
            lines.push(
                "",
                `-# Tip: Use \`${prefix}help playlist <subcommand>\` or \`/help [command]\` to view full argument syntax!`,
            );
        } else if (currentCat === "configuration") {
            lines.push(`**Commands & Subcommands:**`);
            lines.push(`• \`247\` — Toggle 24/7 stay mode in the current voice channel.`);
            lines.push(`• \`customize\` — Personalize the bot's appearance and profile for this server.`);
            lines.push(`• \`setprefix <prefix>\` — Change the server's command prefix.`);
            lines.push("");
            lines.push(`**DJ Management Subcommands:**`);
            for (const sub of SUBCOMMANDS_DATA.dj) {
                lines.push(`• \`${sub.name}\` — ${sub.desc}`);
            }
            lines.push("");
            lines.push(`**Song-Requests Setup Subcommands:**`);
            for (const sub of SUBCOMMANDS_DATA.setup) {
                lines.push(`• \`${sub.name}\` — ${sub.desc}`);
            }
            lines.push("");
            lines.push(`**Command Whitelist & Channel Restrictions:**`);
            for (const sub of SUBCOMMANDS_DATA.whitelist) {
                lines.push(`• \`${sub.name}\` — ${sub.desc}`);
            }
            lines.push(
                "",
                `-# Tip: Use \`${prefix}help <command>\` or \`/help [command]\` for detailed permissions and syntax!`,
            );
        } else if (currentCat === "developer") {
            lines.push(`> ${client.emojiList.categories.developer} **Developer Access:** Authorized developers can be configured in \`config.reverb.js\` (under \`bot.developerIds\`).`);
            lines.push("");

            const cmds = [];
            client.commands?.forEach((cmd) => {
                if (cmd.category?.toLowerCase() === "developer") {
                    cmds.push(cmd);
                }
            });

            if (cmds.length === 0) {
                lines.push(`*No commands found in this category.*`);
            } else {
                lines.push(`**Commands (${cmds.length}):**`);
                for (const cmd of cmds) {
                    const desc = cmd.description || "No description provided.";
                    lines.push(`• \`${cmd.name}\` — ${desc}`);
                }
                lines.push(
                    "",
                    `-# Tip: Use \`${prefix}help <command>\` or \`/help [command]\` to view argument details!`,
                );
            }
        } else {
            // General categories: Gather commands from collection
            const cmds = [];
            client.commands?.forEach((cmd) => {
                if (cmd.category?.toLowerCase() === currentCat) {
                    cmds.push(cmd);
                }
            });

            // Fallback if category name differs slightly
            if (cmds.length === 0) {
                lines.push(`*No commands found in this category.*`);
            } else {
                lines.push(`**Commands (${cmds.length}):**`);
                for (const cmd of cmds) {
                    const desc = cmd.description || "No description provided.";
                    lines.push(`• \`${cmd.name}\` — ${desc}`);
                }
                lines.push(
                    "",
                    `-# Tip: Use \`${prefix}help <command>\` or \`/help [command]\` to view argument details!`,
                );
            }
        }

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(lines.join("\n")),
        );
    }

    container.addSeparatorComponents(new SeparatorBuilder());

    // 3. Action Row 1: StringSelectMenu for Categories
    const categoriesToDisplay = CATEGORY_ORDER.filter(
        (c) => c !== "developer" || canShowDev,
    );

    const selectOptions = categoriesToDisplay.map((catKey) => {
        const catMeta = getCategoryMeta(client, catKey);
        const opt = new StringSelectMenuOptionBuilder()
            .setLabel(catMeta.name)
            .setValue(catKey)
            .setDescription(catMeta.desc.slice(0, 50))
            .setDefault(catKey === currentCat);

        if (catMeta.emoji) opt.setEmoji(catMeta.emoji);
        return opt;
    });

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("help_menu_select")
        .setPlaceholder("Choose a Category to Browse...")
        .setMinValues(1)
        .setMaxValues(1)
        .setDisabled(disabled)
        .addOptions(selectOptions);

    const selectRow = new ActionRowBuilder().addComponents(selectMenu);

    // 4. Action Row 2: Navigation Buttons (Home, Prev, Next, Close)
    const currentIndex = categoriesToDisplay.indexOf(currentCat);
    const isFirst = currentIndex <= 0;
    const isLast = currentIndex >= categoriesToDisplay.length - 1;

    const btnPrev = new ButtonBuilder()
        .setCustomId("help_nav_prev")
        .setLabel("Previous")
        .setEmoji(client.emojiList.buttons.previous)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled || isFirst);

    const btnHome = new ButtonBuilder()
        .setCustomId("help_nav_home")
        .setLabel("Home")
        .setEmoji(client.emojiList.buttons.home)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled || currentCat === "home");

    const btnNext = new ButtonBuilder()
        .setCustomId("help_nav_next")
        .setLabel("Next")
        .setEmoji(client.emojiList.buttons.next)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(disabled || isLast);

    const btnClose = new ButtonBuilder()
        .setCustomId("help_nav_close")
        .setLabel("Close")
        .setEmoji(client.emojiList.buttons.close)
        .setStyle(ButtonStyle.Danger)
        .setDisabled(disabled);

    const navRow = new ActionRowBuilder().addComponents(
        btnPrev,
        btnHome,
        btnNext,
        btnClose,
    );

    // 5. Action Row 3: Useful Links
    const linkButtons = [];
    if (client.config?.bot?.invite) {
        linkButtons.push(
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel("Invite Reverb")
                .setURL(client.config.bot.invite),
        );
    }
    if (client.config?.bot?.supportServer) {
        linkButtons.push(
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel("Support Server")
                .setURL(client.config.bot.supportServer),
        );
    }

    const actionRows = [selectRow, navRow];
    if (linkButtons.length > 0) {
        actionRows.push(new ActionRowBuilder().addComponents(linkButtons));
    }

    container.addActionRowComponents(...actionRows);

    return {
        container,
        components: [container],
        flags: MessageFlags.IsComponentsV2,
    };
}

/**
 * Builds a Components V2 Container view for a single command or subcommand.
 *
 * @param {object} options
 * @param {import("../structures/client.js")} options.client
 * @param {string} options.query
 * @param {string} [options.prefix="r!"]
 * @param {boolean} [options.isDeveloper=false]
 * @returns {{ container: ContainerBuilder, components: ContainerBuilder[], flags: number }}
 */
function buildCommandDetailView({ client, query, prefix = client?.config?.bot?.prefix || client?.prefix || "r!", isDeveloper = false }) {
    const accentColor = client?.color?.number ?? accentColor;
    const normalizedQuery = (query || "").trim().toLowerCase();
    const canShowDev = shouldDisplayDeveloper({ client, isDeveloper });
    const container = new ContainerBuilder().setAccentColor(accentColor);

    // 1. Check Subcommands First (e.g. "playlist add", "setup create", "dj toggle")
    for (const [group, subs] of Object.entries(SUBCOMMANDS_DATA)) {
        for (const sub of subs) {
            if (
                sub.name.toLowerCase() === normalizedQuery ||
                normalizedQuery === `${group} ${sub.name.split(" ")[1]}`
            ) {
                const lines = [
                    `# ${client.emojiList.book} | Command Info: \`${sub.name}\``,
                    `-## Category: \`${group.toUpperCase()}\``,
                    "",
                    `**Description:**`,
                    `> ${sub.desc}`,
                    "",
                    `**Command Usage:**`,
                    `\`\`\`bash\n${prefix}${sub.syntax}\n${sub.slash}\`\`\``,
                    "",
                    `**Example:**`,
                    `\`\`\`bash\n${prefix}${sub.example}\`\`\``,
                ];

                container.addTextDisplayComponents(
                    new TextDisplayBuilder().setContent(lines.join("\n")),
                );

                // Add Back Button
                const btnBack = new ButtonBuilder()
                    .setCustomId("help_nav_home")
                    .setLabel("Back to Help Menu")
                    .setEmoji(client.emojiList.buttons.home)
                    .setStyle(ButtonStyle.Danger);

                container.addActionRowComponents(
                    new ActionRowBuilder().addComponents(btnBack),
                );

                return {
                    container,
                    components: [container],
                    flags: MessageFlags.IsComponentsV2,
                };
            }
        }
    }

    // 2. Check Parent Commands that have subcommands (e.g. "playlist", "setup", "dj")
    if (SUBCOMMANDS_DATA[normalizedQuery]) {
        const subs = SUBCOMMANDS_DATA[normalizedQuery];
        const lines = [
            `# ${client.emojiList.book} | Command Group: \`${normalizedQuery}\``,
            `-## Category: \`${normalizedQuery === "playlist" ? "PLAYLIST" : "CONFIGURATION"}\``,
            "",
            `**Description:**`,
            `> Manage and configure \`${normalizedQuery}\` operations. This command uses subcommands.`,
            "",
            `**Available Subcommands:**`,
        ];

        for (const sub of subs) {
            lines.push(`• **\`${sub.name}\`**: ${sub.desc}`);
            lines.push(`  \`${prefix}${sub.syntax}\``);
        }

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(lines.join("\n")),
        );

        const btnBack = new ButtonBuilder()
            .setCustomId("help_nav_home")
            .setLabel("Back to Help Menu")
            .setEmoji(client.emojiList.buttons.home)
            .setStyle(ButtonStyle.Danger);

        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(btnBack),
        );

        return {
            container,
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        };
    }

    // 3. Check Standard Message / Slash Commands
    const cmd =
        client.commands?.get(normalizedQuery) ||
        client.commands?.get(client.aliases?.get(normalizedQuery));

    const slashCmd = client.slashCommands?.get(normalizedQuery);

    const isDevCmd = Boolean(
        cmd?.developerOnly ||
        slashCmd?.developerOnly ||
        cmd?.category?.toLowerCase() === "developer" ||
        slashCmd?.category?.toLowerCase() === "developer"
    );

    if ((!cmd && !slashCmd) || (isDevCmd && !canShowDev)) {
        const notFoundText = [
            `# ${client.emojiList.cross} | Command Not Found`,
            `Could not find any command or subcommand matching: \`${query}\``,
            "",
            `Use \`${prefix}help\` or \`/help\` to browse all available commands!`,
        ].join("\n");

        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(notFoundText),
        );

        const btnBack = new ButtonBuilder()
            .setCustomId("help_nav_home")
            .setLabel("Back to Help Menu")
            .setEmoji(client.emojiList.buttons.home)
            .setStyle(ButtonStyle.Secondary);

        container.addActionRowComponents(
            new ActionRowBuilder().addComponents(btnBack),
        );

        return {
            container,
            components: [container],
            flags: MessageFlags.IsComponentsV2,
        };
    }

    const commandName = cmd?.name || slashCmd?.slashData?.name || normalizedQuery;
    const desc =
        cmd?.description ||
        slashCmd?.slashData?.description ||
        "No description provided.";
    const usage = cmd?.usage ? ` ${cmd.usage}` : "";
    const category = cmd?.category || "General";
    const aliases =
        cmd?.aliases && cmd.aliases.length > 0
            ? cmd.aliases.map((a) => `\`${a}\``).join(", ")
            : "None";

    // Format Permissions
    const userPerms =
        cmd?.permissions?.user && cmd.permissions.user.length > 0
            ? cmd.permissions.user.map((p) => String(p)).join(", ")
            : "None required";
    const clientPerms =
        cmd?.permissions?.client && cmd.permissions.client.length > 0
            ? cmd.permissions.client.map((p) => String(p)).join(", ")
            : "Standard permissions";

    // Voice & DJ Requirements
    const reqs = [];
    if (cmd?.developerOnly || category?.toLowerCase() === "developer") {
        reqs.push("Bot Developer access required (Developers can be configured in `config.reverb.js`)");
    }
    if (cmd?.player?.voice) reqs.push("Must be connected to a Voice Channel");
    if (cmd?.player?.sameVoice) reqs.push("Must be in the same Voice Channel as bot");
    if (cmd?.player?.active) reqs.push("Player must be active");
    if (cmd?.player?.playing) reqs.push("Music must currently be playing");
    if (cmd?.player?.dj) reqs.push("DJ role, DJ user, or Manage Server required if DJ mode active");

    const requirementsText =
        reqs.length > 0
            ? reqs.map((r) => `• ${r}`).join("\n")
            : "• None";

    const detailLines = [
        `# ${client.emojiList.book} | Command Info: \`${commandName}\``,
        `-## Category: \`${category.toUpperCase()}\``,
        "",
        `**Description:**`,
        `> ${desc}`,
        "",
        `**Command Usage:**`,
        `\`\`\`bash\n${prefix}${commandName}${usage}\n/${commandName}${usage}\`\`\``,
        "",
        `**Aliases:** ${aliases}`,
        `**Permissions:** User: \`${userPerms}\` | Bot: \`${clientPerms}\``,
        "",
        `**Prerequisites & Requirements:**`,
        requirementsText,
    ];

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(detailLines.join("\n")),
    );

    const btnBack = new ButtonBuilder()
        .setCustomId("help_nav_home")
        .setLabel("Back to Help Menu")
        .setEmoji(client.emojiList.buttons.home)
        .setStyle(ButtonStyle.Secondary);

    container.addActionRowComponents(
        new ActionRowBuilder().addComponents(btnBack),
    );

    return {
        container,
        components: [container],
        flags: MessageFlags.IsComponentsV2,
    };
}

/**
 * Generates an array of { name, value } objects for slash command autocomplete.
 *
 * @param {import("../structures/client.js")} client
 * @param {string} focusedValue
 * @param {boolean} [isDeveloper=false]
 * @returns {{ name: string, value: string }[]}
 */
function getHelpAutocompleteChoices(client, focusedValue = "", isDeveloper = false) {
    const query = (focusedValue || "").toLowerCase().trim();
    const canShowDev = shouldDisplayDeveloper({ client, isDeveloper });
    const allOptions = [];

    // 1. Add all standard commands
    if (client.commands) {
        client.commands.forEach((cmd) => {
            const isDev = Boolean(cmd.developerOnly || cmd.category?.toLowerCase() === "developer");
            if (isDev && !canShowDev) return;

            allOptions.push({
                name: `${cmd.name} (${cmd.category || "General"})`,
                value: cmd.name,
            });
        });
    }

    // 2. Add subcommands explicitly (e.g. playlist add, setup create, etc.)
    for (const [group, subs] of Object.entries(SUBCOMMANDS_DATA)) {
        for (const sub of subs) {
            allOptions.push({
                name: `${sub.name} (${group})`,
                value: sub.name,
            });
        }
    }

    // Filter by query
    const filtered = allOptions.filter((item) =>
        item.value.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query),
    );

    // Return at most 25 results (Discord API maximum)
    return filtered.slice(0, 25);
}

module.exports = {
    CATEGORY_ORDER,
    SUBCOMMANDS_DATA,
    shouldDisplayDeveloper,
    buildHelpView,
    buildCommandDetailView,
    getHelpAutocompleteChoices,
};
