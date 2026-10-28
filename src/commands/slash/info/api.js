const {
    EmbedBuilder, SlashCommandBuilder
} = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("api")
        .setDescription("Check the audio node and REST API latency."),
    run: async (client, interaction) => {
        const start = Date.now();
        await interaction.deferReply();
        const restLatency = Date.now() - start;

        const nodes = client.musicManager?.nodes ? Array.from(client.musicManager.nodes.values()) : [];
        const nodeStatus = nodes.map((node) => {
            const stats = node.stats || {};
            const memory = stats.memory ? `${(stats.memory.used / 1024 / 1024).toFixed(0)}MB / ${(stats.memory.allocated / 1024 / 1024).toFixed(0)}MB` : "N/A";
            const players = stats.players ?? 0;
            return `• **${node.host || node.name || "Node"}**: \`${node.connected ? "Connected" : "Disconnected"}\` | Players: \`${players}\` | Mem: \`${memory}\``;
        }).join("\n") || "No audio nodes configured.";

        const embed = new EmbedBuilder()
            .setColor(client?.color?.hex ?? "#FF66C4")
            .setTitle("API & Audio Engine Status")
            .setDescription(
                `**REST Latency:** \`${restLatency}ms\`\n` +
                `**WebSocket Gateway:** \`${client.ws.ping}ms\`\n\n` +
                `### Audio Nodes\n${nodeStatus}`
            )
            .setTimestamp();

        return await interaction.editReply({ embeds: [embed] });
    },
};
