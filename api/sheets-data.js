// Server-only proxy to a private Apps Script web app. No credentials are sent to the browser.
module.exports = async function handler(req,res) {
  if(req.method !== 'GET')return res.status(405).json({error:'Method not allowed'});
  const url=process.env.JONES_SHEETS_WEB_APP_URL;
  const token=process.env.JONES_SHEETS_API_KEY;
  if(!url||!token)return res.status(503).json({error:'Sheets backend not configured'});
  try {
    const target=new URL(url);
    if(target.protocol!=='https:')throw new Error('Backend URL must use HTTPS');
    target.searchParams.set('token',token);
    const upstream=await fetch(target.toString(),{redirect:'follow',headers:{Accept:'application/json'},signal:AbortSignal.timeout(25000)});
    if(!upstream.ok)throw new Error('Sheets service returned HTTP '+upstream.status);
    const payload=await upstream.json();
    if(!payload.ok)throw new Error('Sheets backend unavailable or unauthorized');
    res.setHeader('Cache-Control','private, no-store');
    return res.status(200).json(payload);
  }catch(error){
    res.setHeader('Cache-Control','no-store');
    return res.status(502).json({error:'Sheets sync failed',detail:error.message});
  }
};