const {
    EmbedBuilder
} = require("discord.js");

module.exports = {
    name: "deleteinvites",
    description: "Delete all invite links created by the bot in a specified server.",
    usage: "<guildId>",
    category: "developer",
    developerOnly: true,
    aliases: ["destroyinvites", "di"],
    run: async (message, args, client, prefix) => {
        const guildId = args[0]?.trim();

        if (!guildId) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **Please provide the guild ID.**\nUsage: \`${prefix}deleteinvites <guildId>\``,
                );

            return message.reply({ embeds: [emb] });
        }

        try {
            const guild = client.guilds.cache.get(guildId) || (await client.guilds.fetch(guildId).catch(() => null));

            if (!guild) {
                const emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `${client.emojiList.cross} | **Guild not found.** Make sure the bot is currently in the server with ID \`${guildId}\`.`,
                    );

                return message.reply({ embeds: [emb] });
            }

            const invites = await guild.invites.fetch().catch(() => null);
            if (!invites) {
                const emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `${client.emojiList.cross} | **Missing permissions to fetch invites in \`${guild.name}\`.**`,
                    );

                return message.reply({ embeds: [emb] });
            }

            // Filter invites created by this bot
            const botInvites = invites.filter((invite) => invite.inviterId === client.user.id);

            if (botInvites.size === 0) {
                const emb = new EmbedBuilder()
                    .setColor(client?.color?.hex ?? "#FF66C4")
                    .setDescription(
                        `${client.emojiList.note} | **No active invite links created by this bot were found in \`${guild.name}\`.**`,
                    );

                return message.reply({ embeds: [emb] });
            }

            const deleteCount = botInvites.size;
            await Promise.all(botInvites.map((invite) => invite.delete("Developer Cleanup").catch(() => null)));

            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **Successfully deleted \`${deleteCount}\` invite link${deleteCount === 1 ? "" : "s"} created by this bot in \`${guild.name}\`.**`,
                )
                .setTimestamp();

            return message.reply({ embeds: [emb] });
        } catch (err) {
            console.error("Error deleting invites:", err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **An error occurred while deleting invite links.**`,
                );

            return message.reply({ embeds: [emb] });
        }
    },
};
