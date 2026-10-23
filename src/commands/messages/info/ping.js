const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "ping",
    description: "Check the bot's response latency and WebSocket ping.",
    usage: "",
    category: "info",
    aliases: ["pong", "latency"],
    run: async (message, args, client, prefix) => {
        const startTime = Date.now();

        const initialEmbed = new EmbedBuilder()
            .setColor(client?.color?.hex ?? "#FF66C4")
            .setDescription(`${client.emojiList.loading} | **Pinging...**`);

        const msg = await message.reply({ embeds: [initialEmbed] });

        const botLatency = Math.max(0, Date.now() - startTime);
        const apiLatency = Math.max(0, Math.round(client.ws.ping));

        // Get node ping if available
        let nodeLatency = null;
        if (client.musicManager?.nodes) {
            const firstNode = client.musicManager.nodes.onlineNodes?.[0]
                || client.musicManager.nodes.nodes?.values().next().value;
            if (firstNode && firstNode.connected && typeof firstNode.latency === "number" && firstNode.latency >= 0) {
                nodeLatency = firstNode.latency;
            }
        }

        const fields = [
            {
                name: "Roundtrip Latency",
                value: `\`\`\`diff\n+ ${botLatency}ms\n\`\`\``,
                inline: true,
            },
            {
                name: "Discord Gateway",
                value: `\`\`\`diff\n+ ${apiLatency}ms\n\`\`\``,
                inline: true,
            },
        ];

        if (nodeLatency !== null) {
            fields.push({
                name: "Audio Node Latency",
                value: `\`\`\`diff\n+ ${nodeLatency}ms\n\`\`\``,
                inline: true,
            });
        }

        const pongEmbed = new EmbedBuilder()
            .setColor(client?.color?.hex ?? "#FF66C4")
            .setAuthor({
                name: "Pong!",
                iconURL: client.user.displayAvatarURL({ dynamic: true }),
            })
            .addFields(fields)
            .setFooter({
                text: `Requested by ${message.author.tag || message.author.username}`,
                iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setTimestamp();

        return msg.edit({ embeds: [pongEmbed] });
    },
};
