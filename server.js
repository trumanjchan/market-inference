require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

const { getComparison, getLowHighPoints, getNews } = require('./utils/helpers');
const dataCache = new Map();


app.use(express.static(path.join(__dirname, 'public')));

app.get('/:symbol', (req, res) => {
	res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/:symbol/datasets', async (req, res) => {
	if (dataCache.get(req.params.symbol + "_datasets")) {
		let cache = dataCache.get(req.params.symbol + "_datasets");
		let marketData = cache.marketData;
		let tickerData = cache.tickerData;
		res.json({ marketData, tickerData });
		return
	}

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
	if (dataCache.get(req.params.symbol + "_direction")) {
		let cache = dataCache.get(req.params.symbol + "_direction");
		res.json(cache);
		return
	}

	try {
		let cache = dataCache.get(req.params.symbol + "_datasets");
		const direction = await getLowHighPoints(cache.marketData, cache.tickerData, req.params.symbol);

		dataCache.set(req.params.symbol + "_direction", direction);
		res.json(direction);
	} catch (error) {
		console.error('API route error:', error);
		res.status(500).json({ error: 'Failed to fetch data' });
	}
	return
});

app.get('/:symbol/gemini', async (req, res) => {
	if (dataCache.get(req.params.symbol + "_gemini")) {
		let cache = dataCache.get(req.params.symbol + "_gemini");
		res.json(cache);
		return
	}

	try {
		const { askGemini } = await import('./gemini.mjs');

		let cache = dataCache.get(req.params.symbol + "_direction");
		const articleData = await getNews(cache.weekData, req.params.symbol);

		const apiData = await askGemini(cache.weekData, articleData, req.params.symbol);

		dataCache.set(req.params.symbol + "_gemini", JSON.parse(apiData.replace(/```json/g, '').replace(/```/g, '').trim()));
		res.json(JSON.parse(apiData.replace(/```json/g, '').replace(/```/g, '').trim()));
	} catch (error) {
		console.error(error.message);
		res.status(500).json(error.message);
	}
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
