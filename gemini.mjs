import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getLowestPoint(marketData, tickerData, symbol) {
	const marketDataOriginalArray = marketData.bars.SPY;
	const tickerDataOriginalArray = tickerData.bars[symbol];

	const marketArray = marketDataOriginalArray.map(({ c, t }) => ({ c, t: t.substring(0, 10) }));
	const tickerArray = tickerDataOriginalArray.map(({ c, t }) => ({ c, t: t.substring(0, 10) }));

	const response = await ai.models.generateContent({
		model: "gemini-2.0-flash",
		contents: [
			{
				role: "user",
				parts: [
					{
						text:
						`For each dataset find the lowest_closing_price, lowest_closing_price_date, lowest_closing_price_date_minus_1_week, lowest_closing_price_date_plus_1_week, highest_closing_price, highest_closing_price_date, highest_closing_price_date_minus_1_week, and highest_closing_price_date_plus_1_week. Then return your answer as JSON-valid in this format:
						{
							"SPY": {
								"lowest_closing_price": "...",
								"lowest_closing_price_date": "...",
								"lowest_closing_price_date_minus_1_week": "...",
								"lowest_closing_price_date_plus_1_week": "...",
								"highest_closing_price": "...",
								"highest_closing_price_date": "...",
								"highest_closing_price_date_minus_1_week": "...",
								"highest_closing_price_date_plus_1_week": "..."
							},
							...
						}

						SPY data: ${JSON.stringify(marketArray, null, 2)}, 
						${symbol} data: ${JSON.stringify(tickerArray, null, 2)}`
					}
				]
			}
		],
		generationConfig: {
			maxOutputTokens: 1024
		}
	});
	const result = { answer: response.text, marketArray, tickerArray };
	return result;
}

export async function askGemini(marketArray, tickerArray, articleData, symbol) {
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
						`Find the lowest_closing_price, lowest_closing_price_date, lowest_closing_price_date_minus_1_week, lowest_closing_price_date_plus_1_week, highest_closing_price, highest_closing_price_date, highest_closing_price_date_minus_1_week, highest_closing_price_date_plus_1_week,
						determine concisely the macroeconomic topics that led to the highest_closing_price and lowest_closing_price for ${symbol},
						find 5 negative relevant articles between lowest_closing_price_date_minus_1_week and lowest_closing_price_date_plus_1_week, and 5 positive relevant articles between highest_closing_price_date_minus_1_week and highest_closing_price_date_plus_1_week that mention the macroeconomic topics that you picked from the Low news and High news for ${symbol},
						
						then return your answer as JSON-valid in this format:
						{
							"SPY": {
								"lowest_closing_price": "...",
								"lowest_closing_price_date": "...",
								"lowest_closing_price_date_minus_1_week": "...",
								"lowest_closing_price_date_plus_1_week": "...",
								"highest_closing_price": "...",
								"highest_closing_price_date": "...",
								"highest_closing_price_date_minus_1_week": "...",
								"highest_closing_price_date_plus_1_week": "..."
							},
							"${symbol}": {
								"lowest_closing_price": "...",
								"lowest_closing_price_date": "...",
								"highest_closing_price": "...",
								"highest_closing_price_date": "..."
							},
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

						SPY data: ${JSON.stringify(marketArray, null, 2)}
						${symbol} data: ${JSON.stringify(tickerArray, null, 2)}

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