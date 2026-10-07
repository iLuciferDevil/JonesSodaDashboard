const { put } = require('@vercel/blob');

const CANONICAL = [
  'Date','Channel','SKU','Campaign','Campaign_Type','Ad_Group_or_Ad_Set','Ad_or_Asset',
  'Audience_or_Keyword','Search_Term','Match_Type','Age','Gender','Placement_or_Network',
  'Platform','Device','Spend','Impressions','Clicks','Landing_Page_Views','Add_To_Cart',
  'Checkouts','Purchases','Purchase_Value'
];

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
  const row = {
    Date: get('Date','Day'),
    Channel: get('Channel'),
    SKU: get('SKU'),
    Campaign: get('Campaign','Campaign name'),
    Campaign_Type: get('Campaign_Type','Campaign Type'),
    Ad_Group_or_Ad_Set: get('Ad_Group_or_Ad_Set','Ad_Set','Ad set name','Ad group'),
    Ad_or_Asset: get('Ad_or_Asset','Ad','Ad name','Asset group'),
    Audience_or_Keyword: get('Audience_or_Keyword','Audience','Keyword'),
    Search_Term: get('Search_Term','Search term'),
    Match_Type: get('Match_Type','Match type'),
    Age: get('Age'),
    Gender: get('Gender'),
    Placement_or_Network: get('Placement_or_Network','Placement','Network'),
    Platform: get('Platform'),
    Device: get('Device'),
    Spend: num(get('Spend','Amount spent (USD)','Cost')),
    Impressions: num(get('Impressions')),
    Clicks: num(get('Clicks','Link_Clicks','Link clicks')),
    Landing_Page_Views: num(get('Landing_Page_Views','Landing page views')),
    Add_To_Cart: num(get('Add_To_Cart','Adds to cart')),
    Checkouts: num(get('Checkouts','Checkouts initiated')),
    Purchases: num(get('Purchases','Conversions')),
    Purchase_Value: num(get('Purchase_Value','Purchases conversion value','Conversion value'))
  };
  if (!row.Platform) row.Platform = row.Channel === 'Google' ? 'Google Ads' : row.Channel;
  return row;
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
    if (incoming.length > 100000) return res.status(413).json({ error: 'Upload exceeds 100,000 rows' });

    const rows = incoming.map(normalize).filter(r => r.Date && r.Channel && r.Campaign);
    if (!rows.length) return res.status(400).json({ error: 'No valid rows after validation. Date, Channel and Campaign are required.' });

    const channels = [...new Set(rows.map(r => r.Channel))];
    const payload = {
      uploadedAt: new Date().toISOString(),
      uploadedBy: body.uploadedBy || 'Dashboard uploader',
      rowCount: rows.length,
      channels,
      schema: CANONICAL,
      rows
    };
    const blob = await put('jones-dashboard/latest.json', JSON.stringify(payload), {
      access: 'public',
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: 'application/json'
    });
    return res.status(200).json({ ok: true, url: blob.url, uploadedAt: payload.uploadedAt, rowCount: rows.length, channels });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Upload failed' });
  }
};