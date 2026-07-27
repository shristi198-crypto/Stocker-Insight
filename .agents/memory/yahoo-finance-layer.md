---
name: Yahoo Finance data layer
description: Why NSE direct API was replaced with yahoo-finance2 and how it is wired up
---

NSE.com (nseindia.com) is Akamai-blocked from Replit cloud IPs — even the homepage returns HTTP 403. Every approach using the `stock-nse-india` library or direct axios calls to nseindia.com will fail.

**Fix:** `yahoo-finance2` v3 (class-based API) provides the same data:
- NSE stocks: `RELIANCE.NS`, `TCS.NS`, etc.
- Indices: `^NSEI` (NIFTY 50), `^NSEBANK`, `^CNXIT`, `^CNXPHARMA`, `^CNXAUTO`, `^CNXFMCG`, `^CNXMETAL`, `^CNXREALTY`, `^CNXENERGY`, `^NSEMDCP50` (NIFTY MIDCAP)

**Why:** NSE's Akamai WAF blocks all cloud-hosted IPs. Yahoo Finance serves Indian stock data without IP restrictions.

**How to apply:** `import YahooFinance from 'yahoo-finance2'; const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });` — must instantiate the class. The default export IS the class (not an instance). Pass `{ validateResult: false }` as third arg to `yf.quote()` to avoid strict schema errors.

Bulk-fetch NIFTY 50 constituents with `yf.quote(['RELIANCE.NS', 'TCS.NS', ...])` to populate both per-stock and index caches in one call. Sector indices fetched separately with individual symbol queries.

Node 20 gives "unsupported environment" warning (requires Node 22) — this is a warning only, the library works fine on Node 20.
