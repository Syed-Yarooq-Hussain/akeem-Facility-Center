# Williams Facility Services GmbH

React 19 + Vite frontend, Node API and MongoDB persistence. Prepared for a Git repository and Vercel. German (default), English and French routes have independent URLs.

## Run locally

Requires Node.js 22 or newer.

```powershell
npm install
Copy-Item .env.example .env
# Enter your MongoDB Atlas connection string in .env
npm run dev
```

Frontend: http://localhost:5173 · Local API: http://127.0.0.1:3001

The website and cart work without MongoDB. Form submissions require a working database and correctly report an error when unavailable. Successful submissions return a reference after MongoDB confirms the write. There is no simulated successful submission.

```powershell
npm test
npm run build
```

## Features

- Responsive home, about, cleaning (all three categories), laundry, facility services, careers and contact pages.
- German, English and French navigation, content, forms, legal drafts and shop.
- Local photographs, branded SVG product illustrations, mobile navigation and WhatsApp link.
- Searchable sample catalog, category filters, product previews, persistent cart, quantities and product quotation requests.
- Cleaning, laundry and career enquiry form with server validation and honeypot.
- MongoDB collections `inquiries` and `orders`. The latter stores **non-binding product enquiries**, not paid purchase orders.
- Trusted catalog prices and totals calculated on the server. Submitted prices are ignored.
- Language metadata, canonical URLs, language alternate links, favicon and robots file.
- Accessible native modal dialogs, keyboard controls, skip link and reduced-motion support.

## Configure

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Private MongoDB Atlas connection string; server only |
| `MONGODB_DB` | Database name; defaults to `williams_facility` |
| `VITE_WHATSAPP_NUMBER` | Public WhatsApp number with country code, digits only |
| `VITE_SITE_URL` | Final public HTTPS origin, without a trailing slash |
| `PORT` | Local API port; defaults to `3001` |

Never put the database URI in a variable prefixed with `VITE_`, commit `.env`, or put credentials in frontend code. Vite variables are public and embedded at build time.

Edit sample products in `shared/catalog.js`, translations in `src/content.js`, and legal draft content in `src/App.jsx`. Product prices use integer euro cents. WhatsApp defaults to a **dummy number**, as requested; replace it before launch. Contact details, credentials, certifications, testimonials and company statistics have not been invented.

## Git and Vercel deployment

Deployment has intentionally been left for the next step requested by the project owner. No repository or public deployment is created by this project.

1. Create a new Git repository in **this project directory**, commit the source and lockfile, and push to your chosen GitHub repository. Do not use a parent directory’s repository.
2. Import the repository into Vercel; select Vite. Build command: `npm run build`; output directory: `dist`. The tracked `vercel.json` configures React page routes and API routes.
3. Add `MONGODB_URI`, `MONGODB_DB`, `VITE_WHATSAPP_NUMBER` and `VITE_SITE_URL` in Vercel’s environment settings. Redeploy when public Vite variables change.
4. In Atlas, create a database user limited to this database, configure network access for the deployment environment, and keep connection credentials private.
5. Send a real inquiry and product inquiry. Check their returned references against documents in Atlas. No email notification or admin interface is included: enquiries are stored in MongoDB.

## Required client input before production

- Actual business address, managing director, company registration, VAT ID, email, phone and WhatsApp number.
- Actual product catalog, photos, availability, pricing and delivery terms. Current products and prices are clearly labeled examples.
- Final service coverage, working hours and hiring details.
- Final legal review and completed legal notice, privacy information, terms, delivery information and withdrawal documentation, as applicable to the actual business model.
- Production domain and MongoDB Atlas URI. Retention, deletion and access policies must match actual operational practices.

The current shop collects **quotation requests**. It does not take payments or create binding sales contracts. A payment provider, confirmed inventory, shipping rules, final contractual documents and purchase confirmation workflow are needed if direct online checkout is required.

Do not publish draft legal pages as final legal compliance. Database APIs store requests only; connect notifications or an authenticated back office if the team needs to manage them outside Atlas. Configure production abuse prevention/rate limits at the hosting edge before a public launch.

## Assets

Stock photography: Unsplash (see `public/images/CREDITS.md`), embedded unchanged in portable SVG containers. Product visuals are original SVG illustrations rendered in React; sample packaging is illustrative. Replace with verified client product images for the final catalog. DM Sans and Manrope are bundled locally in `src/fonts.css`; their licenses are in `licenses/`. Loading the website does not request external image or font services.

## Verification performed

The production build passed, along with six API tests. Chrome checks covered 36 desktop pages and 18 mobile pages, all business images, product search, cart persistence and totals, language switching, mobile navigation and database-unavailable form handling. Actual MongoDB writes still require the client's Atlas connection string; handler persistence was verified with a test database adapter.

Optional repeatable browser checks: install Playwright locally with `npm install --no-save --package-lock=false playwright`, start `npm run dev`, and run `node scripts/browser-check.mjs` with Chrome installed. Screenshots are saved in ignored `test-results/`. The failure-path browser check expects MongoDB to be unconfigured.

In this Codex session Windows rejected shell-created files in the Documents workspace, so dependencies, build output and browser verification ran in a temporary mirror. All source files, photos, fonts, lockfile and configuration are saved in the requested workspace. If `npm install` encounters the same restriction on your machine, move the project to a normal writable development folder and run the commands there.
