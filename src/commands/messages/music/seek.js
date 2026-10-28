const {
    EmbedBuilder
} = require("discord.js");

const {
    parseTime,
    convertMillisecondsToTime,
    createProgressBar,
} = require("../../../utils/musicUtils/index");

module.exports = {
    name: "seek",
    description: "Seek to a specific position in the current song or relative to the current position.",
    usage: "<[+|-]duration | ahead <time> | behind <time>>",
    category: "music",
    aliases: ["ff", "rwd", "forward", "rewind"],
    player: {
        voice: true,
        active: true,
        sameVoice: true,
        playing: true,
        dj: true,
    },
    run: async (message, args, client, prefix) => {
        let guildPlayer = await client.musicManager.players.get(message.guildId);

        let track = guildPlayer.current;
        let currentPosition =
            (typeof guildPlayer.position === "number"
                ? guildPlayer.position
                : guildPlayer.current?.position) ?? 0;

        // Dynamic status: if no arguments provided, show current playback position and progress bar (like volume)
        if (!args.length) {
            let prog = createProgressBar(currentPosition, track.duration);
            let emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `**Current playback position in *[${track.title}](${track.uri})*:**\n\n` +
                    `${prog.bar} \`${convertMillisecondsToTime(currentPosition)} / ${convertMillisecondsToTime(track.duration)}\`\n\n` +
                    `*Use \`${prefix}seek <time>\` (e.g. \`${prefix}seek 1:30\`, \`+30s\`, \`-20s\`) to seek.*`,
                );

            if (track.artworkUrl) emb.setThumbnail(track.artworkUrl);

            return message.reply({
                embeds: [emb],
            });
        }

        if (!track.isSeekable || track.isStream) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **The current song cannot be seeked.**`,
                );

            return message.reply({
                embeds: [emb],
            });
        }

        let durationInput = args.join(" ");
        let parsed = parseTime(durationInput, currentPosition);

        if (!parsed) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **Invalid duration format.**\n` +
                    `You can seek using absolute or relative time:\n` +
                    `• **Absolute:** \`${prefix}seek 1:30\`, \`${prefix}seek 90s\`\n` +
                    `• **Ahead / Forward:** \`${prefix}seek +30s\`, \`${prefix}seek ahead 1m\`\n` +
                    `• **Behind / Rewind:** \`${prefix}seek -20s\`, \`${prefix}seek rewind 15s\``,
                );

            return message.reply({
                embeds: [emb],
            });
        }

        let targetPosition = parsed.targetMs;

        if (targetPosition > track.duration) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **The duration exceeds the song's length of \`${convertMillisecondsToTime(track.duration)}\`.**`,
                );

            return message.reply({
                embeds: [emb],
            });
        }

        // Already at target position
        if (Math.abs(targetPosition - currentPosition) < 1000) {
            let emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **The song is already playing at \`${convertMillisecondsToTime(currentPosition)}\`.**`,
                );

            return message.reply({
                embeds: [emb],
            });
        }

        try {
            await guildPlayer.seek(targetPosition);

            let isAhead = targetPosition > currentPosition;
            let delta = Math.abs(targetPosition - currentPosition);
            let emoji = isAhead
                ? client.emojiList.seekforward
                : client.emojiList.seekback;
            let actionText = isAhead ? "ahead to" : "behind to";
            let deltaText = isAhead
                ? `(+${convertMillisecondsToTime(delta)} ahead)`
                : `(-${convertMillisecondsToTime(delta)} behind)`;

            let prog = createProgressBar(targetPosition, track.duration);

            let emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${emoji} | **Successfully seeked ${actionText} \`${convertMillisecondsToTime(targetPosition)}\` ${deltaText} in *[${track.title}](${track.uri})*.**`,
                )
                .addFields([
                    {
                        name: "Position",
                        value: `\`${convertMillisecondsToTime(currentPosition)}\` ➔ \`${convertMillisecondsToTime(targetPosition)}\``,
                        inline: true,
                    },
                    {
                        name: "Duration",
                        value: `\`${convertMillisecondsToTime(track.duration)}\``,
                        inline: true,
                    },
                    {
                        name: "Seeked By",
                        value: `${message.member}`,
                        inline: true,
                    },
                    {
                        name: "Progress",
                        value: `${prog.bar}`,
                        inline: false,
                    },
                ])
                .setTimestamp();

            if (track.artworkUrl) emb.setThumbnail(track.artworkUrl);

            return message.reply({
                embeds: [emb],
            });
        } catch (err) {
            console.dir(err, { depth: null });

            if (err.errors) {
                console.dir(err.errors, { depth: null });
            }

            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **An error occurred while trying to \`seek\` the song.**`,
                );

            return message.reply({
                embeds: [emb],
            });
        }
    },
};
