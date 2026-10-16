# Jones Soda: Daily Google Sheets update SOP

**One-time owner action:** The connected Apps Script web app must be updated from [apps-script/Code.gs](apps-script/Code.gs), saved, and **Deploy → Manage deployments → Edit → New version → Deploy**. Pillar Vercel must deploy the latest main commit. Without those two actions, the website still uses its GitHub fallback for Shopify referrer reports.

## Keerthana's daily workflow

1. Export **yesterday's completed day** from Meta Ads, Google Ads, Shopify and Klaviyo. Use the same reporting timezone for each platform, and clearly note discrepancies.
2. In [Jones Soda Master Database](https://docs.google.com/spreadsheets/d/1GPKaZ4scDC7J2iDlZvIxvrsXdXFXbyr5e_Ci3iYBHn4/edit), update only each source's matching tab. Replace rows for that day and grain instead of appending duplicates.
3. For `Shopify_Referrers`, use the Shopify **Sessions by referrer** report, grouped by day and referrer. Combine Facebook and Instagram rows into a single `Facebook/Instagram` row, and combine all remaining referrers into `Other`. Append **exactly two rows per day** with columns:
   - `Period`: `day`
   - `Date`: `YYYY-MM-DD`
   - `Channel`: `Facebook/Instagram` or `Other`
   - `Sessions`
   - `Cart_Additions`
   - `Reached_Checkout`
   - `Completed_Checkout`.
4. **Do not overwrite historical week/month baselines.** These reflect the April 1 to October 14 initial backfill. Enter daily referrer rows **only for dates after October 14, 2026** unless performing a full, coordinated historical replacement. Each daily row is automatically rolled up into its week and month, supplementing the existing historical baseline. A repeated date/channel pair should be **replaced**, never appended.
5. Update `Update_Log` with owner, dataset, date, row count and exceptions.
6. Load the dashboard, confirm the live status says `Google Sheets synced`, and inspect spend, purchases, revenue, funnel and demographic counts. If sync fails, the dashboard may display **old GitHub fallback data**. Do not report that as updated.

**Metric caution:** Shopify Facebook/Instagram referrals include organic as well as paid sessions. Meta Ads attribution is different. Avoid summing Klaviyo-attributed revenue with actual Shopify revenue.

The historical Shopify referrer data is stored in Google Sheets as 72 weekly/monthly rows. Updating Sheet cells will refresh the channel-level funnel after Apps Script redeployment.
