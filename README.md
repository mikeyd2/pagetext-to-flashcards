# pagetext-to-flashcards

Pulls text from webpages, filters and parses the extracted text, passes it into ChatGPT to generate question/answer pairs, then connects to Anki via AnkiConnect to add flashcards. 

## Features

- Extract text from web pages:
    - Include all HTML elements in page scrape or specify a list of HTML tags
    - Filter text extracted by specifying unwatned HTML tag names, id names, and class names 
- Choose the deck to which cards should be added or create a new deck
- Choose whether to tag cards:
    - Option to bulk tag all generated/added cards with the same set of tags
    - Option to select tags on a card-by-card basis
- Optionally, saves a log of cards added to a CSV file:
    - Including the front/back of the card and the date generated
    - Cross-platform support for validating log file directory
- Select the OpenAI model to use from the current list of models available:
    - Models available for selection within the script pre-filter audio/video processing models 
- Can alter the AnkiConnect URL the script uses to match to your local instance if you've changed it from the default one defined in Add-ons > AnkiConnect > Config
- Checks validity of URLs provided before sending requests to avoid unnecessary API calls
- Alter the prompt used to provide flashcard generation instructions 


## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/mikeyd2/pagtext-to-flashcards.git
    ```
2. Navigate to the project directory:
    ```bash
    cd pagetext-to-flashcards
    ```
3. Install the dependencies:
    ```bash
    npm install
    ```

## Usage

1. Run the application:
    ```bash
    npm start
    ```
2. The script assumes your OpenAI API key is stored as an environment variable named OPENAI_API_KEY (see: constants.js). Ensure this environment variable is set before use, or point the script to your API key some other way as you see fit; remember not to store sensitive info in plaintext!!
3. Follow the on-screen instructions.
4. When entering the URL of the target site, note that it must contain the protocol and subdomain (https://www.example.com works, whereas www.example.com & example.com do not). Ensure that for any target site entered, usage complies with the ToC, robots.txt, & any local regulations. 
5. Select the deck to add generated cards to, or choose to create a new deck. Newly created decks must have unique names and be non-empty.
6. Choose whether to save a log of the cards generated to a CSV file. The location of this file can be altered from the settings menu.
7. Choose how the script will handle card tagging. Tags can written:
    - On a card-by-card basis
    - With all added cards having the same set of tags associated
    - With no added cards having tags associated
8. Review each flashcard that has been generated and confirm addition. If you have chosen to write separate tags for each card, you'll write the tags here after confirming addition. 
9. Main execution finished; run again, edit settings or exit. 

## Notes

 - The default model in settings is 'gpt-4o-mini'; while gpt-4o costs more per call, it doesn't seem to positively affect the quality of the output.
 - Works best on pages with a smaller, more focussed total body of text:
    - For pages with lots and lots of text, you're likely to hit the token limit with OpenAI (varies per model)
    - If so, a quick scan of the HTML document should clue you into a few ids, classes, and element tags suitable for exclusion from scraping
    - This will, of course, vary from site-to-site, but I've added a few obvious ones in to begin with
 - The 'context' can be altered to change prompt instructions, however caution is advised as this may impact the capacity of the script to appropriately parse the message content received from the API call
 - Regarding the cost and legitimacy of usage: user discretion is advised. Ensure you aren't violating any site conditions or local regulations before using. Check your budgeting &c. with OpenAI before using if it's a concern (although for what it's worth, it's yet to cost me even $0.10 total, as of initial commit).

## License

This project is licensed to kill. 

## Contact

mdjldaviesii@gmail.com

## To do

- Estimate token input size after fetching page content and if input is likely to exceed maximum allowed, break the input into smaller chunks and send over multiple requests.
- Add an estimated cost of request based on estimated token input size. 
- Add feature to paste text input into terminal for flashcard generation.
- Add feature to import files (e.g.: .pdf, .txt, .doc, &c.) and section of the file to be processed (e.g.: pp.20-25 of a .pdf/.doc, lines 100-1000 of a .txt, &c.).
- Find a way of living with the possibility that the above two tasks, if completed, would render this a terribly named project.