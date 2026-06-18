# Product Scanner

Mobile-first PWA for field resale: photograph products, get AI identification, check marketplace prices, and post listings to eBay or other marketplaces.

## Features

- **Scan** — photograph products on iPhone (up to 3 photos)
- **Identify** — AI vision identifies brand, model, and condition
- **Price research** — eBay + Google Shopping comps
- **List** — AI-generated marketplace listings
- **Post** — eBay in-app, or Share Sheet to Facebook/Mercari
- **Install** — Add to iPhone Home Screen or Mac Dock (PWA)

## Quick start

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Environment variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Product ID + listing copy |
| `EBAY_CLIENT_ID` / `SECRET` | Price search |
| `SERPAPI_KEY` | Google Shopping prices |
| `EBAY_OAUTH_REDIRECT_URI` | eBay seller connect |
| `NEXT_PUBLIC_APP_URL` | Public URL for PWA install |
| `DEMO_MODE=true` | Mock data without API keys |

## Install on iPhone / Mac

1. Deploy or run over HTTPS (or localhost)
2. Open in **Safari**
3. **iPhone:** Share → Add to Home Screen
4. **Mac:** Share → Add to Dock

See the **Install** tab in the app for full instructions.

## Scripts

```bash
npm run dev        # Development server
npm run dev:pwa    # Dev with service worker enabled
npm run build      # Production build
npm run start      # Production server
npm run icons      # Regenerate PWA icons
```

## Stack

- Next.js 16, React 19, Tailwind CSS, shadcn/ui
- Serwist PWA, Dexie offline queue
- OpenAI GPT-4o vision, eBay Browse + Sell APIs, SerpAPI
- Optional Supabase (see `supabase/migrations/`)

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rocbase/product-scanner)

Set env vars in Vercel dashboard and `NEXT_PUBLIC_APP_URL` to your deployment URL.