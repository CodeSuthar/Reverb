const {
    EmbedBuilder, SlashCommandBuilder, PermissionFlagsBits
} = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("setprefix")
        .setDescription("Set the bot's prefix for this server.")
        .addStringOption((option) =>
            option
                .setName("prefix")
                .setDescription("The new prefix for the bot (max 5 chars) or 'reset'.")
                .setMaxLength(5)
                .setRequired(true)
        ),
    permissions: {
        user: [PermissionFlagsBits.ManageGuild],
    },
    run: async (client, interaction) => {
        await interaction.deferReply();

        const defaultPrefix = client.config?.bot?.prefix || client.prefix || "r!";
        let prefix = defaultPrefix;
        try {
            prefix = await client.database.getPrefix(interaction.guildId);
        } catch {
            prefix = defaultPrefix;
        }

        let newPrefix = interaction.options.getString("prefix");

        if (newPrefix === prefix) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | The new prefix cannot be the same as the current prefix.`
                );

            return await interaction.editReply({ embeds: [emb] });
        }

        try {
            if (newPrefix === defaultPrefix || newPrefix.toLowerCase() === "reset") {
                await client.database.setPrefix(interaction.guildId, defaultPrefix);

                let emb = new EmbedBuilder()
                    .setColor(client?.color?.hex ?? "#FF66C4")
                    .setDescription(
                        `${client.emojiList.tick} | The prefix has been reset to the default prefix \`${defaultPrefix}\`.`
                    );

                return await interaction.editReply({ embeds: [emb] });
            }

            await client.database.setPrefix(interaction.guildId, newPrefix);

            let emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | The prefix has been set to \`${newPrefix}\` successfully.`
                );

            return await interaction.editReply({ embeds: [emb] });
        } catch (err) {
            console.dir(err, { depth: null });

            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | An error occurred while trying to set the prefix.`
                );

            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
