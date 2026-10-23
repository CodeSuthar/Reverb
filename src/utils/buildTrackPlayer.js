const {
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    ThumbnailBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
    AttachmentBuilder,
    MessageFlags,
    EmbedBuilder,
} = require("discord.js");
const path = require("path");
const fs = require("fs");
const { convertMillisecondsToTime } = require("./musicUtils/functions.js");

const ACCENT_COLOR = 0xFF66C4;
const DEFAULT_BANNER_PATH = path.resolve(__dirname, "../../docs/public/Reverb-Banner.png");
const BANNER_ATTACHMENT_NAME = "Reverb-Banner.png";

/**
 * Builds the interactive 5-button action row for track playback controls:
 * [Volume Down, Previous Track, Play/Pause, Next Track, Volume Up].
 *
 * @param {import("../structures/reverbPlayer.js")|null} [player] - The music player instance for the guild.
 * @param {import("../structures/client.js")} [client] - The Discord bot client.
 * @returns {ActionRowBuilder} A single ActionRowBuilder component containing the 5 buttons.
 */
function getTrackPlayerButtons(player = null, client = null) {
    const isPaused = Boolean(player?.paused);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("player_voldown")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(client?.emojiList?.volume?.down),

        // 2. Previous Track
        new ButtonBuilder()
            .setCustomId("player_previous")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(client?.emojiList?.musicButtons?.previous),

        // 3. Play / Pause
        new ButtonBuilder()
            .setCustomId("player_action")
            .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setEmoji(
                isPaused
                    ? client?.emojiList?.musicButtons?.play
                    : client?.emojiList?.musicButtons?.pause,
            ),

        new ButtonBuilder()
            .setCustomId("player_skip")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(client?.emojiList?.musicButtons?.next),
        new ButtonBuilder()
            .setCustomId("player_volup")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(client?.emojiList?.volume?.up),
    );

    return row;
}

/**
 * Builds a Components V2 Container for the track player message (sent when track starts).
 *
 * @param {import("../structures/client.js")} client - The Discord bot client.
 * @param {import("../structures/reverbPlayer.js")|string|null} [playerOrGuildId] - Player instance or guildId.
 * @param {object} [options] - Custom view options.
 * @returns {ContainerBuilder} The constructed Components V2 ContainerBuilder.
 */
function buildTrackPlayerContainer(client, player = null, options = {}) {
    const accentColor = client?.color?.number ?? ACCENT_COLOR;
    const container = new ContainerBuilder()
        .setAccentColor(accentColor);

    // 1. Header display
    const isPaused = Boolean(player?.paused);
    const defaultHeader = isPaused
        ? `${client.emojiList.pause} | **Now Paused**`
        : `${client.emojiList.nowplaying} | **Now Playing**`;
    const headerTitle = options.header || defaultHeader;
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(headerTitle),
    );

    // 2. Track / Player Status Section
    const track = player?.current;
    const queuedTracks = Array.isArray(player?.queue?.tracks)
        ? [...player.queue.tracks]
        : Array.isArray(player?.queue)
          ? [...player.queue]
          : [];

    if (track) {
        const title = track.title || "Unknown Title";
        const uri = track.uri || track.url || "";
        const author = track.author || "Unknown Artist";
        const duration = track.duration ? convertMillisecondsToTime(track.duration) : (track.isStream ? "Live Stream" : "Unknown");
        const requester = track.requester
            ? (track.requester.tag || track.requester.username || `${track.requester}`)
            : null;
        const statusDisplay = isPaused ? "Paused ⏸️" : "Playing ▶️";
        const volumeDisplay = `${player?.volume ?? 100}%`;

        const trackDetails = [
            uri ? `### [${title}](${uri})` : `### ${title}`,
            `**Artist:** ${author}`,
            `**Duration:** \`${duration}\``,
            `**Status:** \`${statusDisplay}\` • **Volume:** \`${volumeDisplay}\``,
            `**Requested by:** ${requester ?? "Unknown"}`
        ].join("\n");

        const thumbnail = track.artworkUrl;

        if (thumbnail) {
            const section = new SectionBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(trackDetails),
            );
            section.setThumbnailAccessory(
                new ThumbnailBuilder()
                    .setURL(thumbnail)
                    .setDescription(`Artwork for ${title}`),
            );
            container.addSectionComponents(section);
        } else if (uri) {
            const section = new SectionBuilder().addTextDisplayComponents(
                new TextDisplayBuilder().setContent(trackDetails),
            );
            section.setButtonAccessory(
                new ButtonBuilder()
                    .setLabel("Listen to the Track")
                    .setStyle(ButtonStyle.Link)
                    .setURL(uri),
            );
            container.addSectionComponents(section);
        } else {
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(trackDetails),
            );
        }
    } else {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                options.description ||
                "### **Nothing playing right now**\nJoin a voice channel and send a song name or URL to start playing music!",
            ),
        );
    }

    // 5. Action Row with the 5 control buttons
    const row = getTrackPlayerButtons(player, client);
    container.addActionRowComponents(row);

    return container;
}

/**
 * Builds the complete Components V2 view payload for the track player message when a track starts.
 *
 * @param {import("../structures/client.js")} client - The Discord bot client.
 * @param {import("../structures/reverbPlayer.js")|string|null} [playerOrGuildId] - Player instance or guildId.
 * @param {object} [options] - Custom view options.
 * @returns {{ components: ContainerBuilder[], files: AttachmentBuilder[], flags: number, container: ContainerBuilder }}
 */
function buildTrackPlayer(client, playerOrGuildId = null, options = {}) {
    let player = playerOrGuildId;

    if (typeof playerOrGuildId === "string") {
        player = client?.musicManager?.players?.get(playerOrGuildId) || null;
    }

    const container = buildTrackPlayerContainer(client, player, options);
    const files = options.files ? [...options.files] : [];

    // Attach docs/public/Reverb-Banner.png if not using a custom external image
    const bannerPath = options.bannerPath || DEFAULT_BANNER_PATH;
    if (!options.image && fs.existsSync(bannerPath)) {
        const alreadyAttached = files.some(
            (f) => (f.name || f) === BANNER_ATTACHMENT_NAME,
        );
        if (!alreadyAttached) {
            files.push(
                new AttachmentBuilder(bannerPath, { name: BANNER_ATTACHMENT_NAME }),
            );
        }
    }

    return {
        components: [container],
        files,
        flags: MessageFlags.IsComponentsV2,
        container,
    };
}

/**
 * Helper to construct an EmbedBuilder fallback if traditional embeds are requested.
 *
 * @param {import("../structures/client.js")} client
 * @param {import("../structures/reverbPlayer.js")|null} [player]
 * @param {object} [options]
 * @returns {EmbedBuilder}
 */
function getTrackPlayerEmbed(client, player = null, options = {}) {
    const track = player?.current;
    const queuedTracks = Array.isArray(player?.queue?.tracks)
        ? [...player.queue.tracks]
        : Array.isArray(player?.queue)
          ? [...player.queue]
          : [];
    let description;

    if (options.description) {
        description = options.description;
    } else if (track) {
        const title = track.title || "Unknown Title";
        const uri = track.uri || track.url || "";
        description = uri ? `**[${title}](${uri})**` : `**${title}**`;
    } else {
        description =
            "**Nothing playing right now**\n\nJoin a voice channel and send a song name or URL here to start playing music!";
    }

    const isPaused = Boolean(player?.paused);
    const botName = client?.config?.bot?.name || client?.user?.username || "Reverb";
    const statusLabel = isPaused ? "Paused" : "Now Playing";
    const embed = new EmbedBuilder()
        .setColor(client?.color?.hex ?? ACCENT_COLOR)
        .setAuthor({
            name: `${botName} | ${statusLabel}`,
            iconURL: client?.user?.displayAvatarURL?.() || undefined,
        })
        .setDescription(description);

    if (track) {
        embed.addFields({
            name: "Status",
            value: `\`${isPaused ? "Paused ⏸️" : "Playing ▶️"}\` • Volume: \`${player?.volume ?? 100}%\``,
            inline: true,
        });

        const thumbnail =
            track.artworkUrl ||
            track.thumbnail ||
            (typeof track.displayThumbnail === "function"
                ? track.displayThumbnail("maxresdefault")
                : null);

        if (thumbnail) {
            embed.setThumbnail(thumbnail);
        }

        if (queuedTracks.length > 0) {
            const maxDisplay = options.maxQueueTracks || 3;
            const visibleTracks = queuedTracks.slice(0, maxDisplay);
            const queueLines = visibleTracks.map((t, i) => {
                const dur = t.duration ? `\`${convertMillisecondsToTime(t.duration)}\`` : "`Unknown`";
                const link = t.uri ? `[${t.title || "Unknown"}](${t.uri})` : `${t.title || "Unknown"}`;
                return `\`${i + 1}.\` **${link}** (${dur})`;
            });

            if (queuedTracks.length > maxDisplay) {
                queueLines.push(`*... and ${queuedTracks.length - maxDisplay} more*`);
            }

            embed.addFields({
                name: `Up Next (${queuedTracks.length})`,
                value: queueLines.join("\n"),
                inline: false,
            });
        }
    }

    if (options.image) {
        embed.setImage(options.image);
    } else {
        embed.setImage(`attachment://${BANNER_ATTACHMENT_NAME}`);
    }

    return embed;
}

buildTrackPlayer.buildTrackPlayer = buildTrackPlayer;
buildTrackPlayer.buildTrackPlayerContainer = buildTrackPlayerContainer;
buildTrackPlayer.getTrackPlayerButtons = getTrackPlayerButtons;
buildTrackPlayer.getTrackPlayerEmbed = getTrackPlayerEmbed;
buildTrackPlayer.DEFAULT_BANNER_PATH = DEFAULT_BANNER_PATH;
buildTrackPlayer.BANNER_ATTACHMENT_NAME = BANNER_ATTACHMENT_NAME;
buildTrackPlayer.ACCENT_COLOR = ACCENT_COLOR;

module.exports = buildTrackPlayer;
