import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {createRequestHandler} from '../src/app.mjs';

class MemoryRepo{
  constructor(){
    this.users=[]; this.profiles=new Map; this.routes=[]; this.prefs=new Map;
    this.alerts=[]; this.notes=[]; this.id=1; this.rid=1; this.aid=1; this.nid=1;
  }
  async ping(){}
  async createUser(x){
    const u={id:this.id++,email:x.email,passwordHash:x.passwordHash};
    this.users.push(u);
    this.profiles.set(u.id,{userId:u.id,email:u.email,displayName:x.displayName||'',phone:null,occupation:null,homeLocation:null});
    this.prefs.set(u.id,{serviceAlertsEnabled:true,delayAlertsEnabled:true,vehicleAlertsEnabled:false,delayThresholdMinutes:10,quietHoursEnabled:false,quietStart:null,quietEnd:null});
    return{id:u.id,email:u.email};
  }
  async findUserByEmail(e){return this.users.find(u=>u.email===e)||null}
  async findUserById(id){const u=this.users.find(x=>x.id===id);return u?{id:u.id,email:u.email}:null}
  async getProfile(id){return this.profiles.get(id)||null}
  async updateProfile(id,p){const x={...this.profiles.get(id),...p};this.profiles.set(id,x);return x}
  async listRoutes(uid,f=false){return this.routes.filter(r=>r.userId===uid&&(!f||r.isFavourite))}
  async getRoute(uid,id){return this.routes.find(r=>r.userId===uid&&r.id===id)||null}
  async createRoute(uid,r){const x={id:this.rid++,userId:uid,...r,usageCount:0,lastUsedAt:null};this.routes.push(x);return x}
  async updateRoute(uid,id,p){const r=await this.getRoute(uid,id);if(!r)return null;Object.assign(r,p);return r}
  async deleteRoute(uid,id){const i=this.routes.findIndex(r=>r.userId===uid&&r.id===id);if(i<0)return false;this.routes.splice(i,1);return true}
  async markRouteUsed(uid,id){const r=await this.getRoute(uid,id);if(!r)return null;r.usageCount++;r.lastUsedAt=new Date().toISOString();return r}
  async getPreferences(uid){return this.prefs.get(uid)}
  async updatePreferences(uid,p){this.prefs.set(uid,p);return p}
  async routeCodes(uid){return [...new Set((await this.listRoutes(uid)).flatMap(r=>r.routeCodes))]}
  async upsertAlerts(items){
    for(const n of items){
      let a=this.alerts.find(x=>x.sourceKey===n.sourceKey);
      if(!a){a={id:this.aid++,sourceKey:n.sourceKey,sourceName:n.sourceName||'Translink GTFS Realtime'};this.alerts.push(a)}
      Object.assign(a,{routeCodes:(n.routes||[]).map(String),category:n.category||'service_alert',title:n.title,message:n.message||'',severity:n.severity||'info'});
    }
  }
  async listAlertsForUser(uid){
    const allowed=new Set(await this.routeCodes(uid));
    return this.alerts.filter(a=>a.routeCodes.length===0||a.routeCodes.some(x=>allowed.has(String(x))));
  }
  async syncNotifications(uid,items){
    await this.upsertAlerts(items);
    const allowed=new Set(await this.routeCodes(uid));
    for(const n of items){
      const routes=(n.routes||[]).map(String); const matched=routes.length?routes.find(x=>allowed.has(x)):null;
      if(routes.length&&!matched)continue;
      const alert=this.alerts.find(x=>x.sourceKey===n.sourceKey);
      if(this.notes.some(x=>x.userId===uid&&x.sourceKey===n.sourceKey))continue;
      this.notes.push({id:this.nid++,alertId:alert?.id??null,userId:uid,sourceKey:n.sourceKey,routeCode:matched||null,title:n.title,message:n.message||'',category:n.category||'service_alert',severity:n.severity||'info',isRead:false});
    }
    return this.listNotifications(uid);
  }
  async listNotifications(uid){return this.notes.filter(n=>n.userId===uid)}
  async markNotificationRead(uid,id){const n=this.notes.find(x=>x.userId===uid&&x.id===id);if(!n)return false;n.isRead=true;return true}
}

const secret='0123456789abcdef0123456789abcdef';
async function withServer(fn){
  const repo=new MemoryRepo;
  const s=http.createServer(createRequestHandler({repo,secret,corsOrigins:['http://localhost:3000']}));
  await new Promise(r=>s.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${s.address().port}`;
  try{await fn(base,repo)}finally{await new Promise(r=>s.close(r))}
}
async function req(base,path,opt={},cookie='',origin='http://localhost:3000'){
  const h={'Content-Type':'application/json',...(origin?{'Origin':origin}:{}),...(opt.headers||{})}; if(cookie)h.Cookie=cookie;
  const r=await fetch(base+path,{...opt,headers:h}); const j=await r.json();
  return{r,j,cookie:(r.headers.get('set-cookie')||'').split(';')[0]};
}
async function register(base,email='a@example.com'){return req(base,'/api/auth/register',{method:'POST',body:JSON.stringify({email,password:'password123',displayName:'A'})})}
const route={routeName:'Home to UQ',originLabel:'Brisbane Central',originLat:-27.465,originLon:153.026,destinationLabel:'UQ St Lucia',destinationLat:-27.497,destinationLon:153.013,routeCodes:['66'],journeySnapshot:{live:true}};

test('01 health identifies Assessment 3 MySQL API',async()=>withServer(async(base)=>{const x=await req(base,'/api/health');assert.equal(x.r.status,200);assert.equal(x.j.database,'MySQL');assert.equal(x.j.assessment,3)}));
test('02 registration, login and HttpOnly session cookie',async()=>withServer(async(base)=>{const a=await register(base);assert.equal(a.r.status,201);assert.match(a.r.headers.get('set-cookie'),/HttpOnly/);const login=await req(base,'/api/auth/login',{method:'POST',body:JSON.stringify({email:'a@example.com',password:'password123'})});assert.equal(login.r.status,200);const me=await req(base,'/api/auth/me',{},login.cookie);assert.equal(me.j.user.email,'a@example.com')}));
test('03 profile persists for signed-in user',async()=>withServer(async(base)=>{const a=await register(base);const p=await req(base,'/api/profile',{method:'PUT',body:JSON.stringify({displayName:'Alice',phone:'0400000000',occupation:'Student',homeLocation:'Brisbane'})},a.cookie);assert.equal(p.r.status,200);const g=await req(base,'/api/profile',{},a.cookie);assert.equal(g.j.profile.occupation,'Student');assert.equal(g.j.profile.homeLocation,'Brisbane')}));
test('04 saved route create, favourite, use and delete',async()=>withServer(async(base)=>{const a=await register(base);let sr=await req(base,'/api/routes',{method:'POST',body:JSON.stringify(route)},a.cookie);assert.equal(sr.r.status,201);const id=sr.j.route.id;let fav=await req(base,`/api/routes/${id}`,{method:'PATCH',body:JSON.stringify({isFavourite:true})},a.cookie);assert.equal(fav.j.route.isFavourite,true);let use=await req(base,`/api/routes/${id}/use`,{method:'POST'},a.cookie);assert.equal(use.j.route.usageCount,1);let del=await req(base,`/api/routes/${id}`,{method:'DELETE'},a.cookie);assert.equal(del.r.status,200);let list=await req(base,'/api/routes',{},a.cookie);assert.equal(list.j.routes.length,0)}));
test('05 saved routes are isolated by user ownership',async()=>withServer(async(base)=>{const a=await register(base,'a@example.com');const sr=await req(base,'/api/routes',{method:'POST',body:JSON.stringify(route)},a.cookie);const b=await register(base,'b@example.com');const list=await req(base,'/api/routes',{},b.cookie);assert.equal(list.j.routes.length,0);const steal=await req(base,`/api/routes/${sr.j.route.id}`,{method:'DELETE'},b.cookie);assert.equal(steal.r.status,404);const still=await req(base,'/api/routes',{},a.cookie);assert.equal(still.j.routes.length,1)}));
test('06 alert preferences validate and persist',async()=>withServer(async(base)=>{const a=await register(base);let bad=await req(base,'/api/alerts/preferences',{method:'PUT',body:JSON.stringify({delayThresholdMinutes:99})},a.cookie);assert.equal(bad.r.status,400);let ok=await req(base,'/api/alerts/preferences',{method:'PUT',body:JSON.stringify({serviceAlertsEnabled:true,delayAlertsEnabled:false,vehicleAlertsEnabled:true,delayThresholdMinutes:17,quietHoursEnabled:true,quietStart:'22:00',quietEnd:'06:00'})},a.cookie);assert.equal(ok.r.status,200);let g=await req(base,'/api/alerts/preferences',{},a.cookie);assert.equal(g.j.preferences.delayThresholdMinutes,17);assert.equal(g.j.preferences.vehicleAlertsEnabled,true)}));
test('07 notifications persist only for matching saved route codes',async()=>withServer(async(base)=>{const a=await register(base);await req(base,'/api/routes',{method:'POST',body:JSON.stringify(route)},a.cookie);const sync=await req(base,'/api/notifications/sync',{method:'POST',body:JSON.stringify({items:[{sourceKey:'yes',routes:['66'],title:'Relevant',message:'A'},{sourceKey:'no',routes:['111'],title:'Irrelevant',message:'B'}]})},a.cookie);assert.equal(sync.j.notifications.length,1);assert.equal(sync.j.notifications[0].title,'Relevant');const id=sync.j.notifications[0].id;const rd=await req(base,`/api/notifications/${id}/read`,{method:'PATCH'},a.cookie);assert.equal(rd.r.status,200)}));
test('08 auth failures, logout and CORS rejection are enforced',async()=>withServer(async(base)=>{await register(base);let bad=await req(base,'/api/auth/login',{method:'POST',body:JSON.stringify({email:'a@example.com',password:'wrong'})});assert.equal(bad.r.status,401);let no=await req(base,'/api/profile');assert.equal(no.r.status,401);let a=await req(base,'/api/auth/login',{method:'POST',body:JSON.stringify({email:'a@example.com',password:'password123'})});let out=await req(base,'/api/auth/logout',{method:'POST'},a.cookie);assert.equal(out.r.status,200);let after=await req(base,'/api/profile',{},out.cookie);assert.equal(after.r.status,401);let cors=await req(base,'/api/health',{},'','https://evil.example');assert.equal(cors.r.status,403)}));
test('09 source alerts are stored and retrieved separately from user notifications',async()=>withServer(async(base,repo)=>{const a=await register(base);await req(base,'/api/routes',{method:'POST',body:JSON.stringify(route)},a.cookie);await req(base,'/api/notifications/sync',{method:'POST',body:JSON.stringify({items:[{sourceKey:'a66',routes:['66'],title:'Route 66 alert',message:'Relevant'},{sourceKey:'a111',routes:['111'],title:'Route 111 alert',message:'Other'}]})},a.cookie);assert.equal(repo.alerts.length,2);const stored=await req(base,'/api/alerts/stored',{},a.cookie);assert.equal(stored.r.status,200);assert.equal(stored.j.alerts.length,1);assert.equal(stored.j.alerts[0].sourceKey,'a66')}));
test('10 profile and notifications remain isolated across two accounts',async()=>withServer(async(base)=>{const a=await register(base,'a@example.com');await req(base,'/api/profile',{method:'PUT',body:JSON.stringify({displayName:'Alice',occupation:'A-only'})},a.cookie);await req(base,'/api/routes',{method:'POST',body:JSON.stringify(route)},a.cookie);await req(base,'/api/notifications/sync',{method:'POST',body:JSON.stringify({items:[{sourceKey:'private-a',routes:['66'],title:'Alice note',message:'Only A'}]})},a.cookie);const b=await register(base,'b@example.com');const bp=await req(base,'/api/profile',{},b.cookie);assert.notEqual(bp.j.profile.occupation,'A-only');const bn=await req(base,'/api/notifications',{},b.cookie);assert.equal(bn.j.notifications.length,0);const an=await req(base,'/api/notifications',{},a.cookie);assert.equal(an.j.notifications.length,1)}));
