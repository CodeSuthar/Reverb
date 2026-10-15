const { readdirSync } = require("fs");
const { ApplicationCommandType, Routes } = require("discord.js");
const { REST } = require("@discordjs/rest")

module.exports = async (client) => {
    const slashData = [];
    readdirSync("./src/commands/slash/").forEach((dir) => {
        const slashCommands = readdirSync(`./src/commands/slash/${dir}/`).filter((f) => 
            f.endsWith(".js")
        );
        if (!slashCommands.length) throw new Error(`[ SLASH COMMANDS ] No slash command files found in ${dir}!`);

        for (const file of slashCommands) {
            try {
                const slashCommand = require(`../commands/slash/${dir}/${file}`);

                if (!slashCommand.slashData.name) return console.error(`slashCommandNameError: ${file.split(".")[0]} application command name is required.`);
                if (!slashCommand.slashData.description) return console.error(`slashCommandDescriptionError: ${file.split(".")[0]} application command description is required.`);

                client.slashCommands.set(slashCommand.slashData.name, slashCommand);
                console.log(`[ SLASH COMMANDS ] Slash command (/) Loaded: ${slashCommand.slashData.name}`);
            } catch (error) {
                console.error(`[ SLASH COMMANDS ] Error loading slash command ${file.split(".")[0]}: ${error}`);
            }
        }
    });

    const rest = new REST({ version: "10" }).setToken(client.config.bot.token);
    client.on("clientReady", async () => {
        (async () => {
            try {
                console.log(`[ SLASH COMMANDS ] Started refreshing application (/) commands.`);
                await rest.put(Routes.applicationCommands(client.user.id), {
                    body: client.slashCommands.map((cmd) => cmd.slashData),
                });
                console.log(`[ SLASH COMMANDS ] Successfully reloaded application (/) commands.`);
            } catch (error) {
                console.error(`[ SLASH COMMANDS ] SlashCommandError: ${error}`);
            }
        })();
    });
};


// module.exports = async (client) => {
//     const SlashAndContextData = [];
//     readdirSync("./Commands/SlashCommands/").forEach((dir) => {
//         const slashCommandFile = readdirSync(`./Commands/SlashCommands/${dir}/`).filter((files) => files.endsWith(".js"));
//         for (const file of slashCommandFile) {
//             const slashCommand = require(`../Commands/SlashCommands/${dir}/${file}`);

//             if (!slashCommand.SlashData.name) return console.error(`slashCommandNameError: ${file.split(".")[0]} application command name is required.`);

//             if (!slashCommand.SlashData.description) return console.error(`slashCommandDescriptionError: ${file.split(".")[0]} application command description is required.`);

//             client.slashCommands.set(slashCommand.SlashData.name, slashCommand);
//             console.log(`[ Slash CMD ] Client SlashCommands Command (/) Loaded: ${slashCommand.SlashData.name}`);

//             SlashAndContextData.push(slashCommand.SlashData);
//         }
//     });
  
//     const rest = new REST({ version: "10" }).setToken(client.config.Bot.Token);
//     client.on("ready", async () => {
//         (async () => {
//             try {
//                 console.log(`[ Slash And Context CMD ] Started refreshing application (/) commands.`);
//                 await rest.put(Routes.applicationCommands(client.user.id), {
//                    body: SlashAndContextData,
//                 });
//                 console.log(`[ Slash And Context CMD ] Successfully reloaded application (/) commands.`);
//             } catch (error) {
//                 console.error(`[ Slash And Context CMD ] SlashOrContextError: ${error}`);
//             }
//         })();
//     })
// };