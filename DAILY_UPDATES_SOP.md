# Jones Soda Dashboard | Daily Reporting SOP

**Owner:** Keerthana Jawahar  
**Backup/reviewer:** Head of Growth & Performance  
**Frequency:** Every working day, after the previous US reporting day has closed  
**Master database:** https://docs.google.com/spreadsheets/d/1GPKaZ4scDC7J2iDlZvIxvrsXdXFXbyr5e_Ci3iYBHn4/edit  
**Dashboard:** Open the Jones Soda dashboard hosted in Pillar's Vercel project with the shared viewer password  
**Data cutoff:** All initial data runs through **October 14, 2026**. Start routine inserts with October 15, 2026. Historic corrections are allowed when explicitly replacing the corresponding records.

## Step 1. Set the reporting date and create an export folder

1. Identify **D = the last complete reporting day in the ad account / store time zone**, not necessarily yesterday in India.
2. Check whether Meta, Google, Shopify and Klaviyo use the same time zone. Record exceptions in the Update_Log.
3. Create a daily folder under the team's reporting storage, such as `Jones Soda/Daily Exports/YYYY-MM-DD/`.
4. Use file names like `Jones_Meta_Ads_YYYY-MM-DD.csv`, `Jones_Shopify_Referrers_YYYY-MM-DD.csv`. Keep the raw originals unchanged as backup.
5. If the platform has late-attributed conversions, use **D-2 through D** as the export window, then **replace**, not append, existing sheet records for that full range. Use the same corrected window for any platform whose numbers changed.

## Step 2. Meta Ads, ad-level performance

1. Open **Meta Ads Manager**, select the **Jones Soda** ad account.
2. Set **Columns → Customize columns**. Include Campaign name, Ad set name, Ad name, Amount spent, Impressions, Reach, Link clicks (or the exact Clicks definition used in the existing report), Landing page views, Adds to cart, Initiate checkouts, Purchases and Purchases conversion value. If the report uses `Clicks (all)` instead of `Link clicks`, flag the difference; it changes CTR interpretations.
3. Set **Breakdown → By time → Day**; keep the report at the **Ads** level. **No age or gender breakdown in this file**.
4. Set dates to D (or the full D-2–D replacement window). Export CSV with the reporting-time-zone date visible.
5. Open the `Meta_Ads` sheet. Use these **exact headers in this order**:
   `Date | Campaign | Ad_Set | Ad | SKU | Spend | Impressions | Reach | Clicks | Landing_Page_Views | Add_To_Cart | Checkouts | Purchases | Purchase_Value`.
6. Map platform columns: Day → Date; Campaign name → Campaign; Ad set name → Ad_Set; Ad name → Ad; Amount spent → Spend; Impressions → Impressions; Reach → Reach; Link clicks → Clicks; Landing page views → Landing_Page_Views; Adds to cart → Add_To_Cart; Checkouts initiated → Checkouts; Purchases → Purchases; Purchases conversion value → Purchase_Value.
7. **SKU is a manually mapped normalized category**, not a native Meta export field. Use the established sheet naming convention (e.g. `Orange Rocket Bottle`, `Orange 4-Pack`, `Other`), consistently with the historical tab. Do not treat an ad's naming guess as authoritative without reviewing its advertised product.
8. Delete only the rows whose Date is in the replacement window, then append the newly mapped rows. Confirm **Date + Campaign + Ad_Set + Ad** is unique at the imported grain. More than one row is valid only if there is an additional dimension being explicitly captured (otherwise fix the export).

## Step 3. Meta demographics: separate age and gender exports

1. Remain in **Meta Ads Manager**. Use the same account, date range and performance measures.
2. For age, use **Breakdown → By delivery → Age** with **campaign** as the reporting entity; **do not combine Gender** in this export. Export CSV.
3. For gender, change breakdown to **Gender** only, again at the campaign level. Export a second CSV.
4. In `Meta_Age`, use:
   `Date | Campaign | SKU | Age | Spend | Impressions | Clicks | Purchases | Purchase_Value`.
