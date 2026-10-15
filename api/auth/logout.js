module.exports=function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('Set-Cookie','jones_dashboard_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0');
  res.writeHead(303,{Location:'/login.html'}).end();
};