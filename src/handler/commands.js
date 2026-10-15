const { readdirSync } = require("fs");

module.exports = async (client) => {
    let count = 0;
    readdirSync("./src/commands/messages/").forEach((dir) => {
        const commands = readdirSync(`./src/commands/messages/${dir}/`).filter((f) => f.endsWith(".js"));
        if (!commands.length) throw new Error(`[ COMMANDS ] No command files found in ${dir}!`);
        for (const file of commands) {
            try {
                const cmd = require(`../commands/messages/${dir}/${file}`);
                if (!cmd.name) {
                    console.log("[ COMMANDS ]", file, `missing a cmd.name, or cmd.name is not a string.`);
                } else {
                    console.log(`[ COMMANDS ] Loading command named ${cmd.name}`);
                    client.commands.set(cmd.name, cmd);
                }

                if (cmd.aliases && Array.isArray(cmd.aliases)) {
                    cmd.aliases.forEach((alias) => client.aliases.set(alias, cmd.name));
                }
            } catch (err) {
                console.error(`[ COMMANDS ] Error loading command ${file}: ${err}`);
            }
        }
    });
}