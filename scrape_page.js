import axios from "axios";
import { JSDOM } from "jsdom";

/**
 * **************************************************************************
 *  ENSURE COMPLIANCE WITH THE TERMS OF SERVICE OF THE WEBSITE BEING SCRAPED*
 *  ENSURE COMPLIANCE WITH robots.txt                                       *
 *  ENSURE COMPLIANCE WITH LOCAL LAWS AND REGULATIONS                       *
 *  USE AT YOUR OWN RISK                                                    *
 * **************************************************************************
 *
 * Extracts text from a webpage by fetching HTML content and extracting textContent from the desired elements.
 * Elements to exclude can be specified by tag name or by ID.
 * Whitespace is normalised and trimmed, with empty strings excluded from final output.
 * If no includeElements are specified, all elements are included
 *
 * @param {string} url - The URL of the web page to scrape.
 * @param {string[]} [excludeElements=[]] - An array of tag names to exclude from the scraping.
 * @param {string[]} [excludeIDs=[]] - An array of element IDs to exclude from the scraping.
 * @param {string[]} [excludeClasses=[]] - An array of element classes to exclude from the scraping.
 * @param {string[]} [includeElements=[]] - An array of tag names to include in the scraping.
 * @returns {Promise<string[]>} - A promise that resolves to an array of text content from the web page.
 * @throws {Error} - Throws an error if the URL is invalid or if there is an issue fetching or processing the URL.
 *
 */
async function scrapePage(
  url,
  excludeElements = [],
  excludeIDs = [],
  excludeClasses = [],
  includeElements = []
) {
  if (!url || typeof url !== "string") {
    throw new Error("Invalid URL provided");
  }

  const excludeElementSelectors = excludeElements.join(",");
  const excludeIdSelectors = excludeIDs.map((id) => `[id*='${id}']`).join(", ");
  const excludeClassSelectors = excludeClasses
    .map((className) => `[class*='${className}']`)
    .join(", ");
  const combinedExcludeSelectors = [
    excludeElementSelectors,
    excludeIdSelectors,
    excludeClassSelectors,
  ]
    .filter(Boolean)
    .join(", ");
  const includeSelectors = includeElements.join(",");
  let elements;

  try {
    const response = await axios.get(url);
    const html = response.data;
    const dom = new JSDOM(html);
    const document = dom.window.document;
    let outputTexts = [];

    if (includeSelectors) {
      elements = document.querySelectorAll(includeSelectors);
    } else {
      elements = document.querySelectorAll("*");
    }

    if (combinedExcludeSelectors) {
      elements.forEach((element) => {
        if (element.closest(combinedExcludeSelectors)) {
          return;
        }
        const text = element.textContent.replace(/\s+/g, " ").trim();
        if (text) {
          outputTexts.push(text);
        }
      });
    } else {
      elements.forEach((element) => {
        const text = element.textContent.replace(/\s+/g, " ").trim();
        if (text) {
          outputTexts.push(text);
        }
      });
    }

    return outputTexts;
  } catch (error) {
    console.error(`Error fetching or processing the URL: ${error}`);
    return [];
  }
}
export default scrapePage;
