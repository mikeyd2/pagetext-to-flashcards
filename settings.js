import { readFileSync, writeFileSync } from "fs";
import inquirer from "inquirer";
import { getModels } from "./utils.js";
import { validateDirectory } from "./input_validation.js";

/**
 * Prompts the user to confirm settings and allows adjustments until confirmed.
 *
 * Establishes a second loop within main() to allow settings adjustment without impacting
 * main execution flow.
 *
 * If confirmed resolves to true, settings are saved to settings.json and returned.
 * Else, a new prompt is displayed with the current settings and the user is prompted
 * to select a setting for adjustment or to confirm the settings.
 *
 * @async
 * @function confirmSettings
 * @returns {Promise<Object>} The confirmed settings object.
 */
async function confirmSettings() {
  let confirmed = false;
  let settings = loadSettings();

  while (!confirmed) {
    confirmed = await promptSettings(settings);

    if (!confirmed) {
      settings = await promptSettingsAdjustments(settings);
      saveSettings(settings);
    }
  }

  return settings;
}

/**
 * Loads settings from a JSON file.
 *
 * @returns {Object|null} The parsed settings object if successful, otherwise null.
 */
function loadSettings() {
  try {
    const data = readFileSync("settings.json", "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading settings.json:", error);
    return null;
  }
}

/**
 * Saves the provided settings to a JSON file.
 *
 * @param {Object} settings - The settings object to be saved.
 * @throws Will throw an error if the file cannot be written.
 */
function saveSettings(settings) {
  try {
    writeFileSync("settings.json", JSON.stringify(settings, null, 2), "utf8");
    console.log("Settings saved successfully.");
  } catch (error) {
    console.error("Error saving settings:", error);
  }
}

/**
 * Initial prompt displayed within the settings editing loop.
 * Displays current settings and awaits user confirmation.
 *
 * @param {Object} settings - The current settings to be confirmed.
 * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the user confirmed the settings.
 */
async function promptSettings(settings) {
  console.log("Current settings:", settings);

  const { confirmSettings } = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmSettings",
      message: "Do you want to use these settings?",
      default: true,
    },
  ]);

  return confirmSettings;
}

/**
 * Prompts the user to adjust settings through a series of interactive prompts.
 * Settings not stored within lists are edited directly within the same prompt
 * from which they are selected.
 *
 * Settings values stored as lists are edited in a separate prompt function,
 * allowing elements to be added, removed, or edited.
 * List-based settings:
 *  - excludeElements: HTML element tags to exclude from scraping.
 *  - excludeIDs: HTML element IDs to exclude from scraping.
 *  - includeElements: HTML element tags to include in scraping
 *                     (includes all elements if empty).
 *
 * If the model setting is selected, the user is prompted to select a model from
 * a list of current models fetched by getModels(), found in './utils.js'.
 * Available models are filterd to exclude those which process/generate audio/images.
 *
 * @param {Object} settings - The current settings object.
 * @param {string} settings.logDirectory - The directory where logs are stored.
 * @param {Array<string>} settings.excludeElements - List of elements to exclude.
 * @param {Array<string>} settings.excludeIDs - List of element IDs to exclude.
 * @param {Array<string>} settings.excludeClassess - List of element classes to exclude.
 * @param {Array<string>} settings.includeElements - List of elements to include.
 * @param {string} settings.model - The model to use.
 * @returns {Promise<Object>} The updated settings object.
 */
async function promptSettingsAdjustments(settings) {
  let editing = true;

  while (editing) {
    const { settingToChange } = await inquirer.prompt({
      type: "list",
      name: "settingToChange",
      message: "Select a setting to change:",
      choices: Object.keys(settings).concat("Done editing"),
    });

    if (settingToChange === "Done editing") {
      editing = false;
    } else if (settingToChange === "model") {
      const models = await getModels();
      const { model } = await inquirer.prompt({
        type: "list",
        name: "model",
        message: "Select a model to use:",
        choices: models,
      });
      settings[settingToChange] = model;
    } else if (
      settingToChange !== "excludeElements" &&
      settingToChange !== "excludeIDs" &&
      settingToChange !== "excludeClasses" &&
      settingToChange !== "includeElements" &&
      settingToChange !== "model"
    ) {
      const { newValue } = await inquirer.prompt({
        type: "input",
        name: "newValue",
        message: `Enter new value for ${settingToChange}:`,
        default: settings[settingToChange],
        validate: function (input) {
          if (settingToChange === "logDirectory") {
            const result = validateDirectory(input);
            return result.validPath
              ? true
              : `Error with LogPath: ${result.error}`;
          } else {
            return input ? true : `${settingToChange} cannot be empty.`;
          }
        },
      });

      settings[settingToChange] = newValue;
    } else if (
      settingToChange === "excludeElements" ||
      settingToChange === "excludeIDs" ||
      settingToChange === "excludeClasses" ||
      settingToChange === "includeElements"
    ) {
      await editListSettings(settings, settingToChange);
    }
  }
  return settings;
}

/**
 * Edits a specific list within the settings object based on user input.
 * Allows the user to add, remove, or edit items in the list.
 *
 * @param {Object} settings - The settings object containing various lists.
 * @param {string} settingToChange - The key of the list within the settings object to be edited.
 * @returns {Promise<void>} - A promise that resolves when the editing is complete and settings are saved.
 */
async function editListSettings(settings, settingToChange) {
  let editing = true;

  while (editing) {
    console.log(
      `Current list ${settingToChange}: ${settings[settingToChange]}`
    );

    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: `What would you like to do with the ${settingToChange} list?`,
        choices: ["Add Item", "Remove Item", "Edit Item", "Done"],
      },
    ]);

    if (action === "Add Item") {
      const { newItem } = await inquirer.prompt({
        type: "input",
        name: "newItem",
        message: "Enter the new item to add:",
      });
      settings[settingToChange].push(newItem);
    } else if (action === "Remove Item") {
      const { itemToRemove } = await inquirer.prompt({
        type: "list",
        name: "itemToRemove",
        message: "Select an item to remove:",
        choices: settings[settingToChange],
      });
      settings[settingToChange] = settings[settingToChange].filter(
        (item) => item !== itemToRemove
      );
    } else if (action === "Edit Item") {
      const { itemToEdit } = await inquirer.prompt({
        type: "list",
        name: "itemToEdit",
        message: "Select an item to edit:",
        choices: settings[settingToChange],
      });

      const { updatedItem } = await inquirer.prompt({
        type: "input",
        name: "updatedItem",
        message: `Enter the new value for "${itemToEdit}":`,
        default: itemToEdit,
      });

      const index = settings[settingToChange].indexOf(itemToEdit);
      if (index !== -1) settings[settingToChange][index] = updatedItem;
    } else if (action === "Done") {
      editing = false;
    }
  }

  saveSettings(settings);
}
export { confirmSettings, loadSettings, saveSettings };
