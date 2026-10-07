const { list } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  try {
    const { blobs } = await list({ prefix: 'jones-dashboard/latest.json', limit: 10 });
    if (!blobs || blobs.length === 0) return res.status(200).json({ data: null });
    const blob = blobs.sort((a,b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
    const r = await fetch(blob.url, { cache: 'no-store' });
    if (!r.ok) throw new Error('Unable to read stored dashboard data');
    const data = await r.json();
    return res.status(200).json({ data });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Unable to load dashboard data' });
  }
};