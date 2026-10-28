const {
    SlashCommandBuilder, PermissionFlagsBits, MessageFlags
} = require("discord.js");
const {
    buildCustomizeView, attachCustomizeCollector
} = require("../../../utils/buildCustomizeView");

module.exports = {
    name: "customize",
    description: "Personalize the bot's appearance and profile for this server.",
    category: "configuration",
    slashData: new SlashCommandBuilder()
        .setName("customize")
        .setDescription("Personalize the bot's appearance and profile for this server.")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setDMPermission(false),
    player: null,
    inSameVoiceChannel: false,
    sameVoiceCheck: false,
    permissions: {
        client: [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.EmbedLinks,
        ],
        user: [PermissionFlagsBits.ManageGuild],
    },
    run: async (client, interaction) => {
        const view = buildCustomizeView({ client, guild: interaction.guild });

        const replyMessage = await interaction.reply({
            components: view.components,
            flags: MessageFlags.IsComponentsV2,
            fetchReply: true,
        });

        attachCustomizeCollector({
            message: replyMessage,
            client,
            authorId: interaction.user.id,
            timeout: 300000,
        });
    },
};
