// Server-only proxy to a private Apps Script web app. No credentials are sent to the browser.
module.exports = async function handler(req,res) {
  if(req.method !== 'GET')return res.status(405).json({error:'Method not allowed'});
  // Defense in depth: verify the signed login cookie, even if middleware routing changes.
  const crypto=require('crypto');
  const viewToken=process.env.JONES_DASHBOARD_VIEW_TOKEN;
  if(!viewToken)return res.status(503).json({error:'Viewer password not configured'});
  const value=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('jones_dashboard_session='))?.slice('jones_dashboard_session='.length)||'';
  const [expires,sig]=value.split('.');
  const expected=crypto.createHmac('sha256',viewToken).update('jones-session-v1:'+expires).digest('hex');
  const provided=Buffer.from(sig||'','hex'),actual=Buffer.from(expected,'hex');
  if(!/^\d{13}$/.test(expires||'') || Number(expires)<Date.now() || !/^[a-f0-9]{64}$/.test(sig||'') || provided.length!==actual.length || !crypto.timingSafeEqual(provided,actual))
    return res.status(401).json({error:'Please sign in to the Jones Soda dashboard'});
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