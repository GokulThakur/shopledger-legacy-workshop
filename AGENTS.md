# Repository Guidelines

## Stack

ShopLedger uses Node.js with CommonJS, Express 4, and `body-parser`. The browser UI is plain HTML, CSS, and JavaScript; application data is stored in `data/db.json`. No build tool, formatter, linter, or test framework is configured.

## Module Map

- `server.js` starts Express, serves `public/`, mounts API routers, and serves printable invoices.
- `routes/` contains HTTP handlers: `products.js`, `orders.js`, `customers.js`, and `reports.js`.
- `lib/` contains business logic: `orders.js`, `pricing.js`, `tax.js`, `coupons.js`, `inventory.js`, `ledger.js`, `invoice.js`, `reports.js`, `dates.js`, and `store.js`.
- `public/` contains the UI (`index.html`, `js/app.js`, `css/style.css`); `config.js` contains app and shop settings; `data/db.json` contains local records.

## Commands

- `npm start` — run the app with Node.js (default port `3000`, overridable with `PORT`).
- `npm test` — currently exits with an error because no test suite is configured.

There is no build command.

## Change and Test Rules

- Before changing behavior, write characterization tests that capture the existing behavior relevant to the ticket.
- Keep each change within the module the ticket is about. Do not make unrelated cleanup or edits in neighboring modules.
- Tests must never read from or write to `data/db.json`; use isolated test data and temporary files when persistence behavior needs coverage.
- Do not add dependencies. Use the existing Node.js and package tooling.
