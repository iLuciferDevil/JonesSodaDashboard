const { put } = require('@vercel/blob');

const text = v => v === null || v === undefined ? '' : String(v).trim();
const num = v => {
  if (v === null || v === undefined || v === '') return 0;
  const n = Number(String(v).replace(/[$,%]/g,'').replace(/,/g,'').trim());
  return Number.isFinite(n) ? n : 0;
};

function normalize(r) {
  const get = (...keys) => {
    for (const k of keys) if (r[k] !== undefined && r[k] !== null) return r[k];
    return '';
  };
  const reportType = text(get('Report_Type','Report Type')) || 'Base';
  return {
    Report_Type: reportType,
    Date: text(get('Date','Day')),
    Channel: text(get('Channel')),
    SKU: text(get('SKU')),
    Campaign: text(get('Campaign','Campaign name')),
    Campaign_Type: text(get('Campaign_Type','Campaign Type')),
    Ad_Group_or_Ad_Set: text(get('Ad_Group_or_Ad_Set','Ad_Set','Ad set name','Ad group')),
    Ad_or_Asset: text(get('Ad_or_Asset','Ad','Ad name','Asset group')),
    Audience_or_Keyword: text(get('Audience_or_Keyword','Audience','Keyword')),
    Keyword: text(get('Keyword')),
    Search_Term: text(get('Search_Term','Search term')),
    Match_Type: text(get('Match_Type','Match type')),
    Age: text(get('Age')),
    Gender: text(get('Gender')),
    Country: text(get('Country')),
    Region: text(get('Region','State')),
    City: text(get('City')),
    DMA: text(get('DMA','Metro')),
    Platform: text(get('Platform','Publisher platform')),
    Network: text(get('Network')),
    Placement: text(get('Placement','Platform position')),
    Device: text(get('Device','Impression device')),
    Creative_Format: text(get('Creative_Format','Creative Format')),
    Objective: text(get('Objective')),
    Conversion_Action: text(get('Conversion_Action','Conversion action')),
    Day_of_Week: text(get('Day_of_Week','Day of week')),
    Hour_of_Day: text(get('Hour_of_Day','Hour of day')),
    Quality_Score: num(get('Quality_Score','Quality score')),
    Spend: num(get('Spend','Amount spent (USD)','Cost')),
    Reach: num(get('Reach')),
    Impressions: num(get('Impressions')),
    Clicks: num(get('Clicks','Link_Clicks','Link clicks')),
    Landing_Page_Views: num(get('Landing_Page_Views','Landing page views')),
    Add_To_Cart: num(get('Add_To_Cart','Adds to cart')),
    Checkouts: num(get('Checkouts','Checkouts initiated')),
    Purchases: num(get('Purchases','Conversions')),
    Purchase_Value: num(get('Purchase_Value','Purchases conversion value','Conversion value')),
    Search_Impression_Share: num(get('Search_Impression_Share','Search impr. share')),
    Search_Lost_IS_Budget: num(get('Search_Lost_IS_Budget','Search lost IS (budget)')),
    Search_Lost_IS_Rank: num(get('Search_Lost_IS_Rank','Search lost IS (rank)')),
    Search_Top_Impression_Rate: num(get('Search_Top_Impression_Rate','Search top impr. rate')),
    Search_Absolute_Top_Impression_Rate: num(get('Search_Absolute_Top_Impression_Rate','Search abs. top impr. rate')),
    Video_3s_Views: num(get('Video_3s_Views','3-second video plays')),
    ThruPlays: num(get('ThruPlays','ThruPlays'))
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'no-store');
  try {
    const pin = req.headers['x-upload-pin'];
    if (!process.env.JONES_UPLOAD_PIN || pin !== process.env.JONES_UPLOAD_PIN) {
      return res.status(401).json({ error: 'Invalid upload PIN' });
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const incoming = body && Array.isArray(body.rows) ? body.rows : null;
    if (!incoming || incoming.length === 0) return res.status(400).json({ error: 'No data rows received' });
    if (incoming.length > 150000) return res.status(413).json({ error: 'Upload exceeds 150,000 rows' });

    const rows = incoming.map(normalize).filter(r => r.Date && r.Channel);
    if (!rows.length) return res.status(400).json({ error: 'No valid rows after validation. Date and Channel are required.' });

    const baseRows = rows.filter(r => String(r.Report_Type).toLowerCase() === 'base');
    if (!baseRows.length) return res.status(400).json({ error: 'The upload must contain at least one Report_Type = Base row.' });

    // Merge incoming rows with the previous published history. Matching grains are updated, not added.
    // Metrics never form part of the grain identity.
    const dimensions = ['Report_Type','Date','Channel','SKU','Campaign','Campaign_Type',
      'Ad_Group_or_Ad_Set','Ad_or_Asset','Audience_or_Keyword','Keyword','Search_Term',
      'Match_Type','Age','Gender','Country','Region','City','DMA','Platform','Network',
      'Placement','Device','Creative_Format','Objective','Conversion_Action','Day_of_Week','Hour_of_Day'];
    const key = r => JSON.stringify(dimensions.map(k => String(r[k] ?? '').trim().toLowerCase()));
    let previous = [];
    try {
      const { list } = require('@vercel/blob');
      const { blobs } = await list({ prefix: 'jones-dashboard/latest.json', limit: 10 });
      const latest = (blobs || []).sort((a,b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
      if (latest) {
        const response = await fetch(latest.url, { cache:'no-store' });
        if (!response.ok) throw new Error('Unable to read existing history');
        const saved = await response.json();
        if (!Array.isArray(saved.rows)) throw new Error('Existing history has an invalid structure');
        previous = saved.rows;
      }
    } catch (error) {
      return res.status(503).json({ error: 'History could not be loaded. Nothing was overwritten: ' + error.message });
    }
    const merged = new Map(previous.map(r => [key(r),r]));
    for (const row of rows) merged.set(key(row),row);
    const allRows = [...merged.values()];
    if (!allRows.some(r => String(r.Report_Type).toLowerCase() === 'base'))
      return res.status(400).json({error:'At least one Base row is needed in the saved dataset'});
    const payload = {
      uploadedAt: new Date().toISOString(),
      uploadedBy: body.uploadedBy || 'Dashboard uploader',
      rowCount: rows.length,
      channels: [...new Set(allRows.map(r => r.Channel))],
      reportTypes: [...new Set(allRows.map(r => r.Report_Type))],
      rows: allRows
    };
    const blob = await put('jones-dashboard/latest.json', JSON.stringify(payload), {
      access: 'public', allowOverwrite: true, addRandomSuffix: false, contentType: 'application/json'
    });
    return res.status(200).json({ ok:true, url:blob.url, uploadedAt:payload.uploadedAt, rowCount:allRows.length, addedOrUpdated:rows.length, channels:payload.channels, reportTypes:payload.reportTypes });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Upload failed' });
  }
};