# Jones Soda dashboard: Google Sheets backend

## Status (2026-10-16)
The master database has been populated and checked across all nine reporting tabs, with data ending **2026-10-14**. GitHub contains `apps-script/Code.gs`, the server-side Vercel endpoint `api/sheets-data.js`, and the existing dashboard. The live Google Sheets connection **requires one owner-authorized Apps Script deployment** and Vercel environment settings before it can be enabled.

## Owner setup (once only)

1. Open the bound Apps Script editor from [Jones Soda Master Database](https://docs.google.com/spreadsheets/d/1GPKaZ4scDC7J2iDlZvIxvrsXdXFXbyr5e_Ci3iYBHn4/edit).
2. Paste the complete source of `apps-script/Code.gs` in place of the initial setup script; save.
3. Open **Project Settings → Script properties**. Add `JONES_API_TOKEN` with a generated, long random value. Keep it secret.
4. **Deploy → New deployment → Web app**. Set **Execute as: Me**; **Who has access: Anyone**. Authorize and copy the URL ending `/exec`. This does not grant Drive access; the script reads the private bound Sheet using the owner's permissions, and only responds to callers with the secret token.
5. In Vercel → JonesSodaDashboard → Settings → Environment Variables, add **Production** variables:
    - `JONES_SHEETS_WEB_APP_URL` = the Web app `/exec` URL
    - `JONES_SHEETS_API_KEY` = the same secret as `JONES_API_TOKEN`
    - `JONES_DASHBOARD_VIEW_TOKEN` = a **different** shared viewer token for the dashboard
6. Redeploy the latest main commit. In the dashboard use the **Load Google Sheets** action and enter the viewer token. Validate dates and KPIs.

The public GitHub repository must never contain actual tokens, passwords, or personal data. Restrict access to the live dashboard separately (e.g., Vercel Deployment Protection); its current static fallback snapshot is not access-controlled by the Google Sheets token.

## Data quality rules
- Meta, Google conversion counts, and Shopify orders are **different attribution measures** and must not be added together.
- October was imported as updated dates replacing previous overlap; do not append duplicate October rows.
- Google `Conversions` may not equal purchases; label metrics accordingly.
- Shopify October `Orders` by product can be blank when the source report does not supply product-level order counts; do not substitute units for orders without labeling.
- The existing old /admin.html uploader still uses Vercel Blob and is not the Google Sheets write path. Weekly updates can be entered in the private Google Sheet by authorized editors until a verified importer is implemented.
