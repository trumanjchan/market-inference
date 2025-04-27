import { GoogleGenAI } from "@google/genai";
import { marked } from 'marked';
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
							SPY: {
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
	const result = response.text;
	return result;
}

export async function askGemini(marketData, tickerData, articleData, symbol) {
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
						2) make judgement on whether it is due to earnings, mergers or acquisitions, Fed interest rate announcement, CPI report, jobs report, or unemployment report
						3) pick and choose 10 articles that are likely factors that contributed to ${symbol}'s price dip. Include date published and article url.
						markup text format without asterisks.

						SPY data: ${JSON.stringify(marketData.bars.SPY, null, 2)}, 
						${symbol} data: ${JSON.stringify(tickerData.bars[symbol], null, 2)}, 

						SPY news: ${JSON.stringify(articleData.marketNews.news, null, 2)}
						${symbol} news: ${JSON.stringify(articleData.tickerNews.news, null, 2)}`
					}
				]
			}
		]
	});
	const result = marked(response.candidates[0].content.parts[0].text);
	return result;
}