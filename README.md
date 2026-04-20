# delta-mqds

A free, browser-based tool for Delta Air Lines loyalty members to track Medallion Qualification Dollars (MQDs) and forecast progress toward Silver, Gold, Platinum, or Diamond status.

Upload your Delta Account Activity PDFs and see your year-to-date MQDs, pending activity, projected year-end totals, and credit card spending forecasts — all in your browser. No data leaves your device.

## Features

- **PDF import** — client-side parsing of Delta Account Activity statements
- **De-duplication** — re-importing the same statement won't double-count entries
- **Dashboard** — YTD progress, pending MQDs, monthly timeline, and year-end projection
- **Credit card forecast** — project MQD bonuses from card spending
- **Manual entries** — add, edit, filter, and categorize activity
- **CSV export** — download your data for your own records
- **Zero storage** — no backend, no database, no cookies; data lives only in browser memory

## Stack

React 19, TypeScript, Vite, pdf.js

## Run locally

```bash
npm install
npm run dev
```

Build: `npm run build` · Preview: `npm run preview`

## License

MIT
