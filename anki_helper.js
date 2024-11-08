import inquirer from "inquirer";
import { addFlashcardToAnki } from "./anki.js";
import { validateNewDeckName } from "./input_validation.js";
/**
 * Anki helper functions
 *
 * Functions which interact directly with AnkiConnect are located in './anki.js'
 * The below functions primarily orchestrate interactions between the API and user input
 */

/**
 * Presents a flashcard for review and prompts the user to confirm if they want to add it to Anki.
 *
 * @param {string} front - The front text of the flashcard.
 * @param {string} back - The back text of the flashcard.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the flashcard should be added to Anki.
 */
async function reviewFlashcard(front, back) {
  console.log("\nFlashcard Preview:");
  console.log(`Front: ${front}`);
  console.log(`Back: ${back}`);

  const { addCard } = await inquirer.prompt([
    {
      type: "confirm",
      name: "addCard",
      message: "Do you want to add this flashcard to Anki?",
      default: false,
    },
  ]);

  return addCard;
}

/**
 * Adds flashcards with the same tags or no tags to an Anki deck.
 *
 * Called by mainUserInputHandler() in './main_user_prompts.js' when the user elects to add the same tags to all cards,
 * following the resolution of the addTags variable in that function.
 *
 * Empty tags is a valid input; it simply means no tags will be added to the cards.
 *
 * cardsAdded is later used to log the cards that were added to Anki, should the user choose to save the fetched data to logs.
 *
 * @param {string} ankiUrl - The URL of the Anki server.
 * @param {Array<{front: string, back: string}>} flashcardText - An array of flashcards, each with a front and back text.
 * @param {string} deckName - The name of the Anki deck to add the flashcards to.
 * @param {Array<string>} tags - An array of tags to be added to each flashcard.
 * @returns {Promise<Array<{front: string, back: string}>>} - A promise that resolves to an array of added flashcards.
 */
async function addCardsSameTags(ankiUrl, flashcardText, deckName, tags) {
  let cardsAdded = [];
  for (const card of flashcardText) {
    const addCard = await reviewFlashcard(card.front, card.back);
    if (addCard) {
      cardsAdded.push({ front: card.front, back: card.back });
      await addFlashcardToAnki(ankiUrl, deckName, card.front, card.back, tags);
    }
  }
  return cardsAdded;
}

/**
 * Adds flashcards with different tags per card to an Anki deck.
 *
 * Called by mainUserInputHandler() in './main_user_prompts.js' when the user elects to decide tags per card,
 * following the resolution of the addTags variable in that function.
 *
 * Empty tags is a valid input; it simply means no tags will be added to the cards.
 *
 * cardsAdded is later used to log the cards that were added to Anki, should the user choose to save the fetched data to logs.
 *
 * @param {string} ankiUrl - The URL of the Anki server.
 * @param {Array<{front: string, back: string}>} flashcardText - An array of flashcard objects containing front and back text.
 * @param {string} deckName - The name of the Anki deck to add the flashcards to.
 * @returns {Promise<Array<{front: string, back: string}>>} - A promise that resolves to an array of added flashcards.
 */
async function addCardsDifferentTags(ankiUrl, flashcardText, deckName) {
  let cardsAdded = [];
  for (const card of flashcardText) {
    const addCard = await reviewFlashcard(card.front, card.back);
    if (addCard) {
      const { tags } = await inquirer.prompt({
        type: "input",
        name: "tags",
        message: "Enter tags to add to this card (separate with commas):",
        default: "",
      });
      if (!tags) {
        await addFlashcardToAnki(ankiUrl, deckName, card.front, card.back, "");
      } else {
        const cardTags = tags.split(",").map((tag) => tag.trim());
        await addFlashcardToAnki(
          ankiUrl,
          deckName,
          card.front,
          card.back,
          cardTags
        );
      }
      cardsAdded.push({ front: card.front, back: card.back });
    }
  }
  return cardsAdded;
}

/**
 * Prompts the user to enter the name of a new deck and sends the input to
 * validateNewDeckName() in './input_validation.js' to ensure the deck name is valid.
 *
 * @param {string} ankiUrl - The URL of the Anki server.
 * @param {Array<string>} decks - An array of existing deck names.
 * @returns {Promise<string>} - A promise that resolves to the name of the new deck.
 */
async function createDeckPrompt(ankiUrl, decks) {
  const { deckName } = await inquirer.prompt({
    type: "input",
    name: "deckName",
    message: "Enter the name of the new deck:",
    validate: async function (input) {
      const response = await validateNewDeckName(input, ankiUrl, decks);
      return response.validDeckName
        ? true
        : `Error with deck name: ${response.error}`;
    },
  });
  return deckName;
}
export {
  reviewFlashcard,
  addCardsSameTags,
  addCardsDifferentTags,
  createDeckPrompt,
};
