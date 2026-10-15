/** Jones Soda reporting API. Bound to the private Jones Soda Master Database. */
const DATABASE_ID = '1GPKaZ4scDC7J2iDlZvIxvrsXdXFXbyr5e_Ci3iYBHn4';
const SECRET_KEY = 'JONES_DASHBOARD_API_KEY';
const N = x => { const y = Number(String(x == null ? '' : x).replace(/,/g,'')); return isFinite(y)?y:0; };
function isoDate(x) {
  if (x instanceof Date) return Utilities.formatDate(x,'GMT','yyyy-MM-dd');
  return String(x||'').slice(0,10);
}
function table(name) {
  const sheet = SpreadsheetApp.openById(DATABASE_ID).getSheetByName(name);
  if (!sheet) throw new Error('Missing tab: '+name);
  const a=sheet.getDataRange().getValues();
  const headers=a.shift().map(String);
  return a.filter(r=>r.some(v=>v!==''&&v!==null)).map(row=>{
    const o={}; headers.forEach((h,i)=>o[h]=row[i]); return o;
  });
}
function period(date,kind) {
  if(kind==='month')return date.slice(0,7);
  const d=new Date(date+'T12:00:00Z');
  d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);
  return Utilities.formatDate(d,'GMT','yyyy-MM-dd');
}
function mainSnapshot(){
  const map={};const add=(k,init,fields,source)=> {
    if(!map[k])map[k]=init.slice();
    const arr=map[k]; for(const [dest,key] of fields)arr[dest]+=N(source[key]);
  };
  for(const channel of ['Meta','Google']){
    const a=table(channel==='Meta'?'Meta_Ads':'Google_Ads');
    for(const r of a){
      const d=isoDate(r.Date);
      if(d<'2026-04-01'||d>'2026-10-14')continue;
      if(channel==='Google'&&(!String(r.Campaign||'').trim()||/^--+$/.test(String(r.Campaign).trim())))continue;
      const sku=String(r.SKU||'Other');
      for(const mode of ['week','month']){
        const p=period(d,mode),k=JSON.stringify(['Paid',mode,p,channel,sku]);
        add(k,['Paid',mode,p,channel,sku,0,0,0,0,0],
          [[5,'Spend'],[6,channel==='Meta'?'Purchases':'Conversions'],[7,channel==='Meta'?'Purchase_Value':'Conversion_Value'],[8,'Impressions'],[9,'Clicks']],r);
      }
    }
  }
  for(const r of table('Shopify_Sales')){
    const d=isoDate(r.Date);if(d<'2026-04-01'||d>'2026-10-14')continue;
    for(const mode of ['week','month']){
      const p=period(d,mode),sku=String(r.SKU||r.Product||'Other');
      const k=JSON.stringify(['Shopify',mode,p,sku]);
      add(k,['Shopify',mode,p,sku,0,0],[[4,'Orders'],[5,'Net_Sales']],r);
    }
  }
  return Object.values(map).sort((a,b)=>String(a[2]).localeCompare(String(b[2])));
}
function layers(){
  const age=table('Meta_Age').map(r=>({
    'Reporting starts':isoDate(r.Date),'Campaign name':r.Campaign,'Age':r.Age,
    'Amount spent (USD)':N(r.Spend),Purchases:N(r.Purchases),
    'Purchases conversion value':N(r.Purchase_Value)
  }));
  const gender=table('Meta_Gender').map(r=>({
    'Reporting starts':isoDate(r.Date),'Campaign name':r.Campaign,'Gender':r.Gender,
    'Amount spent (USD)':N(r.Spend),Purchases:N(r.Purchases),
    'Purchases conversion value':N(r.Purchase_Value)
  }));
  const campaign=table('Klaviyo_Campaigns').map(r=>({
    'Message send date time':isoDate(r.Send_Date),'Campaign name':r.Campaign,
    'Send channel':r.Channel,'Total recipients':N(r.Recipients),
    'Count of unique conversions':N(r.Orders),'Conversion value':N(r.Revenue),
    'Unique clicks':N(r.Clicks)
  }));
  const funnel=table('Shopify_Funnel').map(r=>({
    Day:isoDate(r.Date),Sessions:N(r.Sessions),
    'Sessions with cart additions':N(r.Added_To_Cart),
    'Sessions that reached checkout':N(r.Reached_Checkout),
    'Sessions that completed checkout':N(r.Completed_Checkout)
  }));
  const subscribers=table('Klaviyo_Subscribers').map(r=>({
    'Start Date':isoDate(r.Date),'New email subscribers':N(r.New_Subscribers),
    'Email exclusions':-Math.abs(N(r.Exclusions))
  }));
  const summary=new Map(),top=new Map();
  for(const r of table('Klaviyo_Flows')){
    const date=isoDate(r.Date);if(date<'2026-04-01'||date>'2026-10-14')continue;
    const v=[N(r.Revenue),N(r.Orders),N(r.Delivered),N(r.Clicks)];
    for(const mode of ['week','month']){
      const key=mode+'|'+period(date,mode);
      if(!summary.has(key))summary.set(key,[mode,period(date,mode),0,0,0,0]);
      const z=summary.get(key); for(let i=0;i<4;i++)z[i+2]+=v[i];
    }
    const name=String(r.Flow||'Other');
    if(!top.has(name))top.set(name,['flow',name,0,0,0,0]);
    const t=top.get(name); for(let i=0;i<4;i++)t[i+2]+=v[i];
  }
  return {age,gender,campaign,funnel,subscribers,flow:[...summary.values(),...top.values()]};
}
function doGet(e){
  const actual=PropertiesService.getScriptProperties().getProperty(SECRET_KEY);
  const provided=String((e&&e.parameter&&e.parameter.token)||'');
  if(!actual||provided!==actual)return ContentService.createTextOutput(JSON.stringify({error:'unauthorized'})).setMimeType(ContentService.MimeType.JSON);
  const result={ok:true,updatedAt:new Date().toISOString(),rows:mainSnapshot(),layers:layers()};
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}
function validateBackend(){
  const rows=mainSnapshot(),l=layers();
  Logger.log(JSON.stringify({trendRows:rows.length,age:l.age.length,gender:l.gender.length,
  campaigns:l.campaign.length,funnelDays:l.funnel.length,subscriberDays:l.subscribers.length,flowRows:l.flow.length}));
}
