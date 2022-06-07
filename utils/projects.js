const axios = require('axios');
const cheerio = require('cheerio');

const csv = process.argv[2] === '--csv';

(async () => {
    try {
        const url = `https://itch.io/jam/317307/entries.json`;
        const entries =  await axios.get(url);
        console.log(`Número de equipos: ${entries.data.jam_games.length}`);
        let centros = [];
        for (const entry of entries.data.jam_games) {
            const entryItch = await axios.get(`https://itch.io${entry.url}`);
            const $ = cheerio.load(entryItch.data);
            const centro = $(".field_responses").find("p:nth-child(1)").children("span").text();
            const equipo = $(".field_responses").find("p:nth-child(2)").children("span").text();
            const categoria = $(".field_responses").find(".badges").first().find("strong").text();
            const etapa = $(".field_responses").find(".badges").last().find("strong").text();
            let videoURL;
            try {
              // Search for project video
              const videoHTML = await axios.get(`https://itch.io/game/trailer/${entry.game.id}`);
              const $ = cheerio.load(videoHTML.data.content);
              videoURL = `https:${$("iframe").attr("src").replace("embed/", "watch?v=")}`;
            } catch  {
              videoURL = "";
            }
            const output = !csv ? `Centro: ${centro} - Equipo: ${equipo}` : `${entry.game.id};${centro};${equipo};${entry.game.title};${entry.game.user.name};${categoria};${etapa};${videoURL};https://itch.io${entry.url};${entry.rating_count};${entry.coolness}`;
            console.log(output);
            centros.push(centro);
        }
        const unicos = centros.filter((v, i, a) => a.indexOf(v) === i);
        console.log(`Número de centros: ${unicos.length}`);
      } catch (error) {
        console.error(error);
      }
})();
