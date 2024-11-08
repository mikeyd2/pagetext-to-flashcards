import { existsSync, appendFileSync, writeFileSync } from "fs";
import { join } from "path";
import openAI from "openai";
import { apiKey } from "./constants.js";

/**
 * Writes logs of flashcards to a CSV file. If the file already exists, the logs are appended to it.
 * The CSV file contains the date generated, front text, and back text of each card.
 * Only those cards selected for addition are logged; cards not added are not logged.
 *
 * @param {string} directory - The directory where the CSV file will be saved.
 * @param {Array} cards - An array of card objects, each containing 'front' and 'back' properties.
 */
function writeLogs(directory, cards) {
  const dateGenerated = new Date().toISOString().split("T")[0];
  const filepath = join(directory, "cards_generated.csv");
  let csvData = "";

  if (!existsSync(filepath)) {
    csvData += "Date Generated,Front,Back\n";
  }

  for (const card of cards) {
    const front = card.front.replace(/"/g, '""').trim();
    const back = card.back.replace(/"/g, '""').trim();
    csvData += `"${dateGenerated}","${front}","${back}"\n`;
  }

  try {
    if (existsSync(filepath)) {
      appendFileSync(filepath, csvData);
      console.log(`Logs appended to ${filepath}`);
    } else {
      writeFileSync(filepath, csvData);
      console.log(`Logs written to ${filepath}`);
    }
  } catch (error) {
    console.error(`Error writing logs to ${filepath}:`, error);
  }
}

/**
 * Retrieves a list of model IDs from the OpenAI API which are able to fulfill chat requests, on the assumption that those
 * models able to do so are named like "gpt" or "o1" and do not include "audio" or "realtime" in their names.
 *
 * @param {string} apiKey - The API key to authenticate with the OpenAI API.
 * @returns {Promise<string[]>} A promise that resolves to an array of gtp/01 model IDs, exluding audio and realtime models.
 */
async function getModels() {
  const openai = new openAI({ apiKey: apiKey });
  let ids = [];
  const list = await openai.models.list();
  for (const model of list.data) {
    if (
      model.id.match(/gpt|o1/gi) &&
      !model.id.match(/audio|realtime|tts|embedding|dall/gi)
    ) {
      ids.push(model.id);
    }
  }
  return ids;
}

export { writeLogs, getModels };
