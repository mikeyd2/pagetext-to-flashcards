import inquirer from "inquirer";
import { validateURL } from "./input_validation.js";
import { createDeckPrompt } from "./anki_helper.js";
import { deckNamesAndIds, createDeck } from "./anki.js";

/**
 * Handles the main user input for fetching data, selecting or creating a deck,
 * saving logs, and adding tags to generated cards.
 *
 * Prompts the user for the URL to fetch data from, the deck to which cards will be added,
 * whether to save the fetched data to logs, and whether to add tags to the generated cards.
 *
 * If a new deck is required, the user is prompted to enter the deck name and resulting promise
 * is resolved into the deckName variable.
 * New decks are created using the createDeck() function from './anki.js', with deckName being
 * validated using the validateNewDeckName() function from './input_validation.js'.
 *
 * If all cards are to have the same tags or no tags, the user is prompted to enter the tags at
 * this stage, else tags are handled in the addCardsDifferentTags() function in './anki_helper.js'.
 *
 * currentDecks is populated here and passed along (to the deckResponse prompt here and to
 * createDeckPrompt() in './anki_helper.js', should the user require a new deck being created);
 * this helps avoid overlapping API calls to the AnkiConnect server.
 *
 * @param {string} ankiUrl - The URL of the Anki server.
 * @returns {Promise<Object>} - A promise that resolves to an object containing user inputs:
 *   - urlResponse {string}: The URL entered by the user to fetch data from.
 *   - deckName {string}: The name of the selected or created deck.
 *   - saveToLogs {boolean}: Whether to save the fetched data to logs.
 *   - addTags {string}: The user's choice for adding tags to the generated cards.
 *   - tags {Array<string>}: An array of tags to add to the cards.
 */
async function mainUserInputHandler(ankiUrl) {
  let deckName;
  let tags = [];
  const currentDecks = await deckNamesAndIds(ankiUrl);
  const { urlResponse } = await inquirer.prompt({
    type: "input",
    name: "urlResponse",
    message:
      "Enter the absolute URL to fetch data from (e.g.: https://www.example.com):",
    validate: function (input) {
      const validationResponse = validateURL(input);
      return (
        validationResponse.validUrl ||
        `Error with URL: ${validationResponse.error}`
      );
    },
  });
  const { deckResponse } = await inquirer.prompt({
    type: "list",
    name: "deckResponse",
    message: "Select a deck to add cards to:",
    choices: Object.keys(currentDecks).concat("Create new deck"),
  });

  if (deckResponse === "Create new deck") {
    deckName = await createDeckPrompt(ankiUrl, currentDecks);
    await createDeck(ankiUrl, deckName);
  } else {
    deckName = deckResponse;
  }

  const { saveToLogs } = await inquirer.prompt({
    type: "confirm",
    name: "saveToLogs",
    message:
      "Save the fetched data to logs?\n" +
      "Existing log file will have new data appended to it.\n" +
      "Saves to default path defined in settings. Exit to main menu to change path.",
    default: false,
  });

  const { addTags } = await inquirer.prompt({
    type: "list",
    name: "addTags",
    message: "Add tags to the generated cards?",
    choices: [
      "Add the same tags to all cards",
      "Choose tags per card",
      "No tags",
    ],
    default: "No tags",
  });

  if (addTags === "Add the same tags to all cards") {
    const response = await inquirer.prompt({
      type: "input",
      name: "tags",
      message: "Enter tags to add to all cards (separate with commas):",
      default: "",
    });
    tags = response.tags.split(",").map((tag) => tag.trim());
  } else if (addTags === "No tags") {
    tags = [];
  }
  return { urlResponse, deckName, saveToLogs, addTags, tags };
}

export default mainUserInputHandler;
