const { readdirSync } = require("fs");
const { ApplicationCommandType, Routes } = require("discord.js");
const { REST } = require("@discordjs/rest");
const logger = require("../utils/logger");

module.exports = async (client) => {
    const log = client.logger || logger;
    let count = 0;

    readdirSync("./src/commands/slash/").forEach((dir) => {
        const slashCommands = readdirSync(`./src/commands/slash/${dir}/`).filter((f) => 
            f.endsWith(".js")
        );
        if (!slashCommands.length) {
            log.warn(`No slash command files found in category: ${dir}`);
            return;
        }

        for (const file of slashCommands) {
            try {
                const slashCommand = require(`../commands/slash/${dir}/${file}`);

                if (!slashCommand.slashData?.name) {
                    log.error(`slashCommandNameError: ${file.split(".")[0]} application command name is required.`);
                    continue;
                }
                if (!slashCommand.slashData?.description) {
                    log.error(`slashCommandDescriptionError: ${file.split(".")[0]} application command description is required.`);
                    continue;
                }

                client.slashCommands.set(slashCommand.slashData.name, slashCommand);
                log.command(`Loaded slash command: /${slashCommand.slashData.name}`);
                count++;
            } catch (error) {
                log.error(`Error loading slash command ${file.split(".")[0]}:`, error);
            }
        }
    });

    log.success(`Successfully loaded ${count} slash commands (/)`);

    const rest = new REST({ version: "10" }).setToken(client.config.bot.token);
    client.on("clientReady", async () => {
        (async () => {
            try {
                log.info("Started refreshing application (/) commands...");
                await rest.put(Routes.applicationCommands(client.user.id), {
                    body: client.slashCommands.map((cmd) => cmd.slashData),
                });
                log.success("Successfully reloaded application (/) commands.");
            } catch (error) {
                log.error("Error refreshing application (/) commands:", error);
            }
        })();
    });
};
