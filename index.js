const axios = require('axios');
const { Client, Intents, MessageEmbed } = require('discord.js');
require('dotenv').config();
const cron = require('node-cron');
const cheerio = require('cheerio');

// Global var to store jam entries
let entries = []

// Itch.io´s Jam ID
// Look for '<form method="post"' in HTML code
// Source: https://itch.io/jam/upsteam-3
// Output: action="/jam/317307/preview">
const id = process.env.JAM_ID;

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]
});

async function getEntryMetadata(url) {
  try {
    const entryItch = await axios.get(`https://itch.io${url}`);
    const $ = cheerio.load(entryItch.data);

    return {
      centro: $(".field_responses").find("p:nth-child(1)").children("span").text(),
      equipo: $(".field_responses").find("p:nth-child(2)").children("span").text(),
      categoria: $(".field_responses").find(".badges").first().find("strong").text(),
      etapa: $(".field_responses").find(".badges").last().find("strong").text(),
    }
  } catch (error) {
    console.error(error);
  }
}

async function getEntries() {
  try {
    // Another useful source: https://itch.io/jam/277043/results.json
    // it contains all the ratings
    const url = `https://itch.io/jam/${id}/entries.json`;
    entries = await axios.get(url);
  } catch (error) {
    console.error(error);
  }
}

client.once('ready', async (client) => {
	console.log(`Ready! Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.content === "/karma") {
    // Update entries
    await getEntries();

    // Sort entries by rating_count, putting the lower rated first
    entries.data.jam_games.sort(function(a, b) { return a.rating_count - b.rating_count; });

    // Choose a random entry from the bottom 50% less voted
    randomNumber = Math.floor(Math.random() * (entries.data.jam_games.length + 1) / 2);
    entry = entries.data.jam_games[randomNumber];

    try {
      const meta = await getEntryMetadata(entry.url);

      const entryEmbed = new MessageEmbed()
        .setTitle(entry.game.title)
        .setURL(`https://itch.io${entry.url}`)
        .setAuthor({ name: entry.game.user.name, iconURL: entry.game.cover, url: entry.game.user.url })
        .setDescription(entry.game.short_text)
        .setImage(entry.game.cover)
        .setThumbnail(entry.game.cover)
        .setFooter({ text: `😍 ${meta.centro} (${meta.categoria})` });
      await message.reply({ embeds: [entryEmbed] });
    }
    catch (error) {
      console.log(`Error processing https://itch.io${entry.url}`);
      console.error(error);
    }
  }
});

client.login(process.env.TOKEN);