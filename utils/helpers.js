const options = {
	method: 'GET',
	headers: {
		accept: 'application/json',
		'APCA-API-KEY-ID': process.env.ALPACA_API_KEY,
		'APCA-API-SECRET-KEY': process.env.ALPACA_API_SECRET
	}
};

function getWeekAgo(bool, date) {
	const inputDate = new Date(date);
	if (bool === true) {
		inputDate.setDate(inputDate.getDate() - 7);
	} else {
		inputDate.setDate(inputDate.getDate() + 7);
	}
	const oneWeekAgo = inputDate.toISOString().split('T')[0];

	return oneWeekAgo;
}

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
		console.error('Fetch getComparison() error:', error);
	}
};

const getLowHighPoints = async (marketData, tickerData, symbol) => {
	try {
		const marketDataOriginalArray = marketData.bars.SPY;
		const tickerDataOriginalArray = tickerData.bars[symbol];
		
		const marketArray = marketDataOriginalArray.map(({ c, t }) => ({ c, t: t.substring(0, 10) }));
		const tickerArray = tickerDataOriginalArray.map(({ c, t }) => ({ c, t: t.substring(0, 10) }));

		var mLowestPoint = marketArray.reduce((min, curr) => curr.c < min.c ? curr : min);
		mLowestPoint = { lowest_closing_price: mLowestPoint.c, lowest_closing_price_date: mLowestPoint.t, lowest_closing_price_date_weekago: getWeekAgo(true, mLowestPoint.t), lowest_closing_price_date_weekahead: getWeekAgo(false, mLowestPoint.t) };
		var mHighestPoint = marketArray.reduce((max, curr) => curr.c > max.c ? curr : max);
		mHighestPoint = { highest_closing_price: mHighestPoint.c, highest_closing_price_date: mHighestPoint.t, highest_closing_price_date_weekago: getWeekAgo(true, mHighestPoint.t), highest_closing_price_date_weekahead: getWeekAgo(false, mHighestPoint.t) };
		let SPY = { ...mLowestPoint, ...mHighestPoint };

		var tLowestPoint = tickerArray.reduce((min, curr) => curr.c < min.c ? curr : min);
		tLowestPoint = { lowest_closing_price: tLowestPoint.c, lowest_closing_price_date: tLowestPoint.t, lowest_closing_price_date_weekago: getWeekAgo(true, tLowestPoint.t), lowest_closing_price_date_weekahead: getWeekAgo(false, tLowestPoint.t) };
		var tHighestPoint = tickerArray.reduce((max, curr) => curr.c > max.c ? curr : max);
		tHighestPoint = { highest_closing_price: tHighestPoint.c, highest_closing_price_date: tHighestPoint.t, highest_closing_price_date_weekago: getWeekAgo(true, tHighestPoint.t), highest_closing_price_date_weekahead: getWeekAgo(false, tHighestPoint.t) };
		let TICKER = { ...tLowestPoint, ...tHighestPoint };
		
		let weekData = { SPY, TICKER };

		const result = { weekData, marketArray, tickerArray };
	return result;
	} catch (error) {
		console.error('Fetch getLowHighPoints() error:', error);
	}
}

const getNews = async (weekData, symbol) => {
	const marketLowNewsUrl = `https://data.alpaca.markets/v1beta1/news?start=${weekData.SPY.lowest_closing_price_date_weekago}&end=${weekData.SPY.lowest_closing_price_date_weekahead}&sort=desc&symbols=SPY&limit=50`;
	const tickerLowNewsUrl = `https://data.alpaca.markets/v1beta1/news?start=${weekData.TICKER.lowest_closing_price_date_weekago}&end=${weekData.TICKER.lowest_closing_price_date_weekahead}&sort=desc&symbols=${symbol}&limit=50`;
	const marketHighNewsUrl = `https://data.alpaca.markets/v1beta1/news?start=${weekData.SPY.highest_closing_price_date_weekago}&end=${weekData.SPY.highest_closing_price_date_weekahead}&sort=desc&symbols=SPY&limit=50`;
	const tickerHighNewsUrl = `https://data.alpaca.markets/v1beta1/news?start=${weekData.TICKER.highest_closing_price_date_weekago}&end=${weekData.TICKER.highest_closing_price_date_weekahead}&sort=desc&symbols=${symbol}&limit=50`;

	try {
		const [marketLowNewsResponse, tickerLowNewsResponse, marketHighNewsResponse, tickerHighNewsResponse] = await Promise.all([
			fetch(marketLowNewsUrl, options),
			fetch(tickerLowNewsUrl, options),
			fetch(marketHighNewsUrl, options),
			fetch(tickerHighNewsUrl, options)
		]);
		
		if (!marketLowNewsResponse.ok || !tickerLowNewsResponse.ok || !marketHighNewsResponse.ok || !tickerHighNewsResponse.ok) {
			console.error('Error fetching historical bars:', marketLowNewsResponse.statusText, tickerLowNewsResponse.statusText, marketHighNewsResponse.statusText, tickerHighNewsResponse.statusText);
			return;
		}
		
		const [marketLowNews, tickerLowNews, marketHighNews, tickerHighNews] = await Promise.all([
			marketLowNewsResponse.json(),
			tickerLowNewsResponse.json(),
			marketHighNewsResponse.json(),
			tickerHighNewsResponse.json()
		]);
		
		return { marketLowNews, tickerLowNews, marketHighNews, tickerHighNews };
	} catch (error) {
		console.error('Fetch getNews() error:', error);
	}
}


module.exports = {
	getComparison,
	getLowHighPoints,
	getNews
};