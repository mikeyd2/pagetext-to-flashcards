import openAI from "openai";
import { apiKey } from "./constants.js";
/**
 * Orchestrates the interaction between sendChatRequest(), formatResponse(),
 * and does some basic validation before sending the request along, based on data
 * provided by scrapePage() (found in './scrape_page.js', used here as param pageTextArray).
 *
 * @param {Array<string>} pageTextArray - An array of text extracted from the page.
 * @param {string} context - Instructions for ChatGPT to generate the flashcard text.
 * @param {string} model - The model to be used for generating the flashcard text.
 * @returns {Promise<string>} - A promise that resolves to the formatted flashcard text.
 * @throws {Error} - Throws an error if any of the required parameters are missing or if the pageTextArray is empty.
 */
async function generateFlashCardText(pageTextArray, context, model) {
  if (pageTextArray.length === 0 || !pageTextArray) {
    throw new Error("No text extracted from the page");
  }
  if (!context) {
    throw new Error("No ChatGPT instructions provided");
  }
  if (!apiKey) {
    throw new Error("No API key provided");
  }
  if (!model) {
    throw new Error("No model provided");
  }

  const chatResponse = await sendChatRequest(
    pageTextArray,
    context,
    model,
    apiKey
  );
  const formattedResponse = formatResponse(chatResponse);
  return formattedResponse;
}

/**
 * Submits a chat request to OpenAI with the extracted text, context, model, and API key.
 * Context, here and throughout, is a system message that provides instructions to the model.
 * Essentially, the prompt to tell the model we want flashcards.
 *
 * @param {string[]} textArray - An array of text strings to be sent as the user message.
 * @param {string} context - The context or system message to be included in the request.
 * @param {string} model - The model to be used for the chat completion.
 * @returns {Promise<Object>} The response from the OpenAI API.
 * @throws Will throw an error if the request fails.
 */
async function sendChatRequest(textArray, context, model) {
  const openai = new openAI({ apiKey: apiKey });
  try {
    const messages = [
      { role: "system", content: context },
      { role: "user", content: textArray.join("\n") },
    ];

    const response = await openai.chat.completions.create({
      model: model,
      messages: messages,
    });

    return response;
  } catch (error) {
    console.error(
      "Error:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

/**
 * Extracts question and answer pairs from the response returned by the API call.
 * As it happens, this is where ChatGPT itself was most useful during the development process.
 * I hate regex. Thanks, ChatGPT.
 *
 * (note that alterations to the "context" field found in settings.json may result in unexpected responses,
 *  impacting the suitability of the regex pattern hardcoded here)
 *
 * @param {Object} response - The response object from the API call.
 * @param {string} response.choices[0].message.content - The content of the message.
 * @returns {Array} An array of flashcard objects, each containing a 'front' and 'back' property.
 *                  (e.g. [{ front: 'Question', back: 'Answer' }])
 * @throws {Error} Throws an error if there is no content in the response.
 */
function formatResponse(response) {
  if (!response.choices[0].message.content) {
    throw new Error("No content in the response");
  }

  const content = String(response.choices[0].message.content);
  const regex =
    /(?:\d+\.\s*)?[\*]*\s*Q:\s*(.+?)\s*[\*]*\s*A:\s*(.+?)(?=\n\d+\.|\nQ:|\n$)/gms; // ^(?!<3$).*
  let match;
  let cards = [];

  while ((match = regex.exec(content)) !== null) {
    const front = match[1].trim();
    const back = match[2].trim();
    cards.push({ front, back });
  }

  return cards;
}

export default generateFlashCardText;
