require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

const { getComparison, getNews } = require('./utils/helpers');


app.use(express.static(path.join(__dirname, 'public')));

app.get('/:symbol/datasets', async (req, res) => {
	try {
		const { marketData, tickerData } = await getComparison(req.params.symbol);

    	res.json({ marketData, tickerData });
	} catch (error) {
		console.error('API route error:', error);
		res.status(500).json({ error: 'Failed to fetch data' });
	}
});

app.get('/:symbol/direction', async (req, res) => {
	try {
		const { getLowestPoint } = await import('./gemini.mjs');

		const { marketData, tickerData } = await getComparison(req.params.symbol);
		const direction = await getLowestPoint(marketData, tickerData, req.params.symbol);

		res.json(JSON.parse(direction.replace(/```json/g, '').replace(/```/g, '').trim()));
	} catch (error) {
		console.error('API route error:', error);
		res.status(500).json({ error: 'Failed to fetch data' });
	}
	return
});

app.get('/:symbol/articles', async (req, res) => {
	try {
		const { getLowestPoint } = await import('./gemini.mjs');
		const { askGemini } = await import('./gemini.mjs');


		const { marketData, tickerData } = await getComparison(req.params.symbol);  //graph data

		const newsData = await getLowestPoint(marketData, tickerData, req.params.symbol);  //analyze graph data --> get lowest_closing_price and date of, and 1 week date range
		
		let validNewsData = newsData.replace(/```json/g, '').replace(/```/g, '').trim();
		const articleData = await getNews(JSON.parse(validNewsData), req.params.symbol);  //get ALL news articles in this 1 week period

		const apiData = await askGemini(marketData, tickerData, articleData, req.params.symbol );  //ask Gemini to find any correlation between the two datasets, and choose 10 news articles that are likely explanations for the dip in price for the specified stock.


		res.json(apiData);
	} catch (error) {
		console.error('API route error:', error);
		res.status(500).json({ error: 'Failed to fetch data' });
	}
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
