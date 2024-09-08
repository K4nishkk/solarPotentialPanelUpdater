import * as cheerio from 'cheerio';
import logger from '@/util/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKeys = [
    process.env.GEMINI_API_KEY1,
    process.env.GEMINI_API_KEY2,
    process.env.GEMINI_API_KEY3,
    process.env.GEMINI_API_KEY4,
    process.env.GEMINI_API_KEY5,
    process.env.GEMINI_API_KEY6
]

let currentKeyIndex = 0;

// Get the next API key in the list (rotating)
function getNextApiKey() {
    const apiKey = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length; // Rotate to next key
    return apiKey;
}

export default class ParserFactory {
    static extractProductLinks(responseData, collectionPage, selectors) {
        const $ = cheerio.load(responseData);
        const links = [];
        $(selectors[collectionPage.site].collectionPage).each((index, element) => {
            const link = $(element).attr('href');
            if (link) {
                links.push({
                    site: collectionPage.site,
                    url: collectionPage.areLinksRelative ? collectionPage.baseURL + link : link
                });
            }
        });
        return links;
    }

    static async extractProductDetails(responseData, link, selectors) {
        const $ = cheerio.load(responseData);
        const imgSelector = $(selectors[link.site].img);

        const text = $(selectors[link.site].text).text().trim().replace(/\s+/g, ' ');
        const img = (link.site === "loomsolar") ? imgSelector.attr('data-src').replace("{width}", "600") : imgSelector.attr('src');
        const price = $(selectors[link.site].price).first().text().trim();
    
        const prompt = "return a unformatted json object string containing powerOutput, Efficiency, Durability/Warranty, Dimensions, miscellanous in one sentence from this " + text;
    
        let retries = apiKeys.length;
    
        while (retries > 0) {
          const apiKey = getNextApiKey();
          try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
            const result = await model.generateContent(prompt);

            const parsedText = JSON.parse(result.response.candidates[0].content.parts[0].text.trim().replace(/```json\n|```|\u003E /g, ''));
            return { text: parsedText, img: img, price: price, link: link.url };
          }
          catch (error) {
            logger.error(`Error with API key ${apiKey}: ${error.message}`);
            if (error.response && error.response.status === 429) {
              logger.error(`Rate limit exceeded for API key: ${apiKey}, switching to next key...`);
            }
            else {
              throw new Error(`Failed to extract details with API key ${apiKey}: ${error.message}`);
            }
          }
    
          retries--;
        }

        throw new Error('All API keys exhausted or failed.');
      }
}