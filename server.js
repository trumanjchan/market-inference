require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const port = 3000;


const options = {
	method: 'GET',
	headers: {
		accept: 'application/json',
		'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
		'APCA-API-SECRET-KEY': process.env.ALPACA_API_SECRET
	}
};
async function getComparison(symbol) {
	const today = new Date();
	const todayFormattedDate = today.toISOString().split('T')[0] + 'T00%3A00%3A00Z';
	today.setFullYear(today.getFullYear() - 1);
	const yearAgoFormattedDate = today.toISOString().split('T')[0] + 'T00%3A00%3A00Z';

	const marketUrl = `https://data.alpaca.markets/v2/stocks/bars?symbols=SPY&timeframe=1Day&start=${yearAgoFormattedDate}&end=${todayFormattedDate}&limit=2000&adjustment=split&feed=sip&sort=asc`;
	const symbolUrl = `https://data.alpaca.markets/v2/stocks/bars?symbols=${symbol}&timeframe=1Day&start=${yearAgoFormattedDate}&end=${todayFormattedDate}&limit=2000&adjustment=split&feed=sip&sort=asc`;

	try {
		const [response1, response2] = await Promise.all([
			fetch(marketUrl, options),
			fetch(symbolUrl, options)
		]);
		
		if (!response1.ok || !response2.ok) {
			console.error('Error fetching historical bars:', response1.statusText, response2.statusText);
			return;
		}
		
		const [data1, data2] = await Promise.all([
			response1.json(),
			response2.json()
		]);
		
		return { data1, data2 };
	} catch (error) {
		console.error('Fetch error:', error);
	}
}
async function getNewsArticles(validNewsData, symbol) {
	const marketNewsUrl = `https://data.alpaca.markets/v1beta1/news?start=${validNewsData.SPY.lowest_closing_price_date_minus_1_week}&end=${validNewsData.SPY.lowest_closing_price_date_plus_1_week}&sort=desc&symbols=SPY&limit=10`;
	const symbolNewsUrl = `https://data.alpaca.markets/v1beta1/news?start=${validNewsData[symbol].lowest_closing_price_date_minus_1_week}&end=${validNewsData[symbol].lowest_closing_price_date_plus_1_week}&sort=desc&symbols=${symbol}&limit=10`;

	try {
		const [marketNewsResponse, symbolNewsResponse] = await Promise.all([
			fetch(marketNewsUrl, options),
			fetch(symbolNewsUrl, options)
		]);
		
		if (!marketNewsResponse.ok || !symbolNewsResponse) {
			console.error('Error fetching historical bars:', marketNewsResponse.statusText, symbolNewsResponse.statusText);
			return;
		}
		
		const [marketNews, symbolNews] = await Promise.all([
			marketNewsResponse.json(),
			symbolNewsResponse.json()
		]);
		
		return { marketNews, symbolNews };
	} catch (error) {
		console.error('Fetch error:', error);
	}
}


app.use(express.static(path.join(__dirname, 'public')));

app.get('/:symbol', async (req, res) => {
	res.sendFile(__dirname + '/public/index.html');
});

app.get('/:symbol/api/data', async (req, res) => {
	try {
		const { getLowestPoint } = await import('./gemini.mjs');
		const { askGemini } = await import('./gemini.mjs');


		const { data1, data2 } = await getComparison(req.params.symbol);  //graph data

		const newsData = await getLowestPoint(data1, data2, req.params.symbol);  //analyze graph data --> get lowest_closing_price and date of, and 1 week date range
		
		let validNewsData = newsData.replace(/```json/g, '').replace(/```/g, '').trim();
		const newsArticles = await getNewsArticles(JSON.parse(validNewsData), req.params.symbol);  //get ALL news articles in this 1 week period

		const apiData = await askGemini(data1, data2, newsArticles, req.params.symbol );  //ask Gemini to find any correlation between the two datasets, and choose 10 news articles that are likely explanations for the dip in price for the specified stock.


		const combined = {
			AlpacaApi: { data1, data2 },
			GeminiApi: apiData,
		};

		res.json(combined);
	} catch (error) {
		console.error('API route error:', error);
		res.status(500).json({ error: 'Failed to fetch data' });
	}
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
