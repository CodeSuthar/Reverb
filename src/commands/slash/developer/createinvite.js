const {
    EmbedBuilder,
    ChannelType,
    PermissionFlagsBits,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
} = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("createinvite")
        .setDescription("Generate an instant invite link for a specified server.")
        .addStringOption((opt) =>
            opt.setName("guild_id").setDescription("The ID of the server to create an invite for").setRequired(true)
        ),
    developerOnly: true,
    run: async (client, interaction) => {
        await interaction.deferReply();

        const guildId = interaction.options.getString("guild_id").trim();
        const guild = client.guilds.cache.get(guildId) || (await client.guilds.fetch(guildId).catch(() => null));

        if (!guild) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **Guild not found.** Make sure the bot is in a guild with ID \`${guildId}\`.`);

            return await interaction.editReply({ embeds: [emb] });
        }

        const me = guild.members.me || (await guild.members.fetchMe().catch(() => null));
        if (!me) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **Could not resolve the bot's membership in \`${guild.name}\`.**`);

            return await interaction.editReply({ embeds: [emb] });
        }

        const channels = await guild.channels.fetch().catch(() => null);
        if (!channels) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **Could not fetch channels for \`${guild.name}\`.**`);

            return await interaction.editReply({ embeds: [emb] });
        }

        const targetChannel = channels.find(
            (c) =>
                c &&
                c.type === ChannelType.GuildText &&
                c.permissionsFor(me)?.has(PermissionFlagsBits.CreateInstantInvite)
        );

        if (!targetChannel) {
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **Missing \`Create Instant Invite\` permission in any suitable text channel in \`${guild.name}\`.**`);

            return await interaction.editReply({ embeds: [emb] });
        }

        try {
            const invite = await targetChannel.createInvite({
                maxAge: 86400,
                maxUses: 1,
                reason: `Requested by developer ${interaction.user.tag}`,
            });

            const embed = new EmbedBuilder()
                .setColor(client?.color?.hex ?? "#FF66C4")
                .setTitle(`Invite Generated: ${guild.name}`)
                .setDescription(
                    `• **Server:** \`${guild.name}\` (ID: \`${guild.id}\`)\n` +
                    `• **Channel:** ${targetChannel} (ID: \`${targetChannel.id}\`)\n` +
                    `• **Expires In:** \`24 Hours\` (Max Uses: \`1\`)\n\n` +
                    `**Invite Link:** ${invite.url}`
                )
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setLabel("Join Server").setStyle(ButtonStyle.Link).setURL(invite.url)
            );

            return await interaction.editReply({ embeds: [embed], components: [row] });
        } catch (err) {
            console.error(err);
            let emb = new EmbedBuilder()
                .setColor("Red")
                .setDescription(`${client.emojiList.cross} | **Failed to create invite:** \`${err.message}\``);

            return await interaction.editReply({ embeds: [emb] });
        }
    },
};
