import { statSync, accessSync, constants } from "fs";
import path from "path";

/**
 * Confirms whether a given directory path is valid and writable.
 * First checks if the path contains invalid characters, then checks if the path exists,
 * and can be written to. If the path does not exist, it checks if the parent directory exists,
 * and can be written to.
 *
 * @param {string} dirpath - The directory path to validate.
 * @returns {Object} An object containing:
 *   - {boolean} validPath - Indicates if the directory path is valid.
 *   - {Error|null} error - An error object if the path is invalid, otherwise null.
 */
function validateDirectory(dirpath) {
  const os = process.platform;
  let result;

  if (os !== "win32" && os !== "linux" && os !== "darwin") {
    throw new Error("Unsupported OS");
  }

  result = testPath(dirpath, os);
  if (!result.validPath) {
    return result;
  }

  try {
    const stats = statSync(dirpath);
    if (!stats.isDirectory()) {
      return { validPath: false, error: new Error("Path is not a directory") };
    }
    accessSync(dirpath, constants.W_OK);
    return { validPath: true, error: null };
  } catch (err) {
    if (err.code === "ENOENT") {
      const parentDir = path.dirname(dirpath);
      try {
        const parentStats = statSync(parentDir);
        if (!parentStats.isDirectory()) {
          return {
            validPath: false,
            error: new Error("Parent path is not a directory"),
          };
        }
        accessSync(parentDir, constants.W_OK);
        return { validPath: true, error: null };
      } catch (parentErr) {
        return { validPath: false, error: parentErr };
      }
    } else {
      return { validPath: false, error: err };
    }
  }
}

/**
 * Tests if a given directory path contains invalid characters based on the operating system.
 *
 * @param {string} dirpath - The directory path to be tested.
 * @param {string} os - The operating system type ("win32" for Windows, otherwise Unix-based).
 * @returns {Object} An object containing:
 *   - {boolean} validPath - Indicates if the directory path is valid.
 *   - {Error|null} error - An error object if the path is invalid, otherwise null.
 */
function testPath(dirpath, os) {
  const winInvalidChars = /[<>:"\/\\|?*\x00-\x1F]/g;
  const unixInvalidChars = /[\x00]/g;
  const invalidChars = os === "win32" ? winInvalidChars : unixInvalidChars;

  if (invalidChars.test(dirpath)) {
    return {
      validPath: false,
      error: new Error("Error: path contains invalid characters."),
    };
  }
  return { validPath: true, error: null };
}

/**
 * Validates a given URL string.
 *
 * @param {string} url - The URL string to validate.
 * @returns {Object} An object containing:
 *   - {boolean} validUrl - Indicates if the directory path is valid.
 *   - {Error|null} error - An error object if the path is invalid, otherwise null.
 */
function validateURL(url) {
  let validUrl = false;
  let error = null;
  try {
    new URL(url);
    validUrl = true;
  } catch (err) {
    error = err;
  }
  return { validUrl, error };
}

/**
 * Validates the provided deck name by checking if it is non-empty and does not already exist.
 *
 * @param {string} deckName - The name of the deck to validate.
 * @param {Object} decks - Contains the names and IDs of existing decks, as of when the call was made by mainUserInputHandler().
 * @returns {Promise<{validDeckName: boolean, error: Error|null}>} - An object indicating whether the deck name is valid and any associated error.
 */
async function validateNewDeckName(deckName, decks) {
  if (!deckName.trim()) {
    return {
      validDeckName: false,
      error: new Error("Deck name cannot be empty"),
    };
  }
  try {
    if (Object.keys(decks).includes(deckName.trim())) {
      return {
        validDeckName: false,
        error: new Error("Deck name already exists"),
      };
    }
    return { validDeckName: true, error: null };
  } catch (error) {
    return {
      validDeckName: false,
      error: new Error(`Failed to retrieve decks: ${err.message}`),
    };
  }
}

export { validateDirectory, validateURL, validateNewDeckName };
