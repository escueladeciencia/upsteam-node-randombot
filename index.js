const axios = require('axios');
const { Client, Intents, MessageEmbed } = require('discord.js');

let entries = []

const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
  });

client.once('ready', async (client) => {
	console.log(`Ready! Logged in as ${client.user.tag}`);

    try {
        // Source: https://itch.io/jam/upsteam-2
        // Extracted from <form method="post" action="/jam/277043/preview">
        entries = await axios.get('https://itch.io/jam/277043/entries.json');
    } catch (error) {
        console.error(error);
    }
});

client.on('messageCreate', async (message) => {
    if (message.content === "/random") {
        randomNumber = Math.floor(Math.random() * (entries.data.jam_games.length + 1));
        entry = entries.data.jam_games[randomNumber];

        const exampleEmbed = new MessageEmbed()
            .setTitle(entry.game.title)
            .setURL(entry.game.url)
            .setAuthor({ name: entry.game.user.name, iconURL: entry.game.cover, url: entry.game.user.url })
            .setDescription(entry.game.short_text)
            .setThumbnail(entry.game.cover);
        await message.reply({ embeds: [exampleEmbed] });
    }
  });

client.login(process.env.TOKEN);