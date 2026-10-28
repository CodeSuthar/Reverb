const os = require("os");
const {
    version: djsVersion,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");
const {
    version: moonlinkVersion
} = require("moonlink.js");

const githubRepositoryUrl = "https://github.com/CodeSuthar/Reverb";

function formatBytes(bytes) {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

function formatUptime(ms) {
    if (!ms || isNaN(ms)) return "0s";
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
    return parts.join(" ");
}

module.exports = {
    name: "botinfo",
    description: "Display comprehensive statistics, system specs, and telemetry for the bot.",
    usage: "",
    category: "info",
    aliases: ["bi", "info", "stats", "status"],
    run: async (message, args, client, prefix) => {
        let totalGuilds = client.guilds.cache.size;
        let totalUsers = client.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0);
        let totalChannels = client.channels.cache.size;

        if (client.shard) {
            try {
                const results = await Promise.all([
                    client.shard.broadcastEval((c) => c.guilds.cache.size),
                    client.shard.broadcastEval((c) => c.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0)),
                    client.shard.broadcastEval((c) => c.channels.cache.size),
                ]);
                totalGuilds = results[0].reduce((acc, count) => acc + count, 0);
                totalUsers = results[1].reduce((acc, count) => acc + count, 0);
                totalChannels = results[2].reduce((acc, count) => acc + count, 0);
            } catch {
                // Keep local cache if broadcast fails
            }
        }

        const memUsage = process.memoryUsage();
        const processRss = formatBytes(memUsage.rss);
        const processHeap = `${formatBytes(memUsage.heapUsed)} / ${formatBytes(memUsage.heapTotal)}`;
        const systemTotalMem = formatBytes(os.totalmem());
        const systemUsedMem = formatBytes(os.totalmem() - os.freemem());

        const botUptime = formatUptime(client.uptime || (process.uptime() * 1000));
        const osUptime = formatUptime(os.uptime() * 1000);

        const activePlayers = client.musicManager?.players?.players?.size || 0;
        const onlineNodes = client.musicManager?.nodes?.onlineNodes?.length || 0;
        const totalNodes = client.musicManager?.nodes?.nodes?.size || 0;

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
                name: `${botName} - Telemetry & System Statistics`,
                iconURL: client.user.displayAvatarURL({ dynamic: true }),
            })
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .setDescription(
                `**[${botName}](${githubRepositoryUrl})** is an open-source Discord music bot engineered for modern communities.\n` +
                `Source code available on [GitHub](${githubRepositoryUrl}).`,
            )
            .addFields([
                {
                    name: "Bot Statistics",
                    value:
                        `• **Servers:** \`${totalGuilds.toLocaleString()}\`\n` +
                        `• **Users:** \`${totalUsers.toLocaleString()}\`\n` +
                        `• **Channels:** \`${totalChannels.toLocaleString()}\`\n` +
                        `• **Commands:** \`${client.commands.size}\`\n` +
                        `• **Active Players:** \`${activePlayers}\`\n` +
                        `• **Audio Nodes:** \`${onlineNodes}/${totalNodes} Online\``,
                    inline: true,
                },
                {
                    name: "System & Resources",
                    value:
                        `• **OS:** \`${os.type()} ${os.arch()}\`\n` +
                        `• **CPU:** \`${os.cpus().length} Cores\`\n` +
                        `• **Process RAM:** \`${processRss}\`\n` +
                        `• **Heap Usage:** \`${processHeap}\`\n` +
                        `• **System RAM:** \`${systemUsedMem} / ${systemTotalMem}\`\n` +
                        `• **Host Uptime:** \`${osUptime}\``,
                    inline: true,
                },
                {
                    name: "Runtime & Environment",
                    value:
                        `• **Bot Uptime:** \`${botUptime}\`\n` +
                        `• **Node.js:** \`${process.version}\`\n` +
                        `• **Discord.js:** \`v${djsVersion}\`\n` +
                        `• **Moonlink.js:** \`v${moonlinkVersion}\`\n` +
                        `• **Database:** \`${(client.config.database?.provider).toUpperCase()}\`\n` +
                        `• **Version:** \`v${client.package.version}\``,
                    inline: false,
                },
                {
                    name: "Links & Resources",
                    value:
                        `• **GitHub:** [CodeSuthar/Reverb](${githubRepositoryUrl})\n` +
                        `• **Support:** [Community Discord Server](${supportUrl})\n` +
                        `• **Invite:** [Add ${botName} to your server](${inviteUrl})`,
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
