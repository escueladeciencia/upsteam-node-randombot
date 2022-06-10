const axios = require('axios');
const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const cron = require('node-cron');
const cheerio = require('cheerio');
require('dotenv').config();

// Global var to store jam entries
let entries = []

// Itch.io´s Jam ID
// Look for '<form method="post"' in HTML code
const id = process.env.JAM_ID;

// Time interval control between two commands to ms
const interval = process.env.INTERVAL*60*1000;
let lastTime = new Date(Date.now() - interval);

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

const commands = ["/karma", "/random", "/top", "/cool"];

client.on('messageCreate', async (message) => {
  // Get command
  const command = message.content;

  if (commands.includes(command)) {
    // Check last time
    const waitingTime = lastTime.getTime() - new Date().getTime() + interval;
    if (waitingTime > 0) {
      return message.channel.send(`Tienes que esperar ${Math.round(waitingTime/1000)} segundos para volver a usar el comando.`);
    } else {
      lastTime = new Date();
    }
      
    // Update entries
    await getEntries();

    // Randomize entries to introduce some entropy
    entries.data.jam_games.sort(() => Math.random() - 0.5);

    let entry;
    console.log(entries.data.jam_games[0].rating_count);
    switch (command) {
      case "/karma":
        // Random entry from 10% less voted projects
        entries.data.jam_games.sort(function(a, b) { return a.rating_count - b.rating_count; });
        entry = entries.data.jam_games[Math.floor(Math.random() * Math.floor(entries.data.jam_games.length * 0.1))];
        break;
      case "/random":
        // Random entry
        entry = entries.data.jam_games[0];
        break;
      case "/top":
        // Random entry from top 10% voted projects
        entries.data.jam_games.sort(function(a, b) { return b.rating_count - a.rating_count; });
        entry = entries.data.jam_games[Math.floor(Math.random() * Math.floor(entries.data.jam_games.length * 0.1))];
        break;
      case "/cool":
        // Random entry from top 10% coolest projects
        entries.data.jam_games.sort(function(a, b) { return b.coolness - a.coolness; });
        entry = entries.data.jam_games[Math.floor(Math.random() * Math.floor(entries.data.jam_games.length * 0.1))];
        // nothing to do yet
        break;
      default:
        // nothing to do
    }

    try {
      const meta = await getEntryMetadata(entry.url);

      const cover =  entry.game.cover || "https://upsteam.es/wp-content/uploads/2022/06/noimage.png";

      const entryEmbed = new MessageEmbed()
        .setTitle(entry.game.title)
        .setURL(`https://itch.io${entry.url}`)
        .setAuthor({ name: entry.game.user.name, url: entry.game.user.url })
        .setDescription(entry.game.short_text || "No hay descripción")
        .setImage(cover)
        .setFooter({ text: `😍 ${meta.centro} (${meta.categoria})` });

      let row = new MessageActionRow();

      try {
        // Search for project video
        const videoHTML = await axios.get(`https://itch.io/game/trailer/${entry.game.id}`);
        const $ = cheerio.load(videoHTML.data.content);
        const videoURL = $("iframe").attr("src").replace("embed/", "watch?v=");

        // Add video link
        row.addComponents(
          new MessageButton()
            .setURL(`https:${videoURL}`)
            .setLabel('Video')
            .setStyle('LINK'),	
          );
      } catch (error) {
        console.log(`No video in https://itch.io${entry.url}`);
      }

      // Add project link
      row.addComponents(
        new MessageButton()
          .setURL(`https://itch.io${entry.url}`)
          .setLabel('Votar')
          .setStyle('LINK'),	
        );

      await message.reply({ embeds: [entryEmbed], components: [row] });
    }
    catch (error) {
      console.log(`Error processing https://itch.io${entry.url}`);
    }
  }
});

client.login(process.env.TOKEN);