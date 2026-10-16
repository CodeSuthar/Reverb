const { readdirSync } = require("fs");

module.exports = async (client) => {
    let count = 0;
    let parentDir = readdirSync("./src/events/").filter((f) => f !== "node" && f !== "lavalink");
    for (const dir of parentDir) {
        const events = readdirSync(`./src/events/${dir}/`).filter((f) => f.endsWith(".js"));
        if (!events.length) throw new Error(`[ EVENTS ] No client event files found in ${dir}!`);

        for (const file of events) {
            try {
                const event = require(`../events/${dir}/${file}`);
                client.on(event.name, event.run.bind(null, client));
                console.log(`[ EVENTS ] Client event loaded: ${event.name}`);
                count++;
            } catch (err) {
                console.error(`[ EVENTS ] Error loading client event ${file}: ${err}`);
            } 
        }
    }
}