import axios from "axios";

/**
 * Note that these functions require the AnkiConnect plugin to be installed and running.
 * (and, obviously, Anki itself :p)
 * The plugin can be found at: https://ankiweb.net/shared/info/2055492159
 * And further documentation at: https://foosoft.net/projects/anki-connect/
 */

/**
 * Adds a flashcard to Anki using AnkiConnect.
 *
 * @param {string} ankiUrl - The URL of the AnkiConnect server
 * @param {string} deckName - The name of the deck to add the flashcard to.
 * @param {string} front - The front content of the flashcard.
 * @param {string} back - The back content of the flashcard.
 * @param {Array<string>} tags - An array of tags to associate with the flashcard.
 * @returns {Promise<void>} - A promise that resolves when the flashcard is added.
 * @throws {Error} - Throws an error if there is an issue communicating with AnkiConnect.
 */
async function addFlashcardToAnki(ankiUrl, deckName, front, back, tags) {
  try {
    const response = await axios.post(ankiUrl, {
      action: "addNote",
      version: 6,
      params: {
        note: {
          deckName: deckName,
          modelName: "Basic",
          fields: { Front: front, Back: back },
          tags: tags,
        },
      },
    });

    if (response.data.error) {
      console.error(`Error adding note: ${response.data.error}`);
    } else {
      console.log(`Flashcard added successfully: ${response.data.result}`);
    }
  } catch (error) {
    console.error(`Error communicating with AnkiConnect: ${error}`);
  }
}

/**
 * Fetches the names and IDs of decks from AnkiConnect.
 *
 * @param {string} ankiUrl - The URL of the AnkiConnect API.
 * @returns {Promise<Object>} A promise that resolves to an object containing deck names and IDs.
 * @throws Will throw an error if there is an issue communicating with AnkiConnect.
 */
async function deckNamesAndIds(ankiUrl) {
  try {
    const response = await axios.post(ankiUrl, {
      action: "deckNamesAndIds",
      version: 6,
    });
    if (response.data.error) {
      console.error(`Error getting decks: ${response.data.error}`);
    }
    return response.data.result;
  } catch (error) {
    console.error(`Error communicating with AnkiConnect: ${error}`);
  }
}

/**
 * Creates a new deck in Anki using AnkiConnect, after deckName has been validated;
 * see: validateNewDeckName() in './input_validation.js'.
 *
 * @param {string} ankiUrl - The URL of the AnkiConnect API.
 * @param {string} deckName - The name of the deck to be created.
 * @returns {Promise<void>} - A promise that resolves when the deck is created.
 * @throws {Error} - Throws an error if there is an issue communicating with AnkiConnect.
 */
async function createDeck(ankiUrl, deckName) {
  try {
    const response = await axios.post(ankiUrl, {
      action: "createDeck",
      version: 6,
      params: {
        deck: deckName,
      },
    });
    if (response.data.error) {
      console.error(`Error creating deck ${deckName}: ${response.data.error}`);
      console.error(response.data);
    } else {
      console.log(`Deck ${deckName} created successfully.`);
    }
  } catch (error) {
    console.error(`Error communicating with AnkiConnect: ${error}`);
  }
}

export { addFlashcardToAnki, deckNamesAndIds, createDeck };
