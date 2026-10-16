const { EmbedBuilder } = require("discord.js");
const prefixSchema = require("../../../schema/prefix.schema");

module.exports = {
    name: "setprefix",
    description: "Set the bot's prefix for this server.",
    usage: "<prefix>",
    category: "configuration",
    aliases: ["prefix"],
    run: async (message, args, client, prefix) => {
        if (!message.member.permissions.has("ManageGuild")) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | You need the \`Manage Server\` permission to use this command.`,
                );

            return message.reply({
                embeds: [emb]
            });
        }

        if (!args[0]) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | Please provide a new prefix. Usage: \`${prefix}setprefix <prefix>\``,
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
                    `${client.emojiList.cross} | The new prefix cannot be the same as the current prefix.`,
                );

            return message.reply({
                embeds: [emb]
            });
        }

        if (newPrefix.length > 5) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | The prefix cannot be longer than 5 characters.`,
                );

            return message.reply({
                embeds: [emb]
            });
        }

        let data = await prefixSchema.findOne({ _id: message.guild.id });

        try {
            if (!data) {
                const newData = new prefixSchema({
                    _id: message.guild.id,
                    prefix: newPrefix,
                });
                await newData.save();

                let emb = new EmbedBuilder()
                    .setColor("#FF66C4")
                    .setDescription(
                        `${client.emojiList.tick} | The prefix has been set to \`${newPrefix}\`.`,
                    );

                return message.reply({
                    embeds: [emb]
                });
            } else {
                if (newPrefix === client.prefix) {
                    await prefixSchema.deleteOne({ _id: message.guild.id })

                    let emb = new EmbedBuilder()
                        .setColor("#FF66C4")
                        .setDescription(
                            `${client.emojiList.tick} | The prefix has been reset to the default prefix \`${client.prefix}\`.`,
                        );

                    return message.reply({
                        embeds: [emb]
                    });
                }

                data.prefix = newPrefix;
                await data.save();

                let emb = new EmbedBuilder()
                    .setColor("#FF66C4")
                    .setDescription(
                        `${client.emojiList.tick} | The prefix has been updated to \`${newPrefix}\`.`,
                    );

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
                    `${client.emojiList.cross} | An error occurred while setting the prefix.`,
                );

            return message.reply({
                embeds: [emb]
            });
        }
    }
}