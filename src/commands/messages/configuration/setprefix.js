const {
    EmbedBuilder, PermissionFlagsBits
} = require("discord.js");

module.exports = {
    name: "setprefix",
    description: "Set the bot's prefix for this server.",
    usage: "<prefix>",
    category: "configuration",
    aliases: ["prefix"],
    permissions: {
        user: [PermissionFlagsBits.ManageGuild],
    },
    run: async (message, args, client, prefix) => {
        if (!args[0]) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `**${client.emojiList.cross} | Please provide a new prefix. Usage: \`${prefix}setprefix <prefix>\`**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }

        let newPrefix = args[0];

        if (newPrefix === prefix) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `**${client.emojiList.cross} | The new prefix cannot be the same as the current prefix.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }

        if (newPrefix.length > 5) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `**${client.emojiList.cross} | The prefix cannot be longer than *5* characters.**`,
                );

            return message.reply({
                embeds: [emb]
            });
        }

        try {
            const defaultPrefix = client.config?.bot?.prefix || client.prefix || "r!";
            if (newPrefix === defaultPrefix || newPrefix.toLowerCase() === "reset") {
                await client.database.setPrefix(message.guild.id, defaultPrefix);

                let emb = new EmbedBuilder()
                    .setColor(client?.color?.hex ?? "#FF66C4")
                    .setDescription(
                        `**${client.emojiList.tick} | The prefix has been reset to the default prefix \`${defaultPrefix}\`.**`,
                    );

                return message.reply({
                    embeds: [emb]
                });
            } else {
                await client.database.setPrefix(message.guild.id, newPrefix);

                let emb = new EmbedBuilder()
                    .setColor(client?.color?.hex ?? "#FF66C4")
                    .setDescription(
                        `**${client.emojiList.tick} | The prefix has been updated to \`${newPrefix}\`.**`,
                    );

                return message.reply({
                    embeds: [emb]
                });
            }
        } catch (err) {
            console.error(`[ SetPrefix Error ]`, err);

            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | An error occurred while setting the prefix.`,
                );

            return message.reply({
                embeds: [emb]
            });
        }
    }
};
