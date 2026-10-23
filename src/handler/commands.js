const { readdirSync } = require("fs");
const logger = require("../utils/logger");

module.exports = async (client) => {
    const log = client.logger || logger;
    let count = 0;

    readdirSync("./src/commands/messages/").forEach((dir) => {
        const commands = readdirSync(`./src/commands/messages/${dir}/`).filter((f) => f.endsWith(".js"));
        if (!commands.length) {
            log.warn(`No message command files found in category: ${dir}`);
            return;
        }

        for (const file of commands) {
            try {
                const cmd = require(`../commands/messages/${dir}/${file}`);
                if (!cmd.name) {
                    log.warn(`Message command ${file} is missing cmd.name or cmd.name is not a string.`);
                } else {
                    client.commands.set(cmd.name, cmd);
                    log.command(`Loaded message command: ${cmd.name}`);
                    count++;
                }

                if (cmd.aliases && Array.isArray(cmd.aliases)) {
                    cmd.aliases.forEach((alias) => client.aliases.set(alias, cmd.name));
                }
            } catch (err) {
                log.error(`Error loading message command ${file}:`, err);
            }
        }
    });

    log.success(`Successfully loaded ${count} message commands`);
};
