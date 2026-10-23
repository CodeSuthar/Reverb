const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    OAuth2Scopes,
    PermissionFlagsBits,
    SlashCommandBuilder,
} = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("invite")
        .setDescription("Get the bot's invite link and official support server."),
    run: async (client, interaction) => {
        await interaction.deferReply();

        const inviteUrl = client?.config?.bot?.invite || client.generateInvite({
            scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
            permissions: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.AttachFiles,
                PermissionFlagsBits.ReadMessageHistory,
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak,
                PermissionFlagsBits.ManageChannels,
            ],
        });

        const botName = client?.config?.bot?.name || client?.user?.username || "Reverb";

        const embed = new EmbedBuilder()
            .setColor(client?.color?.hex ?? "#FF66C4")
            .setAuthor({
                name: `Invite ${botName}`,
                iconURL: client.user.displayAvatarURL({ dynamic: true }),
            })
            .setDescription(
                `Click the button below to invite **${botName}** to your Discord server, or join our community support server for help!`
            )
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("Invite Bot")
                .setStyle(ButtonStyle.Link)
                .setURL(inviteUrl)
        );

        if (client?.config?.bot?.supportServer) {
            row.addComponents(
                new ButtonBuilder()
                    .setLabel("Support Server")
                    .setStyle(ButtonStyle.Link)
                    .setURL(client.config.bot.supportServer)
            );
        }

        return await interaction.editReply({
            embeds: [embed],
            components: [row],
        });
    },
};
