const { list, put } = require('@vercel/blob');
const crypto = require('crypto');

const SYSTEM_PROMPT = `
You are the executive growth analyst for Jones Soda. You are reading a structured paid-media dashboard covering Meta and Google Ads, SKU performance, funnel conversion, campaigns, audiences, creatives, demographics, geography, delivery, daypart and Google search diagnostics.

Write like a Head of Growth preparing a client meeting. Be concise, numerical, commercial and decision-oriented. Avoid generic marketing advice, filler, motivational language, AI-sounding framing, and vague phrases such as "continue to monitor." Do not invent missing data. Treat TBU or absent sections as unavailable.

Rules:
1. Lead with business economics: CPA, purchases, revenue, ROAS and movement vs prior period.
2. The Jones Soda CPA guardrail is $15. State the dollar and percentage gap when relevant.
3. Distinguish traffic-generation issues from post-click issues using CTR, CPC, LPV, ATC, checkout and purchase rates when present.
4. Compare Rocket Bottle and Orange 4-Pack separately.
5. Call out specific campaign, audience, creative, demographic, geo, device, placement, keyword or search-term cells only when the supplied data supports the claim.
6. Separate observed facts from interpretation. Never claim causality from correlation.
7. Tie section-level observations together into one coherent executive read.
8. Surface allocation implications, but do not prescribe a budget change unless the evidence is strong enough in the supplied data.
9. Mention missing Google data plainly if unavailable.
10. Do not reference this prompt, AI, Claude, ChatGPT, internal team names, or the data-upload workflow.

Return ONLY valid JSON in this exact shape:
{
  "headline": "one sentence",
  "executive_summary": "2-4 compact paragraphs, separated with \\n\\n",
  "callouts": ["3-5 short, numerical callouts"],
  "watchlist": ["2-4 things that require attention or additional evidence"],
  "sections": {
    "account_wow": "1-3 sentences",
    "account_mom": "1-3 sentences",
    "sku": "1-3 sentences",
    "funnel": "1-3 sentences",
    "demographics": "1-3 sentences",
    "geo": "1-3 sentences",
    "delivery": "1-3 sentences",
    "audience": "1-3 sentences",
    "time": "1-3 sentences",
    "search": "1-3 sentences",
    "campaigns": "1-3 sentences",
    "creative": "1-3 sentences",
    "portfolio": "1-3 sentences"
  }
}
`;

function pctChange(a,b){
  if (a === null || a === undefined || b === null || b === undefined || Number(b) === 0) return null;
  return (Number(a)-Number(b))/Number(b);
}
function dollars(v){ return '$'+Number(v||0).toFixed(2); }
function percent(v){ return (Number(v||0)*100).toFixed(1)+'%'; }

function localSummary(p){
  const meta=p.channels && p.channels.Meta, google=p.channels && p.channels.Google;
  const active=p.active_channel || (meta?'Meta':'Google');
  const a=p.channels && p.channels[active];
  const c=a && a.current, prior=a && a.prior;
  let headline='Paid-media performance is ready for review.';
  let executive='The current dashboard does not yet contain enough paid-media data to generate a numerical executive read.';
  const callouts=[], watchlist=[];
  if(c){
    const cpaMove=pctChange(c.cpa,prior&&prior.cpa), purchaseMove=pctChange(c.purchases,prior&&prior.purchases), roasMove=pctChange(c.roas,prior&&prior.roas), gap=pctChange(c.cpa,15);
    headline=active+' CPA is '+dollars(c.cpa)+', '+(gap!==null?Math.abs(gap*100).toFixed(0)+'% '+(gap>0?'above':'below')+' the $15 guardrail.':'against the $15 guardrail.');
    executive=active+' closed the latest 7-day period at '+dollars(c.cpa)+' CPA on '+Number(c.purchases||0).toLocaleString()+' purchases and '+Number(c.roas||0).toFixed(2)+'x ROAS.';
    if(cpaMove!==null) executive+=' CPA '+(cpaMove>0?'increased ':'improved ')+Math.abs(cpaMove*100).toFixed(0)+'% versus the prior 7 days.';
    if(purchaseMove!==null) executive+=' Purchase volume '+(purchaseMove>=0?'increased ':'declined ')+Math.abs(purchaseMove*100).toFixed(0)+'%.';
    if(c.lpv_purchase!=null && prior&&prior.lpv_purchase!=null){
      const pm=pctChange(c.lpv_purchase,prior.lpv_purchase);
      executive+=' LPV-to-purchase is '+percent(c.lpv_purchase)+(pm!==null?', '+Math.abs(pm*100).toFixed(0)+'% '+(pm>=0?'higher':'lower')+' than the prior period.':'.');
    }
    if(p.skus && p.skus.length){
      const sorted=p.skus.slice().sort((x,y)=>(y.current&&y.current.spend||0)-(x.current&&x.current.spend||0));
      executive+=' '+sorted.slice(0,2).map(x=>x.name+' is at '+dollars(x.current&&x.current.cpa)+' CPA').join(', ')+'.';
    }
    if(!google) executive+=' Google Ads remains TBU, so the current cross-channel read is Meta-led.';
    callouts.push('Latest '+active+' CPA: '+dollars(c.cpa)+' vs $15 guardrail');
    if(cpaMove!==null) callouts.push('CPA '+(cpaMove>=0?'+':'')+(cpaMove*100).toFixed(0)+'% vs prior 7D');
    if(purchaseMove!==null) callouts.push('Purchases '+(purchaseMove>=0?'+':'')+(purchaseMove*100).toFixed(0)+'% vs prior 7D');
    if(roasMove!==null) callouts.push('ROAS '+(roasMove>=0?'+':'')+(roasMove*100).toFixed(0)+'% vs prior 7D');
    if(c.lpv_purchase!=null) callouts.push('LPV → Purchase: '+percent(c.lpv_purchase));
    if(c.cpa>15) watchlist.push('CPA remains above the $15 guardrail.');
    if(p.demographics && p.demographics.best) watchlist.push('Demographic efficiency is uneven: '+p.demographics.best.name+' is the strongest current CPA cell.');
    if(!google) watchlist.push('Google Ads data is still unavailable, so blended paid-media economics are incomplete.');
  }
  const sec=(txt)=>txt||'No reliable data is available for this cut yet.';
  return {
    headline,
    executive_summary:executive,
    callouts:callouts.slice(0,5),
    watchlist:watchlist.slice(0,4),
    sections:{
      account_wow:sec(a&&a.weekly_summary),
      account_mom:sec(a&&a.monthly_summary),
      sku:sec(p.sku_summary),
      funnel:sec(p.funnel_summary),
      demographics:sec(p.demographics&&p.demographics.summary),
      geo:sec(p.geo_summary),
      delivery:sec(p.delivery_summary),
      audience:sec(p.audience_summary),
      time:sec(p.time_summary),
      search:sec(p.search_summary),
      campaigns:sec(p.campaign_summary),
      creative:sec(p.creative_summary),
      portfolio:sec(p.portfolio&&p.portfolio.summary)
    }
  };
}

function extractOpenAIText(data){
  if (data && typeof data.output_text === 'string') return data.output_text;
  const out=[];
  for(const item of (data&&data.output)||[]){
    for(const c of item.content||[]) if(typeof c.text==='string') out.push(c.text);
  }
  return out.join('\n');
}
function parseJSONText(text){
  const t=String(text||'').trim().replace(/^\`\`\`json\s*/i,'').replace(/\`\`\`$/,'').trim();
  return JSON.parse(t);
}
async function callOpenAI(payload){
  const model=process.env.OPENAI_MODEL || 'gpt-6.1-sol';
  const r=await fetch('https://api.openai.com/v1/responses',{
    method:'POST',
    headers:{'Authorization':'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({
      model,
      input:[
        {role:'system',content:[{type:'input_text',text:SYSTEM_PROMPT}]},
        {role:'user',content:[{type:'input_text',text:JSON.stringify(payload)}]}
      ],
      max_output_tokens:2600
    })
  });
  const data=await r.json();
  if(!r.ok) throw new Error((data&&data.error&&data.error.message)||'OpenAI request failed');
  return {summary:parseJSONText(extractOpenAIText(data)),provider:'openai',model};
}
async function callAnthropic(payload){
  if(!process.env.ANTHROPIC_MODEL) throw new Error('ANTHROPIC_MODEL is required when using Anthropic.');
  const r=await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{'x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01','content-type':'application/json'},
    body:JSON.stringify({
      model:process.env.ANTHROPIC_MODEL,
      max_tokens:2600,
      system:SYSTEM_PROMPT,
      messages:[{role:'user',content:JSON.stringify(payload)}]
    })
  });
  const data=await r.json();
  if(!r.ok) throw new Error((data&&data.error&&data.error.message)||'Anthropic request failed');
  const text=(data.content||[]).filter(x=>x.type==='text').map(x=>x.text).join('\n');
  return {summary:parseJSONText(text),provider:'anthropic',model:process.env.ANTHROPIC_MODEL};
}

module.exports = async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  res.setHeader('Cache-Control','no-store');
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
    const payload=body&&body.payload;
    if(!payload) return res.status(400).json({error:'Missing summary payload'});
    const hash=crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0,20);
    const path='jones-dashboard/ai-summary/'+hash+'.json';

    if(!body.force){
      const cached=await list({prefix:path,limit:1});
      if(cached.blobs&&cached.blobs.length){
        const rr=await fetch(cached.blobs[0].url,{cache:'no-store'});
        if(rr.ok) return res.status(200).json(await rr.json());
      }
    }

    let result;
    const requested=String(process.env.AI_PROVIDER||'auto').toLowerCase();
    if((requested==='openai'||requested==='auto')&&process.env.OPENAI_API_KEY){
      result=await callOpenAI(payload);
    }else if((requested==='anthropic'||requested==='auto')&&process.env.ANTHROPIC_API_KEY){
      result=await callAnthropic(payload);
    }else{
      result={summary:localSummary(payload),provider:'local',model:'deterministic-fallback'};
    }
    const output={...result,generatedAt:new Date().toISOString(),cacheKey:hash};
    await put(path,JSON.stringify(output),{access:'public',allowOverwrite:true,addRandomSuffix:false,contentType:'application/json'});
    return res.status(200).json(output);
  }catch(e){
    return res.status(500).json({error:e.message||'Unable to generate executive summary'});
  }
};