const crypto=require('crypto');
module.exports=async function handler(req,res){
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  res.setHeader('Cache-Control','no-store');
  const secret=process.env.JONES_DASHBOARD_VIEW_TOKEN;
  if(!secret)return res.status(503).json({error:'Dashboard password not configured'});
  const provided=typeof req.body?.password==='string'?req.body.password:'';
  const a=Buffer.from(provided),b=Buffer.from(secret);
  if(a.length!==b.length || !crypto.timingSafeEqual(a,b))return res.status(401).json({error:'Incorrect password'});
  const expires=String(Date.now()+12*60*60*1000);
  const sig=crypto.createHmac('sha256',secret).update('jones-session-v1:'+expires).digest('hex');
  res.setHeader('Set-Cookie','jones_dashboard_session='+expires+'.'+sig+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=43200');
  return res.status(200).json({ok:true});
};