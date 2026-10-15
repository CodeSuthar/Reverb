const { EmbedBuilder, InteractionType } = require("discord.js");
const prefixSchema = require("../../schema/prefix.schema");

module.exports = {
    name: "interactionCreate",
    run: async (client, interaction) => {
        if(interaction.type === InteractionType.ApplicationCommand) {
            const slashCommand = client.slashCommands.get(interaction.commandName);
            if (!slashCommand) return;

            if (slashCommand) {
                try {
                    if (slashCommand.developerOnly && !client.developerIds.includes(interaction.user.id)) {
                        let emb = new EmbedBuilder()
                            .setColor("Red")
                            .setDescription(`${client.emojiList.cross} | This command is restricted to bot developers only.`);

                        if (interaction.replied || interaction.deferred) {
                            return await interaction.editReply({
                                embeds: [emb]
                            });
                        }

                        await interaction.reply({
                            embeds: [emb]
                        });
                    }

                    await slashCommand.run(client, interaction);
                } catch (e) {
                    console.error(e);

                    let emb = new EmbedBuilder()
                        .setColor("Red")
                        .setDescription(`${client.emojiList.cross} | There was an error while executing this command!`);

                    if (interaction.replied || interaction.deferred) {
                        await interaction.editReply({
                            embeds: [emb]
                        });
                    } else {
                        await interaction.reply({
                            embeds: [emb]
                        });
                    }   
                }
            }
        }
        // if (!message.guild || !message.channel || !message.id || message.author.bot) return;
        // let prefix = client.prefix;
        // let data = await prefixSchema.findOne({ _id: message.guild.id });
        // if (data && data.prefix) prefix = data.prefix;

        // let clientMention = new RegExp(`^<@!?${client.user.id}>( |)$`);

        // if (message.content.match(clientMention)) {
        //     let msg = prefix === client.prefix
        //         ? `I am **Reverb**, a music bot for Discord. My default prefix is \`${prefix}\`. You can change my prefix using the \`${prefix}setprefix\` command.\n\n> To view my commands, use \`${prefix}help\`.`
        //         : `I am **Reverb**, a music bot for Discord. My current prefix is \`${prefix}\`. You can change my prefix using the \`${prefix}setprefix\` command.\n\n> To view my commands, use \`${prefix}help\`.`;

        //     let embed = new EmbedBuilder()
        //         .setColor("#FF66C4")
        //         .setDescription(`${msg}`)

        //     await message.reply({ embeds: [embed] });
        // }

        // const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        // const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`);
        // if (!prefixRegex.test(message.content)) return;
        // const [matchedPrefix] = message.content.match(prefixRegex);

        // const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
        // const cmd = args.shift().toLowerCase();

        // let command = client.commands.get(cmd);
        // if (!command) command = client.commands.get(client.aliases.get(cmd));

        // if (command) {
        //     try {
        //         if (command.developerOnly && !client.developerIds.includes(message.author.id)) {
        //             return message.reply({
        //                 embeds: [
        //                     new EmbedBuilder()
        //                         .setColor("Red")
        //                         .setDescription(
        //                             `${client.emojiList.cross} | This command is restricted to bot developers only.`,
        //                         ),
        //                 ],
        //             });
        //         }

        //         await command.run(message, args, client, prefix);
        //     } catch (err) {
        //         console.error(`[ Commands ] Error executing command ${command.name}: ${err}`);
        //     }
        // }
    }
}