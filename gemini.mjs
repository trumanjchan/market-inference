import { GoogleGenAI } from "@google/genai";
import { marked } from 'marked';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getLowestPoint(data1, data2, symbol) {
	const response = await ai.models.generateContent({
		model: "gemini-2.0-flash",
		contents: [
			{
				role: "user",
				parts: [
					{
						text:
						`For each dataset, find the lowest_closing_price and the date. Then return your answer as JSON-valid in this format:
						{
							SPY: {
								"lowest_closing_price": "...",
								"lowest_closing_price_date": "...",
								"lowest_closing_price_date_minus_1_week": "...",
								"lowest_closing_price_date_plus_1_week": "..."
							},
							...
						}
						SPY data: ${JSON.stringify(data1.bars.SPY, null, 2)}, 
						${symbol} data: ${JSON.stringify(data2.bars[symbol], null, 2)}`
					}
				]
			}
		]
	});
	const result = response.text;
	return result;
}

export async function askGemini(data1, data2, newsArticles, symbol) {
	//console.log(JSON.stringify(newsArticles))
	console.log(data1)
	console.log(newsArticles)

	const response = await ai.models.generateContent({
		model: "gemini-2.0-flash",
		contents: [
			{
				role: "user",
				parts: [
					{
						text:
						`Given the SPY and ${symbol} data, analyze the lowest closing price of SPY and ${symbol} and determine:

						1) if there is a correlation
						2) list 10 articles that are likely factors that contributed to ${symbol}'s price dip. Include date published and article url.
						markup text format without asterisks.

						SPY data: ${JSON.stringify(data1.bars.SPY, null, 2)}, 
						${symbol} data: ${JSON.stringify(data2.bars[symbol], null, 2)}, 

						SPY news: ${JSON.stringify(newsArticles.marketNews.news, null, 2)}
						${symbol} news: ${JSON.stringify(newsArticles.symbolNews.news, null, 2)}`
					}
				]
			}
		]
	});
	const result = marked(response.candidates[0].content.parts[0].text);
	return result;
}