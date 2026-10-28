const {
    ContainerBuilder,
    SectionBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    ThumbnailBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    MessageFlags,
    PermissionFlagsBits,
} = require("discord.js");

const accentColor = 0xFF66C4;

/**
 * Builds the Components V2 Container for the Bot Customization panel.
 *
 * @param {object} options
 * @param {import("../structures/client.js")} options.client - The Discord bot client.
 * @param {import("discord.js").Guild|null} [options.guild=null] - The Discord guild instance.
 * @param {boolean} [options.disabled=false] - Whether buttons should be disabled (e.g. after expiration).
 * @returns {{ container: ContainerBuilder, components: ContainerBuilder[], flags: number }}
 */
function buildCustomizeView({ client, guild = null, disabled = false }) {
    const accentColor = client?.color?.number ?? accentColor;
    const container = new ContainerBuilder().setAccentColor(accentColor);
    const guildName = guild?.name || "this server";
    const botAvatar =
        guild?.members?.me?.displayAvatarURL?.({ size: 256 }) ||
        client?.user?.displayAvatarURL?.({ size: 256 }) ||
        null;

    // 1. Header Section with Bot Avatar Thumbnail Accessory
    const headerText = `# Customize Me\n-# Personalize my appearance just for **${guildName}**\n\n**Choose what you'd like to customize:**`;

    if (botAvatar) {
        container.addSectionComponents(
            new SectionBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText))
                .setThumbnailAccessory(new ThumbnailBuilder().setURL(botAvatar)),
        );
    } else {
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerText));
    }

    container.addSeparatorComponents(new SeparatorBuilder());

    // 2. Sections with Side-by-Side Button Accessories
    // Section 1: Change Avatar
    container.addSectionComponents(
        new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Change My Avatar**\nUpload a custom image to give me a unique look in this server`,
                ),
            )
            .setButtonAccessory(
                new ButtonBuilder()
                    .setCustomId("customize_avatar")
                    .setLabel("Change Avatar")
                    .setEmoji(client.emojiList.avatar)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(disabled),
            ),
    );

    // Section 2: Change Banner
    container.addSectionComponents(
        new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Change My Banner**\nSet a custom banner to make my profile stand out`,
                ),
            )
            .setButtonAccessory(
                new ButtonBuilder()
                    .setCustomId("customize_banner")
                    .setLabel("Change Banner")
                    .setEmoji(client.emojiList.banner)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(disabled),
            ),
    );

    // Section 3: Change Nickname
    container.addSectionComponents(
        new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Change My Nickname**\nGive me a custom name that fits your server's vibe`,
                ),
            )
            .setButtonAccessory(
                new ButtonBuilder()
                    .setCustomId("customize_nickname")
                    .setLabel("Change Nickname")
                    .setEmoji(client.emojiList.keyboard)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(disabled),
            ),
    );

    // Section 4: Set Bio
    container.addSectionComponents(
        new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Set My Bio**\nAdd a custom bio description to my profile`,
                ),
            )
            .setButtonAccessory(
                new ButtonBuilder()
                    .setCustomId("customize_bio")
                    .setLabel("Set Bio")
                    .setEmoji(client.emojiList.book)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(disabled),
            ),
    );

    // Section 5: Reset All Customizations
    container.addSectionComponents(
        new SectionBuilder()
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Reset All Customizations**\nRestore my default appearance in this server`,
                ),
            )
            .setButtonAccessory(
                new ButtonBuilder()
                    .setCustomId("customize_reset")
                    .setLabel("Reset to Default")
                    .setEmoji(client.emojiList.trash)
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(disabled),
            ),
    );

    container.addSeparatorComponents(new SeparatorBuilder());

    // 3. Quick Tips & Expiration notice
    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
            `💡 **Quick Tips:**\n• All changes only apply to this server\n• You can change these settings anytime\n• Make sure I have the right permissions!\n\n*This panel will expire in 5 minutes*`,
        ),
    );

    return {
        container,
        components: [container],
        flags: MessageFlags.IsComponentsV2,
    };
}

/**
 * Handles button interactions and modals for the Customize panel.
 *
 * @param {object} options
 * @param {import("discord.js").Message} options.message - The reply message containing the customize panel.
 * @param {import("../structures/client.js")} options.client - The Discord bot client.
 * @param {string} options.authorId - The ID of the user who initiated the command.
 * @param {number} [options.timeout=300000] - Collector timeout in milliseconds (default: 5 minutes).
 */
function attachCustomizeCollector({ message, client, authorId, timeout = 300000 }) {
    if (!message || typeof message.createMessageComponentCollector !== "function") return;

    const collector = message.createMessageComponentCollector({ time: timeout });

    collector.on("collect", async (interaction) => {
        // Enforce user ownership (or developer bypass)
        if (interaction.user.id !== authorId && !client.developerIds?.includes(interaction.user.id)) {
            return await interaction.reply({
                content: `${client.emojiList.cross} | You cannot interact with someone else's customization panel.`,
                flags: MessageFlags.Ephemeral,
            }).catch(() => null);
        }

        const customId = interaction.customId;

        try {
            switch (customId) {
                case "customize_avatar": {
                    const modal = new ModalBuilder()
                        .setCustomId(`modal_avatar_${interaction.id}`)
                        .setTitle("Change Bot Avatar");

                    const urlInput = new TextInputBuilder()
                        .setCustomId("avatar_url")
                        .setLabel("Avatar Image URL")
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder("https://example.com/avatar.png")
                        .setRequired(true);

                    modal.addComponents(new ActionRowBuilder().addComponents(urlInput));
                    await interaction.showModal(modal);

                    const submission = await interaction
                        .awaitModalSubmit({
                            time: 120000,
                            filter: (m) => m.customId === `modal_avatar_${interaction.id}` && m.user.id === authorId,
                        })
                        .catch(() => null);

                    if (submission) {
                        const avatarUrl = submission.fields.getTextInputValue("avatar_url").trim();
                        await submission.deferReply({ flags: MessageFlags.Ephemeral });

                        try {
                            const guild = submission.guild || client.guilds.cache.get(submission.guildId);
                            await guild.members.editMe({
                                avatar: avatarUrl,
                                reason: `Server Avatar customized by ${submission.user.tag} (${submission.user.id})`,
                            });

                            await submission.editReply({
                                content: `${client.emojiList.avatar} **Server Avatar Updated!**\n> Successfully updated Reverb's server avatar for **${guild.name}**!`,
                            });
                        } catch (err) {
                            await submission.editReply({
                                content: `${client.emojiList.cross} **Failed to Update Avatar:**\n> ${err.message}`,
                            });
                        }
                    }
                    break;
                }

                case "customize_banner": {
                    const modal = new ModalBuilder()
                        .setCustomId(`modal_banner_${interaction.id}`)
                        .setTitle("Change Bot Banner");

                    const urlInput = new TextInputBuilder()
                        .setCustomId("banner_url")
                        .setLabel("Banner Image URL")
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder("https://example.com/banner.png")
                        .setRequired(true);

                    modal.addComponents(new ActionRowBuilder().addComponents(urlInput));
                    await interaction.showModal(modal);

                    const submission = await interaction
                        .awaitModalSubmit({
                            time: 120000,
                            filter: (m) => m.customId === `modal_banner_${interaction.id}` && m.user.id === authorId,
                        })
                        .catch(() => null);

                    if (submission) {
                        const bannerUrl = submission.fields.getTextInputValue("banner_url").trim();
                        await submission.deferReply({ flags: MessageFlags.Ephemeral });

                        try {
                            const guild = submission.guild || client.guilds.cache.get(submission.guildId);
                            await guild.members.editMe({
                                banner: bannerUrl,
                                reason: `Server Banner customized by ${submission.user.tag} (${submission.user.id})`,
                            });

                            await submission.editReply({
                                content: `${client.emojiList.banner} **Server Banner Updated!**\n> Successfully updated Reverb's server banner for **${guild.name}**!`,
                            });
                        } catch (err) {
                            await submission.editReply({
                                content: `${client.emojiList.cross} **Failed to Update Banner:**\n> ${err.message}`,
                            });
                        }
                    }
                    break;
                }

                case "customize_nickname": {
                    const modal = new ModalBuilder()
                        .setCustomId(`modal_nickname_${interaction.id}`)
                        .setTitle("Change Bot Nickname");

                    const nickInput = new TextInputBuilder()
                        .setCustomId("bot_nickname")
                        .setLabel("Server Nickname")
                        .setStyle(TextInputStyle.Short)
                        .setPlaceholder("Enter a nickname for Reverb in this server...")
                        .setMaxLength(32)
                        .setRequired(true);

                    modal.addComponents(new ActionRowBuilder().addComponents(nickInput));
                    await interaction.showModal(modal);

                    const submission = await interaction
                        .awaitModalSubmit({
                            time: 120000,
                            filter: (m) => m.customId === `modal_nickname_${interaction.id}` && m.user.id === authorId,
                        })
                        .catch(() => null);

                    if (submission) {
                        const newNick = submission.fields.getTextInputValue("bot_nickname").trim();
                        await submission.deferReply({ flags: MessageFlags.Ephemeral });

                        try {
                            const guild = submission.guild || client.guilds.cache.get(submission.guildId);
                            await guild.members.editMe({
                                nick: newNick,
                                reason: `Server Nickname customized by ${submission.user.tag} (${submission.user.id})`,
                            });

                            await submission.editReply({
                                content: `${client.emojiList.keyboard} **Server Nickname Updated!**\n> Reverb's nickname in **${guild.name}** is now **${newNick}**!`,
                            });
                        } catch (err) {
                            await submission.editReply({
                                content: `${client.emojiList.cross} **Failed to Update Nickname:**\n> ${err.message}`,
                            });
                        }
                    }
                    break;
                }

                case "customize_bio": {
                    const modal = new ModalBuilder()
                        .setCustomId(`modal_bio_${interaction.id}`)
                        .setTitle("Set Bot Bio");

                    const bioInput = new TextInputBuilder()
                        .setCustomId("bot_bio")
                        .setLabel("Server Bio")
                        .setStyle(TextInputStyle.Paragraph)
                        .setPlaceholder("Enter a custom server bio description for Reverb...")
                        .setMaxLength(190)
                        .setRequired(true);

                    modal.addComponents(new ActionRowBuilder().addComponents(bioInput));
                    await interaction.showModal(modal);

                    const submission = await interaction
                        .awaitModalSubmit({
                            time: 120000,
                            filter: (m) => m.customId === `modal_bio_${interaction.id}` && m.user.id === authorId,
                        })
                        .catch(() => null);

                    if (submission) {
                        const bioText = submission.fields.getTextInputValue("bot_bio").trim();
                        await submission.deferReply({ flags: MessageFlags.Ephemeral });

                        try {
                            const guild = submission.guild || client.guilds.cache.get(submission.guildId);
                            await guild.members.editMe({
                                bio: bioText,
                                reason: `Server Bio customized by ${submission.user.tag} (${submission.user.id})`,
                            });

                            await submission.editReply({
                                content: `${client.emojiList.book} **Server Bio Updated!**\n> Successfully updated Reverb's server bio for **${guild.name}**!`,
                            });
                        } catch (err) {
                            await submission.editReply({
                                content: `${client.emojiList.cross} **Failed to Update Bio:**\n> ${err.message}`,
                            });
                        }
                    }
                    break;
                }

                case "customize_reset": {
                    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                    const guild = interaction.guild || client.guilds.cache.get(interaction.guildId);

                    try {
                        await guild.members.editMe({
                            nick: null,
                            avatar: null,
                            banner: null,
                            bio: null,
                            reason: `Server customizations reset by ${interaction.user.tag} (${interaction.user.id})`,
                        });

                        await interaction.editReply({
                            content: `${client.emojiList.trash} **All Customizations Reset!**\n> Successfully restored Reverb's server nickname, avatar, banner, and bio for **${guild.name}** back to default on Discord.`,
                        });
                    } catch (err) {
                        let nickReset = false;
                        try {
                            const me = guild.members.me || (await guild.members.fetchMe().catch(() => null));
                            if (me && me.nickname) {
                                await me.setNickname(null, "Resetting nickname");
                                nickReset = true;
                            }
                        } catch (_) {}

                        await interaction.editReply({
                            content: nickReset
                                ? `${client.emojiList.trash} **Partial Reset:** Restored default server nickname.`
                                : `${client.emojiList.cross} **Failed to Reset Customizations:** ${err.message}`,
                        });
                    }
                    break;
                }

                default:
                    break;
            }
        } catch (err) {
            client.logger?.error?.("[ CUSTOMIZE ] Interaction error:", err);
        }
    });

    collector.on("end", async () => {
        try {
            const guild = message.guild || client.guilds.cache.get(message.guildId);
            const expiredView = buildCustomizeView({ client, guild, disabled: true });
            await message.edit({
                components: expiredView.components,
                flags: MessageFlags.IsComponentsV2,
            }).catch(() => null);
        } catch (_) {}
    });

    return collector;
}

module.exports = {
    buildCustomizeView,
    attachCustomizeCollector,
};