5. In `Meta_Gender`, use:
   `Date | Campaign | SKU | Gender | Spend | Impressions | Clicks | Purchases | Purchase_Value`.
6. Map Meta's Date / Campaign name / Age or Gender / Amount spent / Impressions / Link clicks / Purchases / Purchases conversion value to those columns. Keep `SKU` consistent with the main Meta tab.
7. Delete-and-replace the affected dates in each demographic tab. **Never sum age and gender rows together**: they are two views of the same spend and conversions.
8. Reconcile each breakdown's total spend against the main Meta report. Meta privacy thresholds and uncategorized buckets can cause differences, so record any exception rather than forcing numbers to match.

## Step 4. Google Ads campaign performance

1. Open **Google Ads → Campaigns** in the Jones Soda account.
2. Choose **Columns → Modify columns**. Include Campaign, Cost, Impressions, Clicks, Conversions, Conversion value. Keep any optional Ad group field only if the exported report is at the ad-group grain.
3. Set **Segment → Time → Day**. If using campaign view, keep one line **per date per campaign**; do not introduce ad group breakdown while leaving duplicated campaign totals in place.
4. Select D or the agreed replacement window and **Download → CSV**.
5. Update `Google_Ads` with:
   `Date | Campaign | Ad_Group | SKU | Spend | Impressions | Clicks | Conversions | Conversion_Value`.
6. Map Day → Date; Campaign → Campaign; Ad group → Ad_Group (leave empty for campaign-level exports); Cost → Spend; Impressions → Impressions; Clicks → Clicks; Conversions → Conversions; Conversion value → Conversion_Value.
7. Map `SKU` from the campaign's actual product targeting where supported; otherwise use `Unattributed / Other`.
8. Replace overlapping dates. Validate total spend and conversions against Google Ads. **Google conversions do not necessarily mean ecommerce purchases**.

## Step 5. Shopify product sales

1. Open **Shopify Admin → Analytics → Reports**.
2. Search **Total sales by product**.
3. Set the reporting date D or the agreed replacement window. Export CSV.
4. Preserve the native product name and all net/gross sales, discounts and returns fields. Identify whether the exported report reports **net items**, **orders**, or both.
5. Update `Shopify_Sales`:
   `Date | Product | SKU | Orders | Net_Items | Gross_Sales | Discounts | Sales_Reversals | Net_Sales | Total_Sales`.
6. Map Day → Date; product title → Product; normalised product group → SKU; Net quantity → Net_Items; Gross sales → Gross_Sales; Discounts → Discounts; Returns/reversals → Sales_Reversals; Net sales → Net_Sales; Total sales → Total_Sales.
7. **Orders:** Leave blank when the Shopify report does not explicitly supply a defensible product-level order count. Do not copy Net_Items into Orders.
8. Include returns and negative net-item rows; they are valid. Replace matching dates/product records. Check summed Net_Sales against the selected Shopify report, accounting for report-specific filters.

## Step 6. Shopify overall website conversion funnel

1. Shopify **Analytics → Reports → Conversion rate breakdown**.
2. Group by **Day**; set D or the replacement window.
3. Export the fields Sessions, Sessions with cart additions, Sessions that reached checkout, Sessions that completed checkout and Conversion rate.
4. Update `Shopify_Funnel`:
   `Date | Sessions | Added_To_Cart | Reached_Checkout | Completed_Checkout | Conversion_Rate`.
5. Use **one row per day for the entire website**. Do not paste channel-referrer rows here.
6. Normalize conversion rate as a **fraction** (e.g. 0.021 for 2.1%) if the sheet is using the historical decimal format.
7. Replace existing records for affected dates. Validate that a date has exactly one row and the date-level totals agree with Shopify.

## Step 7. Shopify sessions by referrer: channel-level funnel

1. Shopify **Analytics → Reports → Sessions by referrer**.
2. In **Customize**, set dimensions to **Day** and **Referrer name** (add Referrer source if offered). Remove **Session city**.
3. Under **Sessions and behavior**, include **Sessions**, **Sessions with cart additions**, **Sessions that reached checkout**, **Sessions that completed checkout**. Remove unique visitors if not needed.
4. Set D or D-2 through D. Apply and export CSV.
5. Review actual referrer names. Group explicitly identified `facebook`, `instagram`, `m.facebook`, `l.facebook`, `lm.facebook`, `instagram.com` and recognizable equivalents into **Facebook/Instagram**. Put remaining referring sources, Direct and unclassified traffic into **Other**. Keep a documented mapping for ambiguous referrers. This is **referral-source reporting**, not a precise paid-Meta split.
6. For each date add **exactly 2 rows** to `Shopify_Referrers`:
   `Period | Date | Channel | Sessions | Cart_Additions | Reached_Checkout | Completed_Checkout`.
   Enter `day` in Period, `YYYY-MM-DD` in Date, and Channel as exactly `Facebook/Instagram` or `Other`.
7. Sum each of the four Shopify metrics across referrers **within that date** to create the two rows. Replace matching day + Channel records on re-import.
8. **Keep the preloaded historical `week` and `month` rows through Oct 14 unchanged.** The Apps Script builds rolling week/month summaries from *new daily rows* and adds them to the historical baseline.
9. Critical: for corrections to **Oct 14 or earlier**, coordinate a full historical referrer backfill/replacement; entering a `day` row alongside an already aggregated old `week` or `month` baseline will **double count** that date.
10. Cross-check `Facebook/Instagram + Other` against Shopify's overall sessions and funnel stages, allowing for different report filters; note discrepancies.

## Step 8. Klaviyo campaigns

1. Open **Klaviyo → Campaigns**. Select the date window. Export campaign performance (CSV).
2. Use the final message send date, campaign name, channel, total recipients, delivered, unique opens, unique clicks, attributed orders, conversion value/revenue, and unsubscribes.
3. Update `Klaviyo_Campaigns`:
   `Send_Date | Campaign | Channel | Recipients | Delivered | Opens | Clicks | Orders | Revenue | Unsubscribes`.
4. Map report-native fields to these headers. Use the same attribution setting as the existing baseline.
5. Do **not** delete and replace every campaign by send date blindly: campaign metrics can mature after the send. Update rows keyed by **Send_Date + Campaign + Channel** using the latest cumulative metrics. Re-pull recently sent campaigns when validating.
6. For unique clicks vs total clicks, use whichever convention the baseline uses, documenting any deviation.

## Step 9. Klaviyo flows

1. Open **Klaviyo → Analytics → Metrics / Flow analytics**, or the flow reporting export used for the existing historical `Klaviyo_Flows` tab.
2. Export **daily** message-level metrics: date, flow name, message name, channel, delivered, opens, clicks, attributed orders and attributed revenue.
3. Set date range to D (or replacement window) and ensure **time breakdown = Day**, **grain = flow message**. Do not paste lifetime-total performance as a daily row.
4. Update `Klaviyo_Flows`:
   `Date | Flow | Message | Channel | Delivered | Opens | Clicks | Orders | Revenue`.
5. Replace records matching **Date + Flow + Message + Channel**. Validate daily sums against the flow report.

## Step 10. Klaviyo subscriber changes

1. Open **Klaviyo → Analytics → Subscriber growth** (or the same Subscriber Growth report used for the original import).
2. Filter to **Email** and set D or the replacement window; export daily **New subscribers** and **Email exclusions**.
3. Update `Klaviyo_Subscribers`:
   `Date | Channel | New_Subscribers | Exclusions | Net_Growth`.
4. Set Channel to `Email`. Exclusions should be a positive count. Compute `Net_Growth = New_Subscribers - Exclusions`.
5. Replace **Date + Channel** rows. Reconcile totals with Klaviyo's report. Record unexplained spikes in exclusions separately.

## Step 11. Deduplication and Google Sheet hygiene

1. **Do not change row 1 headers** or tab names. Do not insert summary rows among the source records.
2. Replace existing rows at the correct grain:
   - Meta Ads: Date + Campaign + Ad_Set + Ad (+ SKU where relevant).
   - Meta demographics: Date + Campaign + SKU + Age (or Gender).
   - Google Ads: Date + Campaign + Ad_Group + SKU.
   - Shopify Sales: Date + Product + SKU (plus additional product variant dimensions only if consistently tracked).
   - Shopify Funnel: Date.
   - Shopify Referrers: Period + Date + Channel.
   - Klaviyo Campaigns: Send_Date + Campaign + Channel.
   - Klaviyo Flows: Date + Flow + Message + Channel.
   - Klaviyo Subscribers: Date + Channel.
3. Where the source's export uses extra dimensions not preserved in the sheet, **aggregate them first** to the sheet's row grain. Otherwise separate rows can look like duplicates and inflate reporting.
4. Paste numeric values, not strings with commas, currency symbols, or percent signs. Avoid unintended formulas. Dates should be `YYYY-MM-DD`.
5. Before replacing a large date range, duplicate the Sheet or export the current tab as backup.

## Step 12. Update the log

In `Update_Log`, add one row **per dataset** with:
`Updated_At | Updated_By | Dataset | Rows_Processed | Status`.

Example:
`2026-10-16 11:00 | Keerthana | Shopify_Referrers | 2 | Updated 2026-10-15; Facebook/Instagram and Other reconcile to Shopify referrer export`.

Record any missing data, changes in attribution settings, failed exports or unusual drops.

## Step 13. Verify the live dashboard

1. Open the Pillar Jones Soda dashboard in the browser, sign in using the **shared dashboard password**, and wait for **Google Sheets synced**.
2. Check the reporting date for Meta, Google, Shopify and Klaviyo. Do not confuse today's sync timestamp with the latest source-data date.
3. Check Meta and Google spend/conversions; Shopify net sales and session funnel; Meta age/gender breakdowns; Klaviyo campaigns, flows and subscriber growth; and the Facebook/Instagram vs Other referrals view.
4. Select **Day over day** for the latest recorded dates and verify those numbers. Check week/month totals around month-end.
5. If the dashboard says **Live sync unavailable**, it can display a **GitHub fallback snapshot** instead. This is **not a successful daily update**. Escalate the failure, and never tell stakeholders the dashboard has refreshed based only on the visible old charts.

## Step 14. Completion message

Post in the Growth channel:

> Jones Soda dashboard updated through **[reporting date]**. Meta, Google Ads, Shopify and Klaviyo exports uploaded to the master Google Sheet and validated. Live Sheets sync checked on the dashboard. Exceptions: **[None / concise details]**.

## Troubleshooting

- **Daily numbers double:** Likely overlapping date imports or duplicate Date/Channel keys. Restore or replace matching rows rather than appending.
- **Shopify referrer week/month inflated:** Check whether pre-Oct-15 daily rows were added on top of baseline weekly/monthly records.
- **Meta LPV rates show N/A:** The landing page views export may be zero/unreported. Verify Meta's LPV metric and pixel rather than entering made-up numbers.
- **Shopify Orders blank:** Original product report lacks reliable product order counts. Do not substitute item quantities.
- **Live sync fails:** Confirm Apps Script latest deployment, Vercel Production env, and reporting tab format. Do not expose API secrets in support messages.
- **Google Sheets changes not visible:** Confirm Apps Script and Pillar Vercel were redeployed after the Shopify_Referrers integration. The dashboard can fall back to saved GitHub records.

## Implementation limits that require attention

- The comparison “Facebook/Instagram vs Other” is a **Shopify referrer split**, not a verified paid Meta vs non-Meta acquisition classification.
- The data integration reads Google Sheets on dashboard refresh. Raw file export, header mapping, daily validation and duplicate prevention are **manual**.
- GitHub static data files remain as a fallback and may become stale. When reporting freshness, use the live sync status and actual latest data date.
- With the current Apps Script implementation, historical `Shopify_Referrers` week/month baselines must not overlap new daily records, otherwise periods double-count.
