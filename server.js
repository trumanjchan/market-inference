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
	const newsUrl = `https://data.alpaca.markets/v1beta1/news?start=${yearAgoFormattedDate}&end=${todayFormattedDate}&sort=desc&symbols=${symbol}&limit=50`;
	try {
		const [response1, response2, response3] = await Promise.all([
			fetch(marketUrl, options),
			fetch(symbolUrl, options),
			fetch(newsUrl, options)
		]);
		
		if (!response1.ok || !response2.ok) {
			console.error('Error fetching historical bars:', response1.statusText, response2.statusText);
			return;
		}
		if (!response3.ok) {
			console.error('Error fetching news articles:', response3.statusText);
			return;
		}
		
		const [data1, data2, news] = await Promise.all([
			response1.json(),
			response2.json(),
			response3.json()
		]);
		
		return { data1, data2, news };
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
		const { data1, data2, news } = await getComparison(req.params.symbol);

		const { runGemini } = await import('./gemini.mjs');
		const apiData = await runGemini(data1, data2, req.params.symbol, news);


		const combined = {
			AlpacaApi: { data1, data2, news },
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
