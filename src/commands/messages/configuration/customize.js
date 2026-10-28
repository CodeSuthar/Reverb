const {
    PermissionFlagsBits, MessageFlags
} = require("discord.js");
const {
    buildCustomizeView, attachCustomizeCollector
} = require("../../../utils/buildCustomizeView");

module.exports = {
    name: "customize",
    description: "Personalize the bot's appearance and profile for this server.",
    usage: "",
    category: "configuration",
    aliases: ["customise"],
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
    run: async (message, args, client, prefix) => {
        const view = buildCustomizeView({ client, guild: message.guild });

        const replyMessage = await message.reply({
            components: view.components,
            flags: MessageFlags.IsComponentsV2,
        });

        attachCustomizeCollector({
            message: replyMessage,
            client,
            authorId: message.author.id,
            timeout: 300000,
        });
    },
};
