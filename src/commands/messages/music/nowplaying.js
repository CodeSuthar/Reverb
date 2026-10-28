const {
    EmbedBuilder, 
    AttachmentBuilder, 
    ContainerBuilder, 
    TextDisplayBuilder, 
    SectionBuilder, 
    ThumbnailBuilder,
    ImageBuilder, 
    MediaGalleryBuilder, 
    MediaGalleryItemBuilder, 
    MessageFlags
} = require("discord.js");

const {
    convertMillisecondsToTime, 
    createProgressBar, 
    createSpotifyCard
} = require("../../../utils/musicUtils/index.js");

module.exports = {
    name: "nowplaying",
    description: "Show the currently playing music.",
    usage: "",
    category: "music",
    aliases: ["np", "current", "playing", "now", "song"],
    player: {
        active: true,
        playing: true,
    },
    run: async (message, args, client, prefix) => {
        let guildPlayer = await client.musicManager.players.get(message.guildId);


        try {
            const track = guildPlayer.current;
            const pos = guildPlayer.current.position;
            const dur = track.duration;
            const progBar = createProgressBar(pos, dur);

            let nowPlayingContainer = new ContainerBuilder()
            .setAccentColor(client?.color?.number ?? 0xFF66C4);

            let mainSection = new SectionBuilder().addTextDisplayComponents(
                new TextDisplayBuilder()
                    .setContent(`## ${client.emojiList.nowplaying} | Now Playing\n`),
                new TextDisplayBuilder()
                    .setContent(`### [${track.title}](${track.uri}) - Requested By: ${track.requester}\n\n` +
                        `${progBar.bar} \`${convertMillisecondsToTime(pos)} / ${convertMillisecondsToTime(dur)}\`\n\n`
                    ),
            );

            let attachment;
            let mediaGallery;

            if (track.artworkUrl) {
                mainSection.setThumbnailAccessory(
                    new ThumbnailBuilder()
                        .setURL(track.artworkUrl)
                        .setDescription(`Artwork for ${track.title ?? "N/A"}`)
                );

                let spotifyCard = await createSpotifyCard({
                    title: track.title,
                    artist: track.author,
                    image: track.artworkUrl,
                    start: pos,
                    end: dur,
                    border: 0,
                    overlayOpacity: 0.5,
                    blur: 3
                });

                attachment = new AttachmentBuilder()
                    .setFile(spotifyCard)
                    .setName(`spotify_card.png`)

                mediaGallery = new MediaGalleryBuilder()
                    .addItems(
                        new MediaGalleryItemBuilder()
                            .setURL("attachment://spotify_card.png")
                            .setDescription(`Spotify Card for ${track.title ?? "N/A"}`)
                        
                    );
            }

            nowPlayingContainer.addSectionComponents(mainSection);
            if (mediaGallery) nowPlayingContainer.addMediaGalleryComponents(mediaGallery);

            return message.reply({
                components: [nowPlayingContainer],
                files: attachment ? [attachment] : [],
                flags: MessageFlags.IsComponentsV2,
            });
        } catch (err) {
            console.dir(err, { depth: null });

            if (err.errors) {
                console.dir(err.errors, { depth: null });
            }

            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **An error occurred while trying to display the current track.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }
    }
}