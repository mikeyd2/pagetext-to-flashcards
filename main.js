import inquirer from "inquirer";
import { addCardsSameTags, addCardsDifferentTags } from "./anki_helper.js";
import scrapePage from "./scrape_page.js";
import generateFlashCardText from "./generate_flashcard_text.js";
import { writeLogs } from "./utils.js";
import { confirmSettings } from "./settings.js";
import mainUserInputHandler from "./main_user_prompts.js";

/**
 * Main function to handle the execution flow of the application. It confirms the settings, runs the main handler, and prompts the user
 * to either run again, edit settings, or exit the application.
 *
 * Editing settings will establish a secondary loop where the user can adjust the settings before returning to the primary execution loop.
 * Prompts and functions associated with the main execution flow are found in './main_user_prompts.js'.
 * Prompts and functions associated with editing settings are found in './settings.js'.
 *
 * The OpenAI API key is assumed to be stored in an environment variable named OPENAI_API_KEY, which is accessed in './constants.js', and
 * stored in the apiKey variable, which is subsequently used by:
 *  - generateFlashCardText() in './generate_flashcard_text.js'
 *  - sendChatRequest() in './generate_flashcard_text.js'
 *  - getModels() in './utils.js'
 *
 * @function main
 * @returns {Promise<void>} A promise that resolves when the application exits.
 */
async function main() {
  const settings = await confirmSettings();
  let exit = false;

  while (!exit) {
    await mainHandler(settings);

    const { runAgain } = await inquirer.prompt({
      type: "list",
      name: "runAgain",
      message: "Run again or edit settings?",
      choices: ["Run again", "Edit settings", "Exit"],
    });

    if (runAgain === "Edit settings") {
      await confirmSettings();
    } else if (runAgain === "Exit") {
      exit = true;
    }
  }

  console.log("see ya :p");
}

/**
 * Main handler function that takes user in input (as returned by mainUserInputHandler() in './main_user_prompts.js'),
 * and passes this data along to the scrapePage() function in './scrape_page.js' to extract text from the webpage.
 *
 * The extracted text is then passed to the generateFlashCardText() function in './generate_flashcard_text.js' to generate
 * question and answer pairs to be used for flashcards.
 *
 * If the user elects to add either the same tags or no tags to all generated cards, the question/answer pairs are passed
 * to the addCardsSameTags() function in './anki_helper.js'. At this point, the user is prompted to review each flashcard
 * before it is added to Anki.
 *
 * If the user elects to add different tags to each card, the question/answer pairs are passed to the addCardsDifferentTags(),
 * which prompts the user to review each flashcard as above, and if it is selected for addtion, the user is prompted to enter
 * tags for that specific card.
 *
 * Finally, if the user elects to save the fetched data to logs, the generated flashcards are written to a log file using the
 * writeLogs() function in './utils.js'.
 * cardsToLog is populated with the front and back of each card that was added to Anki as well as the date of card generation.
 * Only those cards selected for addition are logged.
 *
 * @param {Object} settings - The settings object containing various configurations.
 * @param {string} settings.ankiUrl - The URL for the Anki API.
 * @param {Array<string>} settings.excludeElements - List of elements to exclude during page scraping.
 * @param {Array<string>} settings.excludeIDs - List of element IDs to exclude during page scraping.
 * @param {Array<string>} settings.excludeClasses - List of element clasess to exclude during page scraping.
 * @param {Array<string>} settings.includeElements - List of elements to include during page scraping.
 * @param {string} settings.context - The context for generating flashcard text.
 * @param {string} settings.model - The model to use for generating flashcard text.
 * @param {string} settings.logDirectory - The directory where logs should be saved.
 * @returns {Promise<void>} - A promise that resolves when the main handler has completed its tasks.
 */
async function mainHandler(settings) {
  let cardsToLog = [];
  const { urlResponse, deckName, saveToLogs, addTags, tags } =
    await mainUserInputHandler(settings.ankiUrl);

  const pageText = await scrapePage(
    urlResponse,
    settings.excludeElements,
    settings.excludeIDs,
    settings.excludeClasses,
    settings.includeElements
  );

  const flashcardText = await generateFlashCardText(
    pageText,
    settings.context,
    settings.model
  );

  if (addTags !== "Choose tags per card") {
    cardsToLog = await addCardsSameTags(
      settings.ankiUrl,
      flashcardText,
      deckName,
      tags
    );
  } else {
    cardsToLog = await addCardsDifferentTags(
      settings.ankiUrl,
      flashcardText,
      deckName
    );
  }

  if (saveToLogs) {
    writeLogs(settings.logDirectory, cardsToLog);
  }
}

main();
