const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");

const githubRepositoryUrl = "https://github.com/CodeSuthar/Reverb";

module.exports = {
    name: "about",
    description: "Learn more about Reverb, its features, and access its open-source repository.",
    usage: "",
    category: "info",
    aliases: ["ab"],
    run: async (message, args, client, prefix) => {
        const displayPrefix = prefix || client.config?.bot?.prefix || client.prefix || "r!";
        const botName = client?.config?.bot?.name || client?.user?.username || "Reverb";
        const inviteUrl = client.config.bot.invite || `https://discord.com/oauth2/authorize?client_id=${client.user?.id || client.config.bot.clientId}&permissions=281891692727632&integration_type=0&scope=bot`
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
                name: `${botName} - About`,
                iconURL: client.user.displayAvatarURL({ dynamic: true }),
            })
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .setDescription(
                `**${botName}** is a high-performance, open-source Discord music bot engineered for seamless, rich audio playback.\n\n` +
                `Built with modern **Discord.js Components V2** and the **Moonlink.js** audio engine, ${botName} provides interactive player controls, advanced audio equalizers & filters, multi-database support, and personal playlists.`,
            )
            .addFields([
                {
                    name: "Developer",
                    value: "Aditya Suthar",
                    inline: true,
                },
                {
                    name: "Version",
                    value: `\`v${client.package.version}\``,
                    inline: true,
                },
                {
                    name: "Library",
                    value: `\`Discord.js v14\` • \`Moonlink.js\``,
                    inline: true,
                },
                {
                    name: "Source Repository",
                    value: `[GitHub Repository](${githubRepositoryUrl})`,
                    inline: true,
                },
                {
                    name: "Support Server",
                    value: `[Join Support](${supportUrl})`,
                    inline: true,
                },
                {
                    name: "Prefix",
                    value: `\`${displayPrefix}\``,
                    inline: true,
                },
                {
                    name: "Key Capabilities",
                    value:
                        "• **24/7 Audio Streaming** with dedicated DJ roles\n" +
                        "• **Interactive Components V2** song-request channels\n" +
                        "• **Audio Filters & Equalizers** (8D, Bass Boost, Nightcore, Lo-Fi, etc.)\n" +
                        "• **Multi-Database Support** (SQLite, PGlite, PostgreSQL, MySQL, MongoDB)\n" +
                        "• **Personal Playlists** with song caching and instant sharing",
                    inline: false,
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
