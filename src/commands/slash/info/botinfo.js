const os = require("os");
const {
    version: djsVersion,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    SlashCommandBuilder,
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
    slashData: new SlashCommandBuilder()
        .setName("botinfo")
        .setDescription("Display comprehensive statistics, system specs, and telemetry for the bot."),
    run: async (client, interaction) => {
        await interaction.deferReply();

        let totalGuilds = client.guilds.cache.size;
        let totalUsers = client.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0);
        let totalChannels = client.channels.cache.size;

        const memoryUsage = process.memoryUsage();
        const heapUsed = formatBytes(memoryUsage.heapUsed);
        const heapTotal = formatBytes(memoryUsage.heapTotal);
        const rss = formatBytes(memoryUsage.rss);

        const totalMem = formatBytes(os.totalmem());
        const freeMem = formatBytes(os.freemem());

        const uptime = formatUptime(client.uptime);
        const osUptime = formatUptime(os.uptime() * 1000);

        const cpus = os.cpus();
        const cpuModel = cpus.length > 0 ? cpus[0].model.trim() : "Unknown CPU";
        const cpuCores = cpus.length;

        const activePlayers = client.musicManager?.players?.size ?? 0;
        const totalNodes = client.musicManager?.nodes?.size ?? 0;

        const botName = client?.config?.bot?.name || client?.user?.username || "Reverb";

        const embed = new EmbedBuilder()
            .setColor(client?.color?.hex ?? "#FF66C4")
            .setAuthor({
                name: `${botName} - Telemetry & System Statistics`,
                iconURL: client.user.displayAvatarURL({ dynamic: true }),
            })
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields([
                {
                    name: "Statistics",
                    value: [
                        `**Servers:** \`${totalGuilds.toLocaleString()}\``,
                        `**Users:** \`${totalUsers.toLocaleString()}\``,
                        `**Channels:** \`${totalChannels.toLocaleString()}\``,
                    ].join("\n"),
                    inline: true,
                },
                {
                    name: "Music Engine",
                    value: [
                        `**Active Players:** \`${activePlayers}\``,
                        `**Connected Nodes:** \`${totalNodes}\``,
                        `**Moonlink.js:** \`v${moonlinkVersion}\``,
                    ].join("\n"),
                    inline: true,
                },
                {
                    name: "Runtime",
                    value: [
                        `**Bot Uptime:** \`${uptime}\``,
                        `**Node.js:** \`${process.version}\``,
                        `**Discord.js:** \`v${djsVersion}\``,
                    ].join("\n"),
                    inline: true,
                },
                {
                    name: "Memory",
                    value: [
                        `**Heap:** \`${heapUsed} / ${heapTotal}\``,
                        `**RSS:** \`${rss}\``,
                        `**System Free:** \`${freeMem} / ${totalMem}\``,
                    ].join("\n"),
                    inline: true,
                },
                {
                    name: "System",
                    value: [
                        `**OS:** \`${os.type()} ${os.release()} (${os.arch()})\``,
                        `**CPU:** \`${cpuModel}\``,
                        `**Cores:** \`${cpuCores} Cores\``,
                    ].join("\n"),
                    inline: true,
                },
            ])
            .setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel("GitHub Repository")
                .setStyle(ButtonStyle.Link)
                .setURL(githubRepositoryUrl)
        );

        return await interaction.editReply({
            embeds: [embed],
            components: [row],
        });
    },
};
