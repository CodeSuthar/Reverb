const util = require("util");
const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    AttachmentBuilder,
    ComponentType,
    SlashCommandBuilder,
} = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("eval")
        .setDescription("Execute JavaScript code directly in the bot context.")
        .addStringOption((opt) =>
            opt.setName("code").setDescription("The JavaScript code to execute").setRequired(true)
        ),
    developerOnly: true,
    run: async (client, interaction) => {
        await interaction.deferReply();

        const code = interaction.options.getString("code").trim();
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

        // Sanitize sensitive tokens
        const tokenRegex = new RegExp(client.token, "gi");
        evaled = evaled.replace(tokenRegex, "[REDACTED TOKEN]");

        const embed = new EmbedBuilder()
            .setColor(isError ? "Red" : (client?.color?.hex ?? "#FF66C4"))
            .setTitle(isError ? "Evaluation Error" : "Evaluation Success")
            .addFields([
                { name: "Execution Time", value: `\`${executionMs}ms\``, inline: true },
                { name: "Type", value: `\`${typeof evaled}\``, inline: true },
            ])
            .setTimestamp();

        if (evaled.length <= 1000) {
            embed.setDescription(`\`\`\`js\n${evaled}\n\`\`\``);
            return await interaction.editReply({ embeds: [embed] });
        } else {
            const attachment = new AttachmentBuilder(Buffer.from(evaled, "utf8"), {
                name: "eval_output.txt",
            });
            embed.setDescription("Output too long to display inline. See attached file.");
            return await interaction.editReply({ embeds: [embed], files: [attachment] });
        }
    },
};
