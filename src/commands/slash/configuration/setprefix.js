const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const prefixSchema = require("../../../schema/prefix.schema");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("setprefix")
        .setDescription("Set the bot's prefix for this server.")
        .addStringOption((option) => option
            .setName("prefix")
            .setDescription("The new prefix for the bot.")
            .setMaxLength(5)
            .setRequired(true)
        ),
    run: async (client, interaction) => {
        await interaction.deferReply();

        let prefix = client.prefix;
        let data = await prefixSchema.findOne({ _id: interaction.guildId });
        if (data && data.prefix) prefix = data.prefix;

        if (!interaction.member.permissions.has("ManageGuild")) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | You need the \`Manage Server\` permission to use this command.`,
                );

            return await interaction.editReply({
                embeds: [emb]
            });
        }

        let newPrefix = interaction.options.getString("prefix");

        if (newPrefix === prefix) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | The new prefix cannot be the same as the current prefix.`,
                );

            return await interaction.editReply({
                embeds: [emb]
            });
        }

        try {
            if (!data) {
                const newData = new prefixSchema({
                    _id: interaction.guildId,
                    prefix: newPrefix,
                });
                await newData.save();

                let emb = new EmbedBuilder()
                    .setColor("#FF66C4")
                    .setDescription(
                        `${client.emojiList.tick} | The prefix has been set to \`${newPrefix}\`.`,
                    );

                return await interaction.editReply({
                    embeds: [emb]
                });
            } else {
                if (newPrefix === client.prefix) {
                    await prefixSchema.deleteOne({ _id: interaction.guildId })

                    let emb = new EmbedBuilder()
                        .setColor("#FF66C4")
                        .setDescription(
                            `${client.emojiList.tick} | The prefix has been reset to the default prefix \`${client.prefix}\`.`,
                        );

                    return await interaction.editReply({
                        embeds: [emb]
                    });
                } else {
                    data.prefix = newPrefix;
                    await data.save();

                    let emb = new EmbedBuilder()
                        .setColor("#FF66C4")
                        .setDescription(
                            `${client.emojiList.tick} | The prefix has been updated to \`${newPrefix}\`.`,
                        );
                        
                    return await interaction.editReply({
                        embeds: [emb]
                    });
                }
            }
        } catch (err) {
            console.dir(err, { depth: null });

            if (err.errors) {
                console.dir(err.errors, { depth: null });
            }

            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | An error occurred while setting the prefix.`,
                );

            return await interaction.editReply({
                embeds: [emb]
            });
        }
    }
}
