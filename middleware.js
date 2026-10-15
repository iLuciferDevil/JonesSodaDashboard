import { next } from '@vercel/functions';
// Vercel Edge Middleware: require authenticated session for all reporting assets and APIs.
export const config = { matcher: '/(.*)' };
const COOKIE = 'jones_dashboard_session';
async function isAuthorized(cookie, secret) {
  if (!cookie || !secret) return false;
  const [expires, signature] = cookie.split('.');
  if (!/^\d{10,13}$/.test(expires||'') || !/^[a-f0-9]{64}$/.test(signature||'')) return false;
  if (Number(expires) < Date.now()) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['sign']);
  const signed = await crypto.subtle.sign('HMAC',key,new TextEncoder().encode('jones-session-v1:'+expires));
  const expected = Array.from(new Uint8Array(signed), x=>x.toString(16).padStart(2,'0')).join('');
  let different=0;
  for(let i=0;i<64;i++)different |= expected.charCodeAt(i)^signature.charCodeAt(i);
  return different===0;
}
export default async function middleware(request) {
  const path=new URL(request.url).pathname;
  if(path==='/login.html' || path==='/api/auth/login' || path==='/api/auth/logout')return next();
  const secret=process.env.JONES_DASHBOARD_VIEW_TOKEN;
  if(!secret)return new Response('Dashboard access is not configured. Set JONES_DASHBOARD_VIEW_TOKEN in Vercel Production settings and redeploy.',{status:503,headers:{'Cache-Control':'no-store'}});
  const cookie=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1);
  if(await isAuthorized(cookie,secret))return next();
  if(path.startsWith('/api/'))return new Response(JSON.stringify({error:'Unauthorized'}),{status:401,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  const url=new URL('/login.html',request.url);
  if(path!=='/'&&path!=='/login.html')url.searchParams.set('next',path);
  return Response.redirect(url,307);
}