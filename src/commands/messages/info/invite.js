const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const githubRepositoryUrl = "https://github.com/CodeSuthar/Reverb";

module.exports = {
    name: "invite",
    description: "Get the invite link and support server for the bot.",
    usage: "",
    category: "info",
    aliases: ["inv", "addbot", "support"],
    run: async (message, args, client, prefix) => {
        const botName = client?.config?.bot?.name || client?.user?.username || "Reverb";
        const inviteUrl = client.config.bot.invite ||
            `https://discord.com/oauth2/authorize?client_id=${client.user?.id || client.config.bot.clientId}&permissions=8&scope=bot%20applications.commands`;

        const supportUrl = client.config.bot.supportServer || "https://discord.gg/6UwVYHu2zu";

        const inviteButton = new ButtonBuilder()
            .setLabel(`Invite ${botName}`)
            .setStyle(ButtonStyle.Link)
            .setURL(inviteUrl);

        const supportButton = new ButtonBuilder()
            .setLabel("Support Server")
            .setStyle(ButtonStyle.Link)
            .setURL(supportUrl);

        const githubButton = new ButtonBuilder()
            .setLabel("GitHub Repository")
            .setStyle(ButtonStyle.Link)
            .setURL(githubRepositoryUrl);

        const row = new ActionRowBuilder().addComponents(inviteButton, supportButton, githubButton);

        const embed = new EmbedBuilder()
            .setColor(client?.color?.hex ?? "#FF66C4")
            .setAuthor({
                name: `Invite ${botName}`,
                iconURL: client.user.displayAvatarURL({ dynamic: true }),
            })
            .setDescription(
                `${client.emojiList.hey} | **Thanks for choosing ${botName}!**\n\n` +
                `Click the buttons below to invite the bot to your Discord servers, join our community support server, or contribute to our open-source codebase.`,
            )
            .addFields([
                {
                    name: "Bot Invite",
                    value: `[Direct Invite Link](${inviteUrl})`,
                    inline: true,
                },
                {
                    name: "Support Server",
                    value: `[Community Support](${supportUrl})`,
                    inline: true,
                },
                {
                    name: "GitHub Repository",
                    value: `[Source Code](${githubRepositoryUrl})`,
                    inline: true,
                },
            ])
            .setFooter({
                text: `Requested by ${message.author.tag || message.author.username}`,
                iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setTimestamp();

        return message.reply({ embeds: [embed], components: [row] });
    },
};
