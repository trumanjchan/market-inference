import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function askGemini(weekData, articleData, symbol, model) {
	const marketLowNewsOriginalArray = articleData.marketLowNews;
	const tickerLowNewsOriginalArray = articleData.tickerLowNews;
	const marketLowNewsArray = marketLowNewsOriginalArray.map(({ datetime, source, headline, url }) => ({ created_at: datetime, source, headline, url }));
	const tickerLowNewsArray = tickerLowNewsOriginalArray.map(({ datetime, source, headline, url }) => ({ created_at: datetime, source, headline, url }));

	const marketHighNewsOriginalArray = articleData.marketHighNews;
	const tickerHighNewsOriginalArray = articleData.tickerHighNews;
	const marketHighNewsArray = marketHighNewsOriginalArray.map(({ datetime, source, headline, url }) => ({ created_at: datetime, source, headline, url }));
	const tickerHighNewsArray = tickerHighNewsOriginalArray.map(({ datetime, source, headline, url }) => ({ created_at: datetime, source, headline, url }));
	
	const response = await ai.models.generateContent({
		model: model,
		contents: [
			{
				role: "user",
				parts: [
					{
						text:
						`1. Determine 5 positive macroeconomic factors and find 5 supporting articles that mention ${symbol} between ${weekData.TICKER.highest_closing_price_date_weekago} and ${weekData.TICKER.highest_closing_price_date_weekahead} from SPY-High-News and ${symbol}-High-News.
						2. Determine 5 negative macroeconomic factors and find 5 supporting articles that mention ${symbol} between ${weekData.TICKER.lowest_closing_price_date_weekago} and ${weekData.TICKER.lowest_closing_price_date_weekahead} from SPY-Low-News and ${symbol}-Low-News.
						For "factor", summarize it in a few short phrases or keywords (no full sentences). Keep it under 10 words.
						For "created_at", convert the datetime to YYYY-MM-DD format.
						
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
										"source": "...",
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
										"source": "...",
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