import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function askGemini(weekData, articleData, symbol) {
	const marketLowNewsOriginalArray = articleData.marketLowNews;
	const tickerLowNewsOriginalArray = articleData.tickerLowNews;
	const marketLowNewsArray = marketLowNewsOriginalArray.news.map(({ created_at, headline, url }) => ({ created_at, headline, url }));
	const tickerLowNewsArray = tickerLowNewsOriginalArray.news.map(({ created_at, headline, url }) => ({ created_at, headline, url }));

	const marketHighNewsOriginalArray = articleData.marketHighNews;
	const tickerHighNewsOriginalArray = articleData.tickerHighNews;
	const marketHighNewsArray = marketHighNewsOriginalArray.news.map(({ created_at, headline, url }) => ({ created_at, headline, url }));
	const tickerHighNewsArray = tickerHighNewsOriginalArray.news.map(({ created_at, headline, url }) => ({ created_at, headline, url }));
	
	const response = await ai.models.generateContent({
		model: "gemini-2.0-flash",
		contents: [
			{
				role: "user",
				parts: [
					{
						text:
						`1. Determine concisely the positive macroeconomic factors and find 6 relevant articles that mention ${symbol} between ${weekData.TICKER.highest_closing_price_date_weekago} and ${weekData.TICKER.highest_closing_price_date_weekahead} from SPY-High-News and ${symbol}-High-News.
						2. Determine concisely the negative macroeconomic factors and find 6 relevant articles that mention ${symbol} between ${weekData.TICKER.lowest_closing_price_date_weekago} and ${weekData.TICKER.lowest_closing_price_date_weekahead} from SPY-Low-News and ${symbol}-Low-News.
						
						Return the results in the following JSON format:
						{
							"positive": {
								"factors": [
									{
										"factor": "..."
									},
									...
								],
								"articles": [
									{
										"created_at": "...",
										"headline": "...",
										"url": "..."
									},
									...
								]
							},
							"negative": {
								"factors": [
									{
										"factor": "..."
									},
									...
								],
								"articles": [
									{
										"created_at": "...",
										"headline": "...",
										"url": "..."
									},
									...
								]
							}
						}

						SPY-High-News: ${JSON.stringify(marketHighNewsArray, null, 2)}
						${symbol}-High-News: ${JSON.stringify(tickerHighNewsArray, null, 2)}
						
						SPY-Low-News: ${JSON.stringify(marketLowNewsArray, null, 2)}
						${symbol}-Low-News: ${JSON.stringify(tickerLowNewsArray, null, 2)}`
					}
				]
			}
		]
	});
	const result = response.text;
	return result;
}