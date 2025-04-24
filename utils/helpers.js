const options = {
	method: 'GET',
	headers: {
		accept: 'application/json',
		'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
		'APCA-API-SECRET-KEY': process.env.ALPACA_API_SECRET
	}
};

const getComparison = async (symbol) => {
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

		const [marketData, tickerData] = await Promise.all([
			response1.json(),
			response2.json()
		]);

		return { marketData, tickerData };
	} catch (error) {
		console.error('Fetch error:', error);
	}
};

const getNews = async (articleData, symbol) => {
	const marketNewsUrl = `https://data.alpaca.markets/v1beta1/news?start=${articleData.SPY.lowest_closing_price_date_minus_1_week}&end=${articleData.SPY.lowest_closing_price_date_plus_1_week}&sort=desc&symbols=SPY&limit=10`;
	const tickerNewsUrl = `https://data.alpaca.markets/v1beta1/news?start=${articleData[symbol].lowest_closing_price_date_minus_1_week}&end=${articleData[symbol].lowest_closing_price_date_plus_1_week}&sort=desc&symbols=${symbol}&limit=10`;

	try {
		const [marketNewsResponse, tickerNewsResponse] = await Promise.all([
			fetch(marketNewsUrl, options),
			fetch(tickerNewsUrl, options)
		]);
		
		if (!marketNewsResponse.ok || !tickerNewsResponse) {
			console.error('Error fetching historical bars:', marketNewsResponse.statusText, tickerNewsResponse.statusText);
			return;
		}
		
		const [marketNews, tickerNews] = await Promise.all([
			marketNewsResponse.json(),
			tickerNewsResponse.json()
		]);
		
		return { marketNews, tickerNews };
	} catch (error) {
		console.error('Fetch error:', error);
	}
}


module.exports = {
	getComparison,
	getNews
};