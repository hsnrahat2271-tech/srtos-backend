import mysql from 'mysql2/promise';
const env=process.env;
const c=await mysql.createConnection({host:env.MYSQL_HOST||'127.0.0.1',port:Number(env.MYSQL_PORT||3306),user:env.MYSQL_USER,password:env.MYSQL_PASSWORD,database:env.MYSQL_DATABASE||'srtos_qld_a3'});
try{
 const [v]=await c.query('SELECT VERSION() AS version');
 const required=['users','profiles','saved_routes','alert_preferences','alerts','notifications'];
 const [tables]=await c.query(`SELECT table_name FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name IN (${required.map(()=>'?').join(',')})`,required);
 if(tables.length!==6) throw new Error(`Expected 6 A3 tables, found ${tables.length}`);
 await c.beginTransaction();
 const email=`smoke-${Date.now()}@example.invalid`;
 const [u]=await c.execute("INSERT INTO users(email,password_hash) VALUES (?,?)",[email,'smoke-not-a-real-login-hash']); const uid=Number(u.insertId);
 await c.execute("INSERT INTO profiles(user_id,display_name) VALUES (?,?)",[uid,'Smoke Test']);
 await c.execute("INSERT INTO alert_preferences(user_id) VALUES (?)",[uid]);
 const [r]=await c.execute("INSERT INTO saved_routes(user_id,route_name,origin_label,origin_lat,origin_lon,destination_label,destination_lat,destination_lon,route_codes,journey_snapshot,is_favourite) VALUES (?,?,?,?,?,?,?,?,CAST(? AS JSON),CAST(? AS JSON),?)",[uid,'Smoke route','Brisbane Central',-27.4663,153.026,'UQ St Lucia',-27.4975,153.0137,JSON.stringify(['66']),JSON.stringify({smoke:true}),1]);
 const sourceKey=`smoke-alert-${Date.now()}`;
 const [a]=await c.execute("INSERT INTO alerts(source_key,route_codes,title,message,severity) VALUES (?,CAST(? AS JSON),?,?,?)",[sourceKey,JSON.stringify(['66']),'Smoke source alert','MySQL alert storage check','info']);
 await c.execute("INSERT INTO notifications(user_id,alert_id,source_key,route_code,title,message,severity) VALUES (?,?,?,?,?,?,?)",[uid,Number(a.insertId),sourceKey,'66','Smoke notification','MySQL insert/read/rollback check','info']);
 const [rows]=await c.execute('SELECT id,route_name,is_favourite FROM saved_routes WHERE id=? AND user_id=?',[Number(r.insertId),uid]); if(rows.length!==1||!rows[0].is_favourite) throw new Error('Saved-route ownership/favourite smoke check failed');
 const [alertRows]=await c.execute('SELECT id FROM alerts WHERE id=?',[Number(a.insertId)]); if(alertRows.length!==1) throw new Error('Alert storage smoke check failed');
 await c.rollback();
 console.log(`MySQL smoke: PASS (server ${v[0].version}; 6 tables; transaction insert/select/rollback succeeded)`);
} catch(e){try{await c.rollback()}catch{};console.error('MySQL smoke: FAIL',e);process.exitCode=1} finally{await c.end()}
