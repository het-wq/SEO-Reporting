# SEO-Reporting

A live, API-driven SEO Reporting Dashboard for **Boulder Decision** powered by real Google Analytics 4 (GA4), Google Search Console (GSC), Brand Query Intelligence, and Local SEO monitoring.

---

## 🚀 Features

- **Live Google APIs:** Real-time data from GA4 and Google Search Console APIs with automatic token refresh.
- **Dynamic Period Comparison:** Flexible date range filters (Last 28 Days, Last 14 Days, Last 7 Days, Monthly, and Custom Range) with automated prior-period comparison.
- **Key Metrics & KPIs:**
  - **Website Traffic (GA4):** Total Visits, Organic Visits, Direct Visits, Organic New Users, and Engagement Duration.
  - **Search Performance (GSC):** Real Clicks, Impressions, CTR, and Average Ranking Position.
  - **Brand vs Non-Brand Engine:** Automatic classification of brand terms vs non-brand search intent.
  - **Device Breakdown:** Real Desktop vs Mobile performance splits.
  - **Keyword & Landing Page Analytics:** Top ranking queries and landing page impressions and clicks.
  - **PDF Reports Archive:** Interactive multi-page document viewer for historical PDF reports.

---

## 🛠️ How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Start the backend API server
node server.js

# 3. Start the Vite frontend development server
npm run dev
```

Open [http://localhost:5173/](http://localhost:5173/) to view the dashboard.

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env`:

```env
PORT=5001
VITE_BACKEND_URL=http://localhost:5001
GA4_PROPERTY_ID=516707960
GSC_SITE_URL=sc-domain:boulderdecision.com
VITE_GOOGLE_CLIENT_ID=554369952704-mgvmq1tuv1p87rslahtlot1cna8lrt14.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

---

## 🚀 Deploying to Vercel via GitHub

1. Push this project to GitHub:
   ```bash
   git push origin main
   ```
2. Import the repository into [Vercel](https://vercel.com/new).
3. Set your environment variables in Vercel:
   - `VITE_GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GA4_PROPERTY_ID`
   - `GSC_SITE_URL`
4. Update your Authorized Redirect URI in Google Cloud Console to match your Vercel domain:
   - `https://your-domain.vercel.app/api/auth/google/callback`
