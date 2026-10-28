const {
    EmbedBuilder, MessageFlags, PermissionFlagsBits
} = require("discord.js");
const {
    convertMillisecondsToTime
} = require("../../utils/musicUtils/index");

const BUTTON_ACTIONS = {
    // Play / Pause
    player_action: "PLAY_PAUSE",
    SETUP_PLAY_PAUSE_BUTTON: "PLAY_PAUSE",

    // Skip
    player_skip: "SKIP",
    SETUP_SKIP_BUTTON: "SKIP",

    // Stop
    player_stop: "STOP",
    SETUP_STOP_BUTTON: "STOP",

    // Volume Down
    player_voldown: "VOL_DOWN",
    SETUP_VOL_DOWN_BUTTON: "VOL_DOWN",

    // Volume Up
    player_volup: "VOL_UP",
    SETUP_VOL_UP_BUTTON: "VOL_UP",

    // Previous / Back / Replay
    player_previous: "PREVIOUS",
    SETUP_PREVIOUS_BUTTON: "PREVIOUS",

    // Rewind
    player_rewind: "REWIND",
    SETUP_REWIND_BUTTON: "REWIND",

    // Forward
    player_forward: "FORWARD",
    SETUP_FORWARD_BUTTON: "FORWARD",

    // Loop
    player_loop: "LOOP",
    SETUP_LOOP_BUTTON: "LOOP",

    // Shuffle
    player_shuffle: "SHUFFLE",
    SETUP_SHUFFLE_BUTTON: "SHUFFLE",
};

// Actions that modify playback and require DJ validation (matching messageCreate.js playerConfig.dj)
const DJ_ACTIONS = new Set([
    "PLAY_PAUSE",
    "SKIP",
    "STOP",
    "VOL_DOWN",
    "VOL_UP",
    "PREVIOUS",
    "REWIND",
    "FORWARD",
    "LOOP",
    "SHUFFLE",
]);

/**
 * Sends an ephemeral error message to the interacting user.
 *
 * @param {import("discord.js").ButtonInteraction} interaction
 * @param {string} description
 * @param {import("../../structures/client")} client
 */
async function oops(interaction, description, client) {
    const cross = client.emojiList.cross;
    const desc = description.includes(cross)
        ? description
        : `${cross} | **${description}**`;

    const embed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(desc);

    if (interaction.deferred || interaction.replied) {
        return await interaction.editReply({ embeds: [embed] }).catch(() => null);
    } else {
        return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral }).catch(() => null);
    }
}

