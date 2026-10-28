
const {
    EmbedBuilder, 
    PermissionFlagsBits
} = require("discord.js");

const {
    checkIfURIIsYoutubeBased,
    checkIfSearchResultIsPlaylist,
    convertMillisecondsToTime,
} = require("../../../utils/musicUtils/index");

module.exports = {
    name: "playnext",
    description: "Play a song next in the queue.",
    usage: "<song name or URL>",
    category: "music",
    aliases: ["pn", "playn"],
    permissions: {
        client: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
    },
    player: {
        voice: true,
        sameVoice: true,
    },
    run: async (message, args, client, prefix) => {
        let guildPlayer = await client.musicManager.players.get(message.guildId);
        
        if (!args.length) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **Please provide a song name or URL to play next.\nUsage: \`${prefix}playnext <song name or URL>\`**`,
                );

            return message.reply({
                embeds: [emb],
            });
        }

        if (guildPlayer) {
            const isFairPlay = (await guildPlayer.getData?.("fairplay")) || guildPlayer.get?.("fairplay");
            if (isFairPlay) {
                let emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `${client.emojiList.cross} | **Songs cannot be inserted into the front of the queue while FairPlay is enabled. Please use the \`play\` command to add tracks fairly.**`,
                    );

                return message.reply({
                    embeds: [emb],
                });
            }
        }

        let voiceChannelToJoin = message.member.voice.channel;

        try {
            if (!guildPlayer) {
                guildPlayer = await client.musicManager.players.create({
                    guildId: message.guildId,
                    voiceChannelId: voiceChannelToJoin.id,
                    textChannelId: message.channelId
                });

                if (!guildPlayer.connected) await guildPlayer.connect();
            }

            let songQuery = args.join(" ");

            if (checkIfURIIsYoutubeBased(songQuery) && !client.config.music.playYoutube) {
                let emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `${client.emojiList.cross} | **Unfortunately, due to recent demand from both YouTube and Discord, I am unable to play music from YouTube at this time. Please use a different source for your music.**`,
                    )
                    .addFields([
                        {
                            name: "Alternative Sources",
                            value:
                                "**You can use sources like Spotify, SoundCloud, or other supported platforms to play music.**",
                            inline: false,
                        },
                    ]);

                return message.reply({
                    embeds: [emb],
                });
            }

            let searchResult = await client.musicManager.search({
                query: songQuery,
                requester: message.author
            });

            if (!searchResult || !searchResult.tracks.length) {
                let emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `${client.emojiList.cross} | No results found for \`${songQuery}\`.`,
                    );

                return message.reply({
                    embeds: [emb],
                });
            }

            if (checkIfSearchResultIsPlaylist(searchResult)) {
                let msg = await message.reply({
                    content: `${client.emojiList.loading} | Adding **${searchResult.tracks.length} songs** from the playlist \`${searchResult.playlistInfo.name}\` to play next.`,
                });

                let playlistDuration = searchResult.tracks.reduce((acc, track) => acc + track.duration, 0);

                await guildPlayer.queue.insert(0, searchResult.tracks);

                if (!guildPlayer.playing || guildPlayer.paused) await guildPlayer.play({ paused: false });

                let emb = new EmbedBuilder()
                    .setColor(client?.color?.hex ?? "#FF66C4")
                    .setDescription(
                        `${client.emojiList.tick} | **Added *${searchResult.tracks.length}* songs from the playlist *${searchResult.playlistInfo.name}* to play next.**`,
                    )
                    .addFields([
                        {
                            name: "Playlist Duration",
                            value: `\`${convertMillisecondsToTime(playlistDuration)}\``,
                            inline: true,
                        },
                        {
                            name: "Tracks Added",
                            value: `\`${searchResult.tracks.length}\``,
                            inline: true,
                        },
                        {
                            name: "Requester",
                            value: `${message.member}`,
                            inline: true,
                        },
                    ])
                    .setTimestamp();

                // thumbnail code comments omitted...
                return msg.edit({
                    content: null,
                    embeds: [emb]
                });
            } else {
                let track = searchResult.tracks[0];

                await guildPlayer.queue.insert(0, track);
                
                if (!guildPlayer.playing || guildPlayer.paused) await guildPlayer.play({ paused: false });

                let emb = new EmbedBuilder()
                    .setColor(client?.color?.hex ?? "#FF66C4")
                    .setDescription(
                        `${client.emojiList.tick} | **Added *[${track.title}](${track.uri})* to play next.**`,
                    )
                    .addFields([
                        {
                            name: "Duration",
                            value: `\`${track.duration ? `${convertMillisecondsToTime(track.duration)}` : isStream ? `${client.emojiList?.livestream} Live Stream ]` : "Unknown Duration"}\``,
                            inline: true,
                        },
                        {
                            name: "Requester",
                            value: `${message.member}`,
                            inline: true,
                        },
                    ])
                    .setTimestamp();

                if (track.artworkUrl) emb.setThumbnail(track.artworkUrl);

                return message.reply({
                    embeds: [emb]
                });
            }
        } catch (err) {
            console.dir(err, { depth: null });

            if (err.errors) {
                console.dir(err.errors, { depth: null });
            }

            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **An error occurred while trying to add the song to play next.**`,
                );

            return message.reply({
                embeds: [emb],
            });
        }
    }
};