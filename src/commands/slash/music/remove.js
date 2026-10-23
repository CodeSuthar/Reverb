const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { convertMillisecondsToTime } = require("../../../utils/musicUtils/index");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("remove")
        .setDescription("Remove a song from the queue.")
        .addIntegerOption((opt) =>
            opt.setName("song").setDescription("Position of the song to remove (1-based)").setRequired(true).setMinValue(1)
        ),
    player: {
        voice: true,
        active: true,
        sameVoice: true,
        dj: true,
    },
    run: async (client, interaction) => {
        await interaction.deferReply();
        const guildPlayer = await client.musicManager.players.get(interaction.guildId);

        if (!guildPlayer.queue.tracks.length) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **There are no songs in the queue to remove.**`);
            return await interaction.editReply({ embeds: [emb] });
        }

        const songNumber = interaction.options.getInteger("song");
        if (songNumber > guildPlayer.queue.tracks.length) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **Please provide a valid song number between \`1\` and \`${guildPlayer.queue.tracks.length}\`.**`
                );
            return await interaction.editReply({ embeds: [emb] });
        }

        try {
            const track = guildPlayer.queue.tracks[songNumber - 1];
            await guildPlayer.queue.remove(songNumber - 1);

            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **Removed *[${track.title}](${track.uri})* from the queue.**`
                )
                .addFields([
                    { name: "Duration", value: `\`${track.duration ? convertMillisecondsToTime(track.duration) : (track.isStream ? "Live Stream" : "Unknown")}\``, inline: true },
                    { name: "Position", value: `\`${songNumber}\``, inline: true },
                    { name: "Requester", value: `${track.requester || interaction.member}`, inline: true },
                ])
                .setTimestamp();

            if (track.artworkUrl) emb.setThumbnail(track.artworkUrl);

            return await interaction.editReply({ embeds: [emb] });
        } catch (err) {
            console.error(err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **An error occurred while trying to \`remove\` the song.**`);
            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