module.exports = {
    name: "interactionCreate",
    run: async (client, interaction) => {
        if (!interaction.isButton()) return;

        const action = BUTTON_ACTIONS[interaction.customId];
        if (!action) return;

        // Defer reply ephemerally using MessageFlags.Ephemeral to prevent Discord interaction expiration
        if (!interaction.replied && !interaction.deferred) {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => null);
        }

        const primaryColor = client?.color?.hex ?? "#FF66C4";
        const guildId = interaction.guildId;

        // 1. Check if user is in a voice channel
        const memberVoiceChannel = interaction.member?.voice?.channel;
        if (!memberVoiceChannel) {
            return await oops(
                interaction,
                "You need to be connected to a voice channel to use these playback buttons!",
                client,
            );
        }

        // 2. Resolve Player
        const guildPlayer = await client.musicManager.players.get(guildId);
        if (!guildPlayer) {
            return await oops(
                interaction,
                "There is no active music player for this server.",
                client,
            );
        }

        // 3. Check Same Voice Channel
        if (guildPlayer.voiceChannelId && guildPlayer.voiceChannelId !== memberVoiceChannel.id) {
            return await oops(
                interaction,
                `You must be in the same voice channel (<#${guildPlayer.voiceChannelId}>) as the bot to use these controls!`,
                client,
            );
        }

        // 4. DJ Role / Manage Server Permission Check (matching messageCreate.js)
        if (DJ_ACTIONS.has(action)) {
            const isBotDev = client.developerIds?.includes(interaction.user.id);

            if (!isBotDev) {
                const dj = await client.database.getDJ(guildId);

                if (dj && dj.mode) {
                    const hasRoles = Array.isArray(dj.roles) && dj.roles.length > 0;
                    const hasUsers = Array.isArray(dj.users) && dj.users.length > 0;

                    if (!hasRoles && !hasUsers) {
                        let prefix = client.config?.bot?.prefix || client.prefix || "r!";
                        try {
                            prefix = await client.database.getPrefix(guildId);
                        } catch {
                            prefix = client.config?.bot?.prefix || client.prefix || "r!";
                        }

                        return await oops(
                            interaction,
                            `${client.emojiList.cross} | DJ mode is enabled, but no DJ role or user is set. Please configure a DJ role or user using the \`${prefix}dj add <@role | @user>\` command.`,
                            client,
                        );
                    }

                    const isDJ =
                        (hasRoles && dj.roles.some((roleId) => interaction.member?.roles?.cache?.has(roleId))) ||
                        (hasUsers && dj.users.includes(interaction.user.id)) ||
                        interaction.member?.permissions?.has(PermissionFlagsBits.ManageGuild);

                    if (!isDJ) {
                        return await oops(
                            interaction,
                            `${client.emojiList.cross} | **You need a configured DJ role, DJ user permission, or \`Manage Server\` permission to use this command.**`,
                            client,
                        );
                    }
                }
            }
        }

        try {
            switch (action) {
                case "VOL_DOWN": {
                    const minVolume = 0;
                    const currentVol = typeof guildPlayer.volume === "number" ? guildPlayer.volume : 100;
                    let amount = currentVol - 10;

                    if (amount < minVolume) amount = minVolume;

                    if (currentVol <= minVolume) {
                        return await oops(
                            interaction,
                            `Player volume limit is between 0% and 150%! Volume is already at minimum.`,
                            client,
                        );
                    }

                    await guildPlayer.setVolume(amount);

                    let embed;
                    if (amount === 0) {
                        embed = new EmbedBuilder()
                            .setColor(primaryColor)
                            .setDescription(
                                `${client.emojiList.volume.down} | **Player has been muted successfully (0%).**`,
                            )
                            .setTimestamp();
                    } else {
                        embed = new EmbedBuilder()
                            .setColor(primaryColor)
                            .setDescription(
                                `${client.emojiList.volume.down} | **Player volume has been set to \`${amount}%\`**`,
                            )
                            .setTimestamp();
                    }

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case "VOL_UP": {
                    const maxVolume = client.config?.music?.maxVolume || 150;
                    const currentVol = typeof guildPlayer.volume === "number" ? guildPlayer.volume : 100;
                    let amount = currentVol + 10;

                    if (amount > maxVolume) amount = maxVolume;

                    if (currentVol >= maxVolume) {
                        return await oops(
                            interaction,
                            `Player volume limit is between 0% and ${maxVolume}%! Volume is already at maximum.`,
                            client,
                        );
                    }

                    await guildPlayer.setVolume(amount);

                    const embed = new EmbedBuilder()
                        .setColor(primaryColor)
                        .setDescription(
                            `${client.emojiList.volume.up} | **Player volume has been set to \`${amount}%\`**`,
                        )
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case "STOP": {
                    if (!guildPlayer.current && (!guildPlayer.queue || !guildPlayer.queue.tracks?.length)) {
                        return await oops(
                            interaction,
                            "There's no player playing in the guild.",
                            client,
                        );
                    }

                    if (guildPlayer.queue && typeof guildPlayer.queue.clear === "function") {
                        guildPlayer.queue.clear();
                    }

                    if (guildPlayer.paused) {
                        await guildPlayer.resume().catch(() => null);
                    }

                    await guildPlayer.stop().catch(() => null);

                    const embed = new EmbedBuilder()
                        .setColor(primaryColor)
                        .setDescription(
                            `${client.emojiList.stop} | **The player has been stopped and queue cleared.**`,
                        )
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case "PLAY_PAUSE": {
                    if (!guildPlayer.current) {
                        return await oops(
                            interaction,
                            "There's no music currently playing in the guild.",
                            client,
                        );
                    }

                    let actionText = "";
                    let actionEmoji = "";

                    if (guildPlayer.paused) {
                        await guildPlayer.resume();
                        actionText = "Resumed";
                        actionEmoji = client.emojiList.resume;
                    } else {
                        await guildPlayer.pause();
                        actionText = "Paused";
                        actionEmoji = client.emojiList.pause;
                    }

                    const track = guildPlayer.current;
                    const trackTitle = track.title || "Unknown Track";
                    const trackUri = track.uri || track.url;
                    const trackLink = trackUri ? `[${trackTitle}](${trackUri})` : `**${trackTitle}**`;
                    const requesterTag =
                        track.requester?.tag ||
                        track.requester?.username ||
                        `${track.requester ?? "Unknown"}`;
                    const durationStr = track.duration
                        ? `${convertMillisecondsToTime(track.duration)}`
                        : "Live Stream";

                    const embed = new EmbedBuilder()
                        .setColor(primaryColor)
                        .setAuthor({
                            name: `| ${actionText}`,
                            iconURL: client.user.displayAvatarURL({ dynamic: true }),
                        })
                        .setDescription(trackLink)
                        .addFields(
                            {
                                name: "Duration",
                                value: `\`${durationStr}\``,
                                inline: true,
                            },
                            {
                                name: "Requester",
                                value: `\`[ ${requesterTag} ]\``,
                                inline: true,
                            },
                        )
                        .setTimestamp();

                    const thumbnail =
                        track.artworkUrl ||
                        track.thumbnail ||
                        (typeof track.displayThumbnail === "function"
                            ? track.displayThumbnail("maxresdefault")
                            : null);

                    if (thumbnail) embed.setThumbnail(thumbnail);

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case "SKIP": {
                    if (!guildPlayer.current) {
                        return await oops(
                            interaction,
                            "There's no music currently playing to skip.",
                            client,
                        );
                    }

                    const skippedTrack = guildPlayer.current;
                    const title = skippedTrack.title || "Unknown Track";
                    const uri = skippedTrack.uri || skippedTrack.url;
                    const link = uri ? `[${title}](${uri})` : `**${title}**`;

                    const embed = new EmbedBuilder()
                        .setColor(primaryColor)
                        .setAuthor({
                            name: "Skipped The Track",
                            iconURL: client.user.displayAvatarURL({ dynamic: true }),
                        })
                        .setDescription(
                            `${client.emojiList.skip} | **Skipped current track:** ${link}`,
                        )
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    await guildPlayer.skip();
                    break;
                }

                case "PREVIOUS": {
                    if (Array.isArray(guildPlayer.previous) && guildPlayer.previous.length > 0) {
                        await guildPlayer.back();
                        const embed = new EmbedBuilder()
                            .setColor(primaryColor)
                            .setDescription(
                                `${client.emojiList.previous} | **Playing previous track from history.**`,
                            )
                            .setTimestamp();

                        await interaction.editReply({ embeds: [embed] });
                    } else if (guildPlayer.current) {
                        await guildPlayer.replay();
                        const embed = new EmbedBuilder()
                            .setColor(primaryColor)
                            .setDescription(
                                `${client.emojiList.previous} | **Replaying current track from beginning.**`,
                            )
                            .setTimestamp();

                        await interaction.editReply({ embeds: [embed] });
                    } else {
                        return await oops(
                            interaction,
                            "No previous track found in history to play.",
                            client,
                        );
                    }
                    break;
                }

                case "REWIND": {
                    if (!guildPlayer.current) {
                        return await oops(
                            interaction,
                            "There is no music currently playing to rewind.",
                            client,
                        );
                    }

                    if (!guildPlayer.current.isSeekable || guildPlayer.current.isStream) {
                        return await oops(
                            interaction,
                            "The current song cannot be seeked.",
                            client,
                        );
                    }

                    const currentPos =
                        typeof guildPlayer.position === "number"
                            ? guildPlayer.position
                            : (guildPlayer.current?.position || 0);
                    const targetPos = Math.max(0, currentPos - 10000);

                    await guildPlayer.seek(targetPos);

                    const embed = new EmbedBuilder()
                        .setColor(primaryColor)
                        .setDescription(
                            `${client.emojiList.seekback} | **Rewinded 10 seconds** (\`${convertMillisecondsToTime(targetPos)}\` / \`${convertMillisecondsToTime(guildPlayer.current.duration)}\`)`,
                        )
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case "FORWARD": {
                    if (!guildPlayer.current) {
                        return await oops(
                            interaction,
                            "There is no music currently playing to fast-forward.",
                            client,
                        );
                    }

                    if (!guildPlayer.current.isSeekable || guildPlayer.current.isStream) {
                        return await oops(
                            interaction,
                            "The current song cannot be seeked.",
                            client,
                        );
                    }

                    const currentPos =
                        typeof guildPlayer.position === "number"
                            ? guildPlayer.position
                            : (guildPlayer.current?.position || 0);
                    const targetPos = Math.min(guildPlayer.current.duration, currentPos + 10000);

                    await guildPlayer.seek(targetPos);

                    const embed = new EmbedBuilder()
                        .setColor(primaryColor)
                        .setDescription(
                            `${client.emojiList.seekforward} | **Fast-forwarded 10 seconds** (\`${convertMillisecondsToTime(targetPos)}\` / \`${convertMillisecondsToTime(guildPlayer.current.duration)}\`)`,
                        )
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case "LOOP": {
                    if (!guildPlayer.current) {
                        return await oops(
                            interaction,
                            "There is no music currently playing to loop.",
                            client,
                        );
                    }

                    let newMode = "off";
                    let loopMessage = "";

                    if (guildPlayer.loop === "off") {
                        newMode = "track";
                        loopMessage = `${client.emojiList.loop.track} | **Loop mode set to:** \`Current Track\``;
                    } else if (guildPlayer.loop === "track") {
                        newMode = "queue";
                        loopMessage = `${client.emojiList.loop.queue} | **Loop mode set to:** \`Queue\``;
                    } else {
                        newMode = "off";
                        loopMessage = `${client.emojiList.loop.off} | **Loop mode disabled.**`;
                    }

                    guildPlayer.setLoop(newMode);

                    const embed = new EmbedBuilder()
                        .setColor(primaryColor)
                        .setDescription(loopMessage)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case "SHUFFLE": {
                    const queueTracks = Array.isArray(guildPlayer.queue?.tracks)
                        ? guildPlayer.queue.tracks
                        : [];

                    if (queueTracks.length === 0) {
                        return await oops(
                            interaction,
                            "There are no songs in the queue to shuffle.",
                            client,
                        );
                    }

                    const isFairPlay = (await guildPlayer.getData?.("fairplay")) || guildPlayer.get?.("fairplay");
                    if (isFairPlay) {
                        return await oops(
                            interaction,
                            "The queue cannot be shuffled while FairPlay is enabled.",
                            client,
                        );
                    }

                    await guildPlayer.queue.shuffle();

                    const embed = new EmbedBuilder()
                        .setColor(primaryColor)
                        .setDescription(
                            `${client.emojiList.shuffle} | **Successfully shuffled the queue** (\`${queueTracks.length}\` songs).`,
                        )
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }
            }
        } catch (err) {
            (client.logger || require("../../utils/logger")).error("[SETUP_BUTTONS] Error executing button action:", err);
            return await oops(
                interaction,
                "An unexpected error occurred while executing this button action.",
                client,
            );
        }
    },
};
