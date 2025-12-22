# Market Inference

<img src="assets/demo.gif" alt="demo gif" width="100%">

Using Alpaca Markets for historical bars, Finnhub for company news, and a Google Gemini model to analyze stock and market article datasets within a week range of a stock's peak and dip in the past year and present 5 positive and 5 negative macroeconomic factors and supporting articles that may have influenced the stock's peak and dip.

Initially used Alpaca Markets' News API for fetching articles but their only news source is Bezinga. Although Finnhub has less generous free tier rates, their articles come from various news sources such as MarketWatch, Yahoo, DowJones, and SeekingAlpha where some articles are not locked behind a login or paywall modal and some have article content instead of just a headline.

## App Workflow
1. Graph percent change over 1 year for SPY vs TICKER
2. Find the peak and dip values and dates for SPY and TICKER, and peak and dip week ranges for TICKER
3. Get SPY and TICKER news articles dated within TICKER's peak and dip week ranges
4. Ask Gemini to determine the 5 positive and 5 negative macroeconomic factors and supporting articles that mention TICKER within TICKER peak and dip week ranges from the High/Low SPY-News and High/Low Stock-News article datasets

### Notable Features
- Cache - reduces repetitive Gemini calls, fast data delivery
- User definable Gemini model - uses a default model from env unless specified
- Shareable links - show your friends the next value play
- Error handling - error pop-ups for user experience
- Loading handling - breathing indicator for user experience
- Responsive - view the site on your desktop or mobile
- Various news sources - not limited to one single source for articles
- Macroeconomic factors and articles within 1 week of stock's High and Low

<details>

<summary>Local Development</summary>

```bash
git clone <repo>
npm i
```

Create a `.env` file with:
```
ALPACA_API_KEY=
ALPACA_API_SECRET=
FINNHUB_API_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=
```

Then run:
```bash
npm start
```

Navigate to `http://localhost:3000/`

</details>