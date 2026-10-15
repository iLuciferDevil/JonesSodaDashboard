/**
 * Jones Soda Google Sheets reporting backend.
 * Bound to the existing Jones Soda Master Database spreadsheet.
 * Required Script Property: JONES_API_TOKEN (a long random secret).
 * Deploy as Web app: Execute as Me; access Anyone; private sheets stay private.
 * Do not share web app URL or token publicly.
 */
const DATA_TABS = ['Meta_Ads','Google_Ads','Shopify_Sales','Shopify_Funnel','Meta_Age','Meta_Gender','Klaviyo_Campaigns','Klaviyo_Flows','Klaviyo_Subscribers'];
function getRows_(name) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) return [];
  const arr = sh.getDataRange().getDisplayValues();
  if (arr.length < 2) return [];
  const headers=arr.shift();
  return arr.filter(row=>row[0]).map(row => Object.fromEntries(headers.map((h,i)=>[h,row[i]||''])));
}
function monday_(date) {
  const d=new Date(date.slice(0,10)+'T12:00:00Z');
  if(isNaN(d))return '';
  d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);
  return d.toISOString().slice(0,10);
}
function aggregate_(src,source,sku,date,spend,conversions,value,impressions,clicks) {
  let week=monday_(date);
  if(!week || date<'2026-04-01')return;
  const amt=[spend,conversions,value,impressions,clicks].map(x=>Number(String(x||0).replace(/[$,]/g,''))||0);
  for(const [p,k] of [['week',week],['month',date.slice(0,7)]]) {
    const key=[source,p,k,sku].join('|');
    if(!src.has(key))src.set(key,[source,p,k,sku,0,0,0,0,0]);
    const row=src.get(key);
    for(let i=0;i<5;i++)row[4+i]+=amt[i];
  }
}
function doGet(e) {
  const configured=PropertiesService.getScriptProperties().getProperty('JONES_API_TOKEN');
  const token=e&&e.parameter&&e.parameter.token;
  if(!configured || !token || token!==configured)return out_({ok:false,error:'Unauthorized'});
  try {
    const grouped=new Map();
    for(const r of getRows_('Meta_Ads'))
      aggregate_(grouped,'Meta',r.SKU||'Other',r.Date,r.Spend,r.Purchases,r.Purchase_Value,r.Impressions,r.Clicks);
    for(const r of getRows_('Google_Ads'))
      aggregate_(grouped,'Google',r.SKU||'Unattributed / Other',r.Date,r.Spend,r.Conversions,r.Conversion_Value,r.Impressions,r.Clicks);
    for(const r of getRows_('Shopify_Sales'))
      aggregate_(grouped,'Shopify',r.SKU||r.Product||'Other',r.Date,0,r.Orders||r.Net_Items,r.Net_Sales,0,0);
    const ages=getRows_('Meta_Age').map(r=>({'Reporting starts':r.Date,'Campaign name':r.Campaign,'Age':r.Age,'Amount spent (USD)':r.Spend,'Purchases':r.Purchases,'Purchases conversion value':r.Purchase_Value}));
    const gender=getRows_('Meta_Gender').map(r=>({'Reporting starts':r.Date,'Campaign name':r.Campaign,'Gender':r.Gender,'Amount spent (USD)':r.Spend,'Purchases':r.Purchases,'Purchases conversion value':r.Purchase_Value}));
    const campaigns=getRows_('Klaviyo_Campaigns').map(r=>({'Message send date time':r.Send_Date,'Campaign name':r.Campaign,'Conversion value':r.Revenue,'Count of unique conversions':r.Orders,'Total recipients':r.Recipients,'Unique clicks':r.Clicks}));
    const funnel=getRows_('Shopify_Funnel').map(r=>({Day:r.Date,Sessions:r.Sessions,'Sessions with cart additions':r.Added_To_Cart,'Sessions that reached checkout':r.Reached_Checkout,'Sessions that completed checkout':r.Completed_Checkout}));
    const subscribers=getRows_('Klaviyo_Subscribers').map(r=>({'Start Date':r.Date,'New email subscribers':r.New_Subscribers,'Email exclusions':-Math.abs(Number(r.Exclusions)||0)}));
    const flowRows=getRows_('Klaviyo_Flows');
    const roll=new Map();
    for(const r of flowRows) {
      for(const [period,k] of [['week',monday_(r.Date)],['month',String(r.Date).slice(0,7)],['flow',r.Flow||'Other']]){
        const key=period+'|'+k;
        if(!roll.has(key))roll.set(key,[period,k,0,0,0,0]);
        const dst=roll.get(key);
        for(const [i,col] of [[2,'Revenue'],[3,'Orders'],[4,'Delivered'],[5,'Clicks']])dst[i]+=Number(r[col])||0;
      }
    }
    return out_({ok:true,updatedAt:new Date().toISOString(),rows:[...grouped.values()],layers:{age:ages,gender,campaign:campaigns,funnel,subscribers,flow:[...roll.values()]}});
  } catch(err) {return out_({ok:false,error:String(err.message||err)});}
}
function out_(data){return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);}
