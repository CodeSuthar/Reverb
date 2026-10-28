const {
    EmbedBuilder, SlashCommandBuilder
} = require("discord.js");

module.exports = {
    slashData: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Check the bot's responsiveness and WebSocket latency."),
    run: async (client, interaction) => {
        const initialTimestamp = Date.now();
        await interaction.deferReply();
        const roundTripLatency = Date.now() - initialTimestamp;
        const websocketPing = client.ws.ping >= 0 ? `${client.ws.ping}ms` : "Connecting...";

        const embed = new EmbedBuilder()
            .setColor(client?.color?.hex ?? "#FF66C4")
            .setDescription(
                `${client.emojiList.ping} | **Pong!** Roundtrip latency is \`${roundTripLatency}ms\` and WebSocket ping is \`${websocketPing}\`.`
            );

        return await interaction.editReply({ embeds: [embed] });
    },
};
