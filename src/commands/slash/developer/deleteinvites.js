const {
    EmbedBuilder, SlashCommandBuilder
} = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("deleteinvites")
        .setDescription("Delete all invite links created by the bot in a specified server.")
        .addStringOption((opt) =>
            opt.setName("guild_id").setDescription("The ID of the server").setRequired(true)
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
            const invites = await guild.invites.fetch().catch(() => null);
            if (!invites) {
                let emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(`${client.emojiList.cross} | **Missing permissions to fetch invites in \`${guild.name}\`.**`);

                return await interaction.editReply({ embeds: [emb] });
            }

            const botInvites = invites.filter((inv) => inv.inviterId === client.user.id);
            if (botInvites.size === 0) {
                let emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(`${client.emojiList.cross} | **No active invites created by this bot were found in \`${guild.name}\`.**`);

                return await interaction.editReply({ embeds: [emb] });
            }

            let deletedCount = 0;
            for (const invite of botInvites.values()) {
                await invite.delete("Developer requested invite deletion.").catch(() => null);
                deletedCount++;
            }

            let emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(`${client.emojiList.tick} | **Successfully deleted \`${deletedCount}\` invite(s) created by the bot in \`${guild.name}\`.**`);

            return await interaction.editReply({ embeds: [emb] });
        } catch (err) {
            console.error(err);
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **An error occurred while deleting invites:** \`${err.message}\``);

            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
