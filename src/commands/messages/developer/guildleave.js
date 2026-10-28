const {
    EmbedBuilder
} = require("discord.js");

module.exports = {
    name: "guildleave",
    description: "Force the bot to leave a specified server.",
    usage: "<guildId>",
    category: "developer",
    developerOnly: true,
    aliases: ["gl", "leaveserver", "guildkick"],
    run: async (message, args, client, prefix) => {
        const guildId = args[0]?.trim();

        if (!guildId) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **Please provide the guild ID.**\nUsage: \`${prefix}guildleave <guildId>\``,
                );

            return message.reply({ embeds: [emb] });
        }

        try {
            let targetGuild = null;

            if (client.shard) {
                try {
                    const results = await client.shard.broadcastEval(
                        (c, { gId }) => {
                            const g = c.guilds.cache.get(gId);
                            return g ? { id: g.id, name: g.name, memberCount: g.memberCount } : null;
                        },
                        { context: { gId: guildId } },
                    );
                    targetGuild = results.find((g) => g !== null);
                } catch {
                    const g = client.guilds.cache.get(guildId);
                    targetGuild = g ? { id: g.id, name: g.name, memberCount: g.memberCount } : null;
                }
            } else {
                const g = client.guilds.cache.get(guildId) || (await client.guilds.fetch(guildId).catch(() => null));
                targetGuild = g ? { id: g.id, name: g.name, memberCount: g.memberCount } : null;
            }

            if (!targetGuild) {
                const emb = new EmbedBuilder()
                    .setColor("Red")
                    .setDescription(
                        `${client.emojiList.cross} | **Guild not found.** Make sure the bot is currently in the server with ID \`${guildId}\`.`,
                    );

                return message.reply({ embeds: [emb] });
            }

            // Perform guild leave across shard or local
            if (client.shard) {
                await client.shard.broadcastEval(
                    async (c, { gId }) => {
                        const g = c.guilds.cache.get(gId);
                        if (g) await g.leave();
                    },
                    { context: { gId: guildId } },
                );
            } else {
                const g = client.guilds.cache.get(guildId) || (await client.guilds.fetch(guildId).catch(() => null));
                if (g) await g.leave();
            }

            const emb = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setDescription(
                    `${client.emojiList.tick} | **Successfully left \`${targetGuild.name}\`!**`,
                )
                .addFields([
                    {
                        name: "Server Name",
                        value: `\`${targetGuild.name}\``,
                        inline: true,
                    },
                    {
                        name: "Guild ID",
                        value: `\`${targetGuild.id}\``,
                        inline: true,
                    },
                    {
                        name: "Member Count",
                        value: `\`${targetGuild.memberCount ?? "Unknown"}\``,
                        inline: true,
                    },
                ])
                .setTimestamp();

            return message.reply({ embeds: [emb] });
        } catch (err) {
            console.error("Error leaving guild:", err);
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **An error occurred while leaving the server:** ${err.message || err}`,
                );

            return message.reply({ embeds: [emb] });
        }
    },
};
