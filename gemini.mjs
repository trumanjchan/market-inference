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
						`Determine the macroeconomic factors that contributed to the highest and lowest closing prices for ${symbol}. 

						1. Identify the macroeconomic topics that led to the highest closing price and lowest closing price.
						2. Find 5 relevant negative articles related to these topics between the dates of the lowest_closing_price (from ${symbol} lowest_closing_price_date_weekago to ${symbol} lowest_closing_price_date_weekahead).
						3. Find 5 relevant positive articles between the dates of the highest_closing_price (from ${symbol} highest_closing_price_date_weekago to ${symbol} highest_closing_price_date_weekahead).
						4. Each article should mention the macroeconomic topics selected from the SPY and ${symbol} Low/High news.
						
						Return the results in the following JSON format:

						{
							"factors": {
								"negative": [
									{
										"factor": "..."
									},
									...
								],
								"positive": [
									{
										"factor": "..."
									},
									...
								]
							},
							"articles": {
								"Low": {
									"negative": [
										{
											"created_at": "...",
											"headline": "...",
											"url": "..."
										},
										...
									]
								},
								"High": {
									"positive": [
										{
											"created_at": "...",
											"headline": "...",
											"url": "..."
										},
										...
									]
								}
							}
						}
						
						For the following data:

						${symbol} highest_closing_price: ${weekData.TICKER.highest_closing_price}
						${symbol} highest_closing_price_date_weekago: ${weekData.TICKER.highest_closing_price_date_weekago}
						${symbol} highest_closing_price_date_weekahead: ${weekData.TICKER.highest_closing_price_date_weekahead}
						${symbol} lowest_closing_price: ${weekData.TICKER.lowest_closing_price}
						${symbol} lowest_closing_price_date_weekago: ${weekData.TICKER.lowest_closing_price_date_weekago}
						${symbol} lowest_closing_price_date_weekahead: ${weekData.TICKER.lowest_closing_price_date_weekahead}

						SPY Low news: ${JSON.stringify(marketLowNewsArray, null, 2)}
						${symbol} Low news: ${JSON.stringify(tickerLowNewsArray, null, 2)}
						SPY High news: ${JSON.stringify(marketHighNewsArray, null, 2)}
						${symbol} High news: ${JSON.stringify(tickerHighNewsArray, null, 2)}`
					}
				]
			}
		]
	});
	const result = response.text;
	return result;
}