module.exports = {
    name: "interactionCreate",
    run: async (client, interaction) => {
        if (interaction.isAutocomplete()) {
            const slashCommand = client.slashCommands.get(interaction.commandName);

            if (!slashCommand) return;

            try {
                await slashCommand.autocomplete(client, interaction);
            } catch (e) {
                (client.logger || require("../../utils/logger")).error(`Error in autocomplete for command ${interaction.commandName}:`, e);
            }
        }
    }
}