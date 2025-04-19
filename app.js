require('dotenv').config();

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
  
        const data = await response.json();
        console.log(`Latest bar for ${symbol}:`, data);
    } catch (error) {
        console.error('Fetch error:', error);
    }
}
  
async function runIndefinitely(symbol) {
    while (true) {
        await getLatestBar(symbol);
      
        await new Promise(resolve => setTimeout(resolve, 60000));
    }
}
runIndefinitely('SPY');