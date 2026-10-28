const {
    EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder
} = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("about")
        .setDescription("Learn more about the bot and its creators."),
    run: async (client, interaction) => {
        await interaction.deferReply();

        const botName = client?.config?.bot?.name || client?.user?.username || "Reverb";

        const embed = new EmbedBuilder()
            .setColor(client?.color?.hex ?? "#FF66C4")
            .setAuthor({
                name: `About ${botName}`,
                iconURL: client.user.displayAvatarURL({ dynamic: true }),
            })
            .setDescription(
                `**${botName}** is a high-performance, feature-packed Discord music bot powered by Lavalink/NodeLink v4 and Moonlink.js.\n\n` +
                `• **Multi-Database Support:** SQLite, PostgreSQL, and PGlite.\n` +
                `• **High Audio Fidelity:** 24-bit audio processing with custom equalizer filters.\n` +
                `• **Modern Discord UI:** Containers, progress bars, interactive buttons, and select menus.`
            )
            .setFooter({ text: "Made with passion for high quality music." })
            .setTimestamp();

        const inviteUrl = client?.config?.bot?.invite || `https://discord.com/oauth2/authorize?client_id=${client.user?.id || client?.config?.bot?.clientId}&permissions=281891692735824&scope=bot%20applications.commands`;
        const supportUrl = client?.config?.bot?.supportServer || "https://discord.gg/6UwVYHu2zu";

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel(`Invite ${botName}`)
                .setStyle(ButtonStyle.Link)
                .setURL(inviteUrl),
            new ButtonBuilder()
                .setLabel("Support Server")
                .setStyle(ButtonStyle.Link)
                .setURL(supportUrl),
            new ButtonBuilder()
                .setLabel("GitHub")
                .setStyle(ButtonStyle.Link)
                .setURL("https://github.com/CodeSuthar/Reverb")
        );

        return await interaction.editReply({
            embeds: [embed],
            components: [row],
        });
    },
};
