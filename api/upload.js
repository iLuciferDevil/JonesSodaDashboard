const { put } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'no-store');
  try {
    const pin = req.headers['x-upload-pin'];
    if (!process.env.JONES_UPLOAD_PIN || pin !== process.env.JONES_UPLOAD_PIN) {
      return res.status(401).json({ error: 'Invalid upload PIN' });
    }
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const rows = body && Array.isArray(body.rows) ? body.rows : null;
    if (!rows || rows.length === 0) return res.status(400).json({ error: 'No data rows received' });
    if (rows.length > 50000) return res.status(413).json({ error: 'Upload exceeds 50,000 rows' });

    const required = ['Date','Channel','Campaign','Spend','Impressions','Link_Clicks','Landing_Page_Views','Add_To_Cart','Checkouts','Purchases','Purchase_Value'];
    const missing = required.filter(k => !(k in rows[0]));
    if (missing.length) return res.status(400).json({ error: 'Missing columns: ' + missing.join(', ') });

    const payload = {
      uploadedAt: new Date().toISOString(),
      uploadedBy: body.uploadedBy || 'Dashboard uploader',
      rowCount: rows.length,
      rows
    };
    const blob = await put('jones-dashboard/latest.json', JSON.stringify(payload), {
      access: 'public',
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: 'application/json'
    });
    return res.status(200).json({ ok: true, url: blob.url, uploadedAt: payload.uploadedAt, rowCount: rows.length });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Upload failed' });
  }
};