import { COOKIE_NAME, clearSessionCookie, hashPassword, issueSession, normalizeEmail, parseCookies, sessionCookie, validateEmail, validatePassword, verifyPassword, verifySession } from './security.mjs';

function send(res,status,data,headers={}){ const body=JSON.stringify(data); res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Content-Length':Buffer.byteLength(body),...headers});res.end(body); }
async function body(req){ let raw=''; for await(const c of req){raw+=c;if(raw.length>1_000_000) throw Object.assign(new Error('Payload too large'),{status:413});} if(!raw)return{}; try{return JSON.parse(raw)}catch{throw Object.assign(new Error('Invalid JSON'),{status:400});} }
const clean=(x,n=255)=>String(x??'').trim().slice(0,n);
function number(x,min,max){const n=Number(x);return Number.isFinite(n)&&n>=min&&n<=max?n:null;}
function routePayload(b){
  const p={routeName:clean(b.routeName,120),originLabel:clean(b.originLabel),originLat:number(b.originLat,-90,90),originLon:number(b.originLon,-180,180),destinationLabel:clean(b.destinationLabel),destinationLat:number(b.destinationLat,-90,90),destinationLon:number(b.destinationLon,-180,180),routeCodes:Array.isArray(b.routeCodes)?[...new Set(b.routeCodes.map(x=>clean(x,50)).filter(Boolean))].slice(0,20):[],journeySnapshot:b.journeySnapshot??null,isFavourite:Boolean(b.isFavourite)};
  if(!p.routeName||!p.originLabel||!p.destinationLabel||p.originLat==null||p.originLon==null||p.destinationLat==null||p.destinationLon==null) throw Object.assign(new Error('Route name, labels and valid coordinates are required.'),{status:400}); return p;
}
export function createRequestHandler({repo,secret,sessionHours=2,production=false,corsOrigins=[]}){
  if(!secret||secret.length<32) throw new Error('JWT_SECRET must be at least 32 characters');
  const allowed=new Set(corsOrigins);
  async function auth(req){const token=parseCookies(req.headers.cookie||'')[COOKIE_NAME]; if(!token) return null; try{const s=verifySession(token,secret);return await repo.findUserById(s.id)}catch{return null}}
  return async function handler(req,res){
    const origin=req.headers.origin; const cors={};
    if(origin&&allowed.has(origin)){cors['Access-Control-Allow-Origin']=origin;cors['Access-Control-Allow-Credentials']='true';cors['Vary']='Origin';}
    if(req.method==='OPTIONS'){ if(origin&&!allowed.has(origin)) return send(res,403,{error:'Origin not allowed'}); res.writeHead(204,{...cors,'Access-Control-Allow-Methods':'GET,POST,PUT,PATCH,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type'});return res.end(); }
    if(origin&&!allowed.has(origin)) return send(res,403,{error:'Origin not allowed'});
    const url=new URL(req.url,'http://localhost'); const path=url.pathname;
    try{
      if(path==='/api/health'&&req.method==='GET'){await repo.ping?.();return send(res,200,{status:'ok',project:'SRTOS QLD',assessment:3,database:'MySQL'},cors);}
      if(path==='/api/auth/register'&&req.method==='POST'){
        const b=await body(req),email=normalizeEmail(b.email),password=b.password,displayName=clean(b.displayName,100);
        if(!validateEmail(email)) return send(res,400,{error:'Enter a valid email address.'},cors); if(!validatePassword(password))return send(res,400,{error:'Password must be 8–128 characters.'},cors);
        if(await repo.findUserByEmail(email)) return send(res,409,{error:'An account already exists for this email.'},cors);
        const user=await repo.createUser({email,passwordHash:await hashPassword(password),displayName}); const token=issueSession(user,secret,sessionHours);
        return send(res,201,{user:{id:user.id,email:user.email},profile:await repo.getProfile(user.id)},{...cors,'Set-Cookie':sessionCookie(token,{production,maxAgeSeconds:sessionHours*3600})});
      }
      if(path==='/api/auth/login'&&req.method==='POST'){
        const b=await body(req),email=normalizeEmail(b.email),u=await repo.findUserByEmail(email); if(!u||!(await verifyPassword(b.password||'',u.passwordHash)))return send(res,401,{error:'Email or password is incorrect.'},cors);
        const token=issueSession(u,secret,sessionHours);return send(res,200,{user:{id:u.id,email:u.email},profile:await repo.getProfile(u.id)},{...cors,'Set-Cookie':sessionCookie(token,{production,maxAgeSeconds:sessionHours*3600})});
      }
      if(path==='/api/auth/logout'&&req.method==='POST') return send(res,200,{ok:true},{...cors,'Set-Cookie':clearSessionCookie({production})});
      const user=await auth(req); if(!user)return send(res,401,{error:'Authentication required.'},cors);
      if(path==='/api/auth/me'&&req.method==='GET')return send(res,200,{user,profile:await repo.getProfile(user.id)},cors);
      if(path==='/api/profile'&&req.method==='GET')return send(res,200,{profile:await repo.getProfile(user.id)},cors);
      if(path==='/api/profile'&&req.method==='PUT'){const b=await body(req);return send(res,200,{profile:await repo.updateProfile(user.id,{displayName:clean(b.displayName,100),phone:clean(b.phone,40),occupation:clean(b.occupation,120),homeLocation:clean(b.homeLocation,255)})},cors);}
      if(path==='/api/routes'&&req.method==='GET')return send(res,200,{routes:await repo.listRoutes(user.id,url.searchParams.get('favourite')==='1')},cors);
      if(path==='/api/routes'&&req.method==='POST')return send(res,201,{route:await repo.createRoute(user.id,routePayload(await body(req)))},cors);
      const rm=path.match(/^\/api\/routes\/(\d+)$/); if(rm){const id=Number(rm[1]); if(req.method==='PATCH'){const b=await body(req);const route=await repo.updateRoute(user.id,id,{routeName:b.routeName===undefined?undefined:clean(b.routeName,120),isFavourite:b.isFavourite});return route?send(res,200,{route},cors):send(res,404,{error:'Saved route not found.'},cors);} if(req.method==='DELETE')return (await repo.deleteRoute(user.id,id))?send(res,200,{ok:true},cors):send(res,404,{error:'Saved route not found.'},cors);}
      const use=path.match(/^\/api\/routes\/(\d+)\/use$/); if(use&&req.method==='POST'){const route=await repo.markRouteUsed(user.id,Number(use[1]));return route?send(res,200,{route},cors):send(res,404,{error:'Saved route not found.'},cors);}
      if(path==='/api/alerts/stored'&&req.method==='GET')return send(res,200,{alerts:await repo.listAlertsForUser(user.id)},cors);
      if(path==='/api/alerts/preferences'&&req.method==='GET')return send(res,200,{preferences:await repo.getPreferences(user.id)},cors);
      if(path==='/api/alerts/preferences'&&req.method==='PUT'){const b=await body(req),d=number(b.delayThresholdMinutes,1,60);if(d==null)return send(res,400,{error:'Delay threshold must be between 1 and 60 minutes.'},cors);return send(res,200,{preferences:await repo.updatePreferences(user.id,{serviceAlertsEnabled:Boolean(b.serviceAlertsEnabled),delayAlertsEnabled:Boolean(b.delayAlertsEnabled),vehicleAlertsEnabled:Boolean(b.vehicleAlertsEnabled),delayThresholdMinutes:d,quietHoursEnabled:Boolean(b.quietHoursEnabled),quietStart:b.quietStart||null,quietEnd:b.quietEnd||null})},cors);}
      if(path==='/api/notifications'&&req.method==='GET')return send(res,200,{notifications:await repo.listNotifications(user.id)},cors);
      if(path==='/api/notifications/sync'&&req.method==='POST'){const b=await body(req);const items=Array.isArray(b.items)?b.items.slice(0,100):[];return send(res,200,{notifications:await repo.syncNotifications(user.id,items)},cors);}
      const nm=path.match(/^\/api\/notifications\/(\d+)\/read$/); if(nm&&req.method==='PATCH')return (await repo.markNotificationRead(user.id,Number(nm[1])))?send(res,200,{ok:true},cors):send(res,404,{error:'Notification not found.'},cors);
      return send(res,404,{error:'Not found.'},cors);
    } catch(e){ const code=e?.code==='ER_DUP_ENTRY'?409:(e.status||500); console.error(e); return send(res,code,{error:code===500?'Server error. Please try again.':e.message},cors); }
  };
}
