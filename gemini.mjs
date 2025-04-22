import { GoogleGenAI } from "@google/genai";
import { marked } from 'marked';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function runGemini(data1, data2, symbol, news) {
	const response = await ai.models.generateContent({
		model: "gemini-2.0-flash",
		contents: [
			{
				role: "user",
				parts: [
					{
						text:
						`Given the SPY and ${symbol} data, analyze the price movement and determine: For each dataset, identify the **date range that starts at the lowest closing price and ends at the highest closing price, and the net return. For only the ${symbol} dataset, find and display in an ordered list up to 10 news articles (that have anchor tags that lead to those articles) within the found date range. Dates formatted to MM/DD/YYYY and on a separate line along with the article headline. New line. Markup text format without superfluous asterisks.** 
						SPY data: ${JSON.stringify(data1.bars.SPY, null, 2)}, 
						${symbol} data: ${JSON.stringify(data2.bars[symbol], null, 2)}, 
						${symbol} news: ${JSON.stringify(news, null, 2)}.`
					}
				]
			}
		]
	});
	const result = marked(response.candidates[0].content.parts[0].text);
	return result;
}