const util = require("util");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    AttachmentBuilder,
    ComponentType,
} = require("discord.js");

const ACCENT_COLOR = 0xFF66C4;

module.exports = {
    name: "eval",
    description: "Execute JavaScript code directly in the bot context.",
    usage: "<code>",
    category: "developer",
    developerOnly: true,
    aliases: ["ev"],
    run: async (message, args, client, prefix) => {
        const code = args.join(" ").trim();

        if (!code) {
            const emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(
                    `${client.emojiList.cross} | **Please provide code to evaluate.**\nUsage: \`${prefix}eval <code>\``,
                );

            return message.reply({ embeds: [emb] });
        }

        const startTime = process.hrtime.bigint();
        let evaled;
        let isError = false;

        try {
            evaled = await eval(code);

            if (typeof evaled !== "string") {
                evaled = util.inspect(evaled, { depth: 1 });
            }
        } catch (err) {
            evaled = err.stack || String(err);
            isError = true;
        }

        const endTime = process.hrtime.bigint();
        const executionMs = (Number(endTime - startTime) / 1_000_000).toFixed(2);

        // Redact common sensitive credentials
        const secrets = [
            client.token,
            client.config?.bot?.token,
            client.config?.bot?.clientSecret,
            process.env.CLIENT_TOKEN,
            process.env.CLIENT_SECRET,
            process.env.DATABASE_URL,
            process.env.MONGO_URI,
            process.env.POSTGRES_URL,
            process.env.MYSQL_URL,
        ].filter(Boolean);

        for (const secret of secrets) {
            evaled = evaled.replaceAll(secret, "[REDACTED_SECRET]");
        }

        const deleteButton = new ButtonBuilder()
            .setCustomId("eval_delete")
            .setLabel("Delete Output")
            .setStyle(ButtonStyle.Secondary)
            .setEmoji(client.emojiList.cross);

        const row = new ActionRowBuilder().addComponents(deleteButton);

        let replyMessage;

        if (evaled.length > 1900) {
            const buffer = Buffer.from(evaled, "utf-8");
            const attachment = new AttachmentBuilder(buffer, { name: "eval-output.txt" });

            const emb = new EmbedBuilder()
                .setColor(isError ? "Red" : (client?.color?.hex ?? "#FF66C4"))
                .setTitle(`${isError ? client.emojiList.cross : client.emojiList.tick} Evaluation ${isError ? "Error" : "Result"}`)
                .setDescription(
                    `*Execution time: \`${executionMs}ms\`*\n` +
                    `Output was too large for Discord message limits (\`${evaled.length}\` characters). Attached as file.`,
                )
                .setTimestamp();

            replyMessage = await message.reply({
                embeds: [emb],
                files: [attachment],
                components: [row],
            });
        } else {
            const emb = new EmbedBuilder()
                .setColor(isError ? "Red" : (client?.color?.hex ?? "#FF66C4"))
                .setTitle(`${isError ? client.emojiList.cross : client.emojiList.tick} Evaluation ${isError ? "Error" : "Result"}`)
                .setDescription(`\`\`\`js\n${evaled}\n\`\`\``)
                .setFooter({ text: `Execution time: ${executionMs}ms` })
                .setTimestamp();

            replyMessage = await message.reply({
                embeds: [emb],
                components: [row],
            });
        }

        const collector = replyMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 60_000,
            filter: (interaction) => interaction.user.id === message.author.id,
        });

        collector.on("collect", async (interaction) => {
            if (interaction.customId === "eval_delete") {
                await replyMessage.delete().catch(() => null);
                collector.stop("deleted");
            }
        });

        collector.on("end", async (_collected, reason) => {
            if (reason !== "deleted") {
                deleteButton.setDisabled(true);
                await replyMessage.edit({ components: [new ActionRowBuilder().addComponents(deleteButton)] }).catch(() => null);
            }
        });

        return replyMessage;
    },
};
