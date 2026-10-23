const { readdirSync } = require("fs");
const logger = require("../utils/logger");

module.exports = async (client) => {
    const log = client.logger || logger;
    let count = 0;
    const eventDirectories = readdirSync("./src/events/").filter((folder) => folder !== "music");
    if (!eventDirectories.length) {
        log.warn("No client event directories found!");
        return;
    }

    for (const directory of eventDirectories) {
        const eventFiles = readdirSync(`./src/events/${directory}/`).filter((f) => f.endsWith(".js"));
        if (!eventFiles.length) {
            log.warn(`No client event files found in ${directory}!`);
            continue;
        }

        for (const file of eventFiles) {
            try {
                const event = require(`../events/${directory}/${file}`);
                client.on(event.name, event.run.bind(null, client));
                log.event(`Loaded client event: ${event.name} from ${file} (${directory})`);
                count++;
            } catch (err) {
                log.error(`Error loading client event ${file} from ${directory}:`, err);
            } 
        }
    }

    log.success(`Successfully loaded ${count} client events`);
};
