const {
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ThumbnailBuilder,
    MediaGalleryBuilder,
    MediaGalleryItemBuilder,
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
 * Builds the interactive button rows for the song-requests channel setup.
 *
 * @param {import("../structures/reverbPlayer.js")|null} [player] - The music player instance for the guild.
 * @param {import("../structures/client.js")} [client] - The Discord bot client.
 * @returns {ActionRowBuilder[]} Array of ActionRowBuilder components.
 */
function getSetupButtons(player = null, client = null) {
    const isPaused = Boolean(player?.paused);
    const isLooping = Boolean(player?.loop && player.loop !== "off");

    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("player_previous")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(client?.emojiList?.musicButtons?.previous),
        new ButtonBuilder()
            .setCustomId("player_rewind")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(client?.emojiList?.seek?.backward),
        new ButtonBuilder()
            .setCustomId("player_action")
            .setStyle(isPaused ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setEmoji(
                isPaused
                    ? client?.emojiList?.musicButtons?.play
                    : client?.emojiList?.musicButtons?.pause,
            ),
        new ButtonBuilder()
            .setCustomId("player_forward")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(client?.emojiList?.seek?.forward),
        new ButtonBuilder()
            .setCustomId("player_skip")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(client?.emojiList?.musicButtons?.next),
    );

    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("player_voldown")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(client?.emojiList?.volume?.down),
        new ButtonBuilder()
            .setCustomId("player_loop")
            .setStyle(isLooping ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setEmoji(client?.emojiList?.loop?.default),
        new ButtonBuilder()
            .setCustomId("player_stop")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(client?.emojiList?.stop),
        new ButtonBuilder()
            .setCustomId("player_shuffle")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(client?.emojiList?.shuffle),
        new ButtonBuilder()
            .setCustomId("player_volup")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(client?.emojiList?.volume?.up),
    );

    return [row1, row2];
}

/**
 * Builds a Components V2 Container for the song-requests channel setup.
 *
 * @param {import("../structures/client.js")} client - The Discord bot client.
 * @param {import("../structures/reverbPlayer.js")|string|null} [playerOrGuildId] - Player instance or guildId.
 * @param {object} [options] - Custom view options.
 * @returns {ContainerBuilder} The constructed Components V2 ContainerBuilder.
 */
function buildSetupContainer(client, player = null, options = {}) {
    const accentColor = client?.color?.number ?? ACCENT_COLOR;
    const container = new ContainerBuilder()
        .setAccentColor(accentColor);

    // 1. Header display
    const isPaused = Boolean(player?.paused);
    const headerTitle = `## ${client.emojiList.nowplaying} | Song Request Channel${isPaused ? " • *Paused*" : ""}\n-# Send a song title or link here to start playing music!`;
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(headerTitle),
    );

    container.addSeparatorComponents(new SeparatorBuilder());

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
        const duration = track.duration ? `${convertMillisecondsToTime(track.duration)}` : isStream ? `${client.emojiList?.livestream} Live Stream ]` : "Unknown Duration";
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
            requester ? `**Requested by:** ${requester}` : null,
        ].filter(Boolean).join("\n");

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

        container.addSeparatorComponents(new SeparatorBuilder());

        // 3. Queue / Up Next Section
        const maxDisplay = options.maxQueueTracks || 3;
        const totalQueueDuration = queuedTracks.reduce(
            (acc, t) => acc + (Number(t.duration) || 0),
            0,
        );

        if (queuedTracks.length > 0) {
            const queueHeader = `### Up Next (${queuedTracks.length} track${queuedTracks.length === 1 ? "" : "s"}${totalQueueDuration ? ` • \`${convertMillisecondsToTime(totalQueueDuration)}\`` : ""})`;

            const visibleTracks = queuedTracks.slice(0, maxDisplay);
            const queueLines = [queueHeader];

            for (let i = 0; i < visibleTracks.length; i++) {
                const qTrack = visibleTracks[i];
                const qTitle = qTrack.title || "Unknown Track";
                const qUri = qTrack.uri || qTrack.url || "";
                const qDuration = qTrack.duration
                    ? `\`${convertMillisecondsToTime(qTrack.duration)}\``
                    : "`Unknown`";
                const qRequester = qTrack.requester
                    ? ` • ${qTrack.requester.tag || qTrack.requester.username || qTrack.requester}`
                    : "";
                const trackLink = qUri ? `[${qTitle}](${qUri})` : qTitle;

                queueLines.push(`\`${i + 1}.\` **${trackLink}** (${qDuration})${qRequester}`);
            }

            if (queuedTracks.length > maxDisplay) {
                const remaining = queuedTracks.length - maxDisplay;
                queueLines.push(`-# *... and ${remaining} more track${remaining === 1 ? "" : "s"} in queue.*`);
            }

            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(queueLines.join("\n")),
            );
        } else {
            container.addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `### ${client.emojiList.queue} | Up Next\n*Queue is currently empty. Send a song name or link to queue more music!*`,
                ),
            );
        }
    } else {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                options.description ||
                "### **Nothing playing right now**\nJoin a voice channel and send a song name or URL here to start playing music!",
            ),
        );
    }

    // 4. Media Gallery (Banner Image)
    const botName = client?.config?.bot?.name || client?.user?.username || "Reverb";
    const bannerUrl = options.image || `attachment://${BANNER_ATTACHMENT_NAME}`;
    const mediaGallery = new MediaGalleryBuilder().addItems(
        new MediaGalleryItemBuilder()
            .setURL(bannerUrl)
            .setDescription(options.imageDescription || `${botName} Banner`),
    );
    container.addMediaGalleryComponents(mediaGallery);

    container.addSeparatorComponents(new SeparatorBuilder());

    // 5. Instructions / Footer note
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            "-# Prefix is not required in this channel. Just type the song name or paste a link!",
        ),
    );

    // 6. Action Rows (Interactive Playback Control Buttons)
    const [row1, row2] = getSetupButtons(player, client);
    container.addActionRowComponents(row1, row2);

    return container;
}

