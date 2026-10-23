const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("guildleave")
        .setDescription("Force the bot to leave a specified server.")
        .addStringOption((opt) =>
            opt.setName("guild_id").setDescription("The ID of the server to leave").setRequired(true)
        ),
    developerOnly: true,
    run: async (client, interaction) => {
        await interaction.deferReply();

        const guildId = interaction.options.getString("guild_id").trim();
        const guild = client.guilds.cache.get(guildId) || (await client.guilds.fetch(guildId).catch(() => null));

        if (!guild) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **Guild not found.** Make sure the bot is in a guild with ID \`${guildId}\`.`);

            return await interaction.editReply({ embeds: [emb] });
        }

        try {
            const guildName = guild.name;
            await guild.leave();

            let emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(`${client.emojiList.tick} | **Successfully left server:** \`${guildName}\` (\`${guildId}\`).`);

            return await interaction.editReply({ embeds: [emb] });
        } catch (err) {
            console.error(err);
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **Failed to leave server:** \`${err.message}\``);

            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
