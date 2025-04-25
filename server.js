require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

const { getComparison, getNews } = require('./utils/helpers');
const dataCache = new Map();


app.use(express.static('public'));

app.get('/:symbol/datasets', async (req, res) => {
	try {
		const { marketData, tickerData } = await getComparison(req.params.symbol);

		dataCache.set(req.params.symbol + "_datasets", { marketData, tickerData });
    	res.json({ marketData, tickerData });
	} catch (error) {
		console.error('API route error:', error);
		res.status(500).json({ error: 'Failed to fetch data' });
	}
});

app.get('/:symbol/direction', async (req, res) => {
	try {
		const { getLowestPoint } = await import('./gemini.mjs');

		let cache = dataCache.get(req.params.symbol + "_datasets");
		const direction = await getLowestPoint(cache.marketData, cache.tickerData, req.params.symbol);

		dataCache.set(req.params.symbol + "_direction", direction);
		res.json(JSON.parse(direction.replace(/```json/g, '').replace(/```/g, '').trim()));
	} catch (error) {
		console.error('API route error:', error);
		res.status(500).json({ error: 'Failed to fetch data' });
	}
	return
});

app.get('/:symbol/articles', async (req, res) => {
	try {
		const { askGemini } = await import('./gemini.mjs');

		let cache1 = dataCache.get(req.params.symbol + "_datasets");
		let cache2 = dataCache.get(req.params.symbol + "_direction");
		let validNewsData = cache2.replace(/```json/g, '').replace(/```/g, '').trim();

		const articleData = await getNews(JSON.parse(validNewsData), req.params.symbol);
		const apiData = await askGemini(cache1.marketData, cache1.tickerData, articleData, req.params.symbol );

		res.json(apiData);
	} catch (error) {
		console.error('API route error:', error);
		res.status(500).json({ error: 'Failed to fetch data' });
	}
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
