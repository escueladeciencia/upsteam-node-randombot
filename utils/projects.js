const axios = require('axios');
const cheerio = require('cheerio');
const Airtable = require('airtable');
require('dotenv').config();

Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY
});

const base = Airtable.base(process.env.AIRTABLE_BASE_ID);
const table = base.table(process.env.AIRTABLE_TABLE_NAME);

const csv = process.argv[2] === '--csv';
const airtable = process.argv[2] === '--airtable';

async function findRecordById(id) {
  const records = await table.select({
    filterByFormula: `{Id} = ${id}`
  }).firstPage();

  return records.length > 0 ? records[0] : null;
}

async function addRecord(recordData) {
  await table.create(recordData);
}

async function updateRecord(record, recordData) {
  await table.update(record.id, recordData);
}

(async () => {
  try {
    const url = `https://itch.io/jam/${process.env.JAM_ID}/entries.json`;
    const entries = await axios.get(url);
    console.log(`Número de equipos: ${entries.data.jam_games.length}`);
    let centros = [];
    for (const entry of entries.data.jam_games) {
      const entryItch = await axios.get(`https://itch.io${entry.url}`);
      const $ = cheerio.load(entryItch.data);
      const codigo = $(".field_responses").find("p:nth-child(1)").children("span").text();
      const centro = $(".field_responses").find("p:nth-child(2)").children("span").text();
      const equipo = $(".field_responses").find("p:nth-child(3)").children("span").text();
      const categoria = $(".field_responses").find(".badges").first().find("strong").text();
      const etapa = $(".field_responses").find(".badges").last().find("strong").text();
      let videoURL;
      try {
        // Search for project video
        const videoHTML = await axios.get(`https://itch.io/game/trailer/${entry.game.id}`);
        const $ = cheerio.load(videoHTML.data.content);
        videoURL = `https:${$("iframe").attr("src").replace("embed/", "watch?v=")}`;
      } catch {
        videoURL = "";
      }
      const output = !csv ? `Centro: ${centro} - Equipo: ${equipo}` : `${entry.game.id};${codigo};"${centro}";"${equipo}";"${entry.game.title}";${entry.game.cover};${entry.game.user.name};${entry.game.url};"${entry.game.short_text}";"${categoria}";"${etapa}";"${videoURL}";"https://itch.io${entry.url}";"${entry.rating_count}"`;
      // Airtable processing
      if (airtable) {
        const id = entry.game.id;
        const record = await findRecordById(id);

        const recordData = {
          "Id": `${id}`,
          "Codigo": codigo,
          "Centro": centro,
          "Equipo": equipo,
          "Titulo": entry.game.title,
          "Cover": entry.game.cover,
          "Usuario": entry.game.user.name,
          "URL": entry.game.url,
          "Descripción": entry.game.short_text,
          "Categoría": categoria,
          "Nivel": etapa,
          "Video": videoURL,
          "Entry": `https://itch.io${entry.url}`,
          "Votos": entry.rating_count
        };

        if (record) {
          await updateRecord(record, recordData);
        } else {
          await addRecord(recordData);
        }
      }
      console.log(output);
      centros.push(centro);
    }
    const unicos = centros.filter((v, i, a) => a.indexOf(v) === i);
    console.log(`Número de centros: ${unicos.length}`);
  } catch (error) {
    console.error(error);
  }
})();