/**
 * Builds the complete Components V2 view payload for the song-requests channel setup.
 *
 * @param {import("../structures/client.js")} client - The Discord bot client.
 * @param {import("../structures/reverbPlayer.js")|string|null} [playerOrGuildId] - Player instance or guildId.
 * @param {object} [options] - Custom view options.
 * @returns {{ components: ContainerBuilder[], files: AttachmentBuilder[], flags: number, container: ContainerBuilder }}
 */
function buildSetupView(client, playerOrGuildId = null, options = {}) {
    let player = playerOrGuildId;

    if (typeof playerOrGuildId === "string") {
        player = client?.musicManager?.players?.get(playerOrGuildId) || null;
    }

    const container = buildSetupContainer(client, player, options);
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
function getSetupEmbed(client, player = null, options = {}) {
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
    const statusLabel = isPaused ? " [Paused]" : "";
    const embed = new EmbedBuilder()
        .setColor(client?.color?.hex ?? ACCENT_COLOR)
        .setAuthor({
            name: `${botName} | Song Request Channel${statusLabel}`,
            iconURL: client?.user?.displayAvatarURL?.() || undefined,
        })
        .setDescription(description)
        .setFooter({
            text: "Prefix is not required in this channel. Just type the song name or paste a link!",
        });

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

buildSetupView.buildSetupView = buildSetupView;
buildSetupView.buildSetupContainer = buildSetupContainer;
buildSetupView.getSetupButtons = getSetupButtons;
buildSetupView.getSetupEmbed = getSetupEmbed;
buildSetupView.DEFAULT_BANNER_PATH = DEFAULT_BANNER_PATH;
buildSetupView.BANNER_ATTACHMENT_NAME = BANNER_ATTACHMENT_NAME;
buildSetupView.ACCENT_COLOR = ACCENT_COLOR;

module.exports = buildSetupView;
