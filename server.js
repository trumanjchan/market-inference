require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const port = 3000;


const options = {
	method: 'GET',
	headers: {
		accept: 'application/json',
		'APCA-API-KEY-ID': process.env.APCA_API_KEY_ID,
		'APCA-API-SECRET-KEY': process.env.APCA_API_SECRET_KEY
	}
};
async function getLatestBar(symbol) {
	const url = `https://data.alpaca.markets/v2/stocks/${symbol}/bars/latest?feed=delayed_sip&currency=USD`;
	try {
		const response = await fetch(url, options);

		if (!response.ok) {
			console.error('Error fetching latest bar:', response.statusText);
			return;
		}

		data = await response.json();
		return data;
	} catch (error) {
		console.error('Fetch error:', error);
	}
}
async function runIndefinitely(symbol) {
	while (true) {
		await getLatestBar(symbol);

		await new Promise(resolve => setTimeout(resolve, 5000));
	}
}
runIndefinitely('SPY');

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/data', (req, res) => {
	res.json(data);
});

app.listen(port, () => {
	console.log(`Server running at http://localhost:${port}`);
});
