import mysql from 'mysql2/promise';

function jsonValue(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return value;
}
function routeRow(row) {
  return {
    id: Number(row.id), routeName: row.route_name, originLabel: row.origin_label,
    originLat: Number(row.origin_lat), originLon: Number(row.origin_lon),
    destinationLabel: row.destination_label, destinationLat: Number(row.destination_lat), destinationLon: Number(row.destination_lon),
    routeCodes: jsonValue(row.route_codes, []), journeySnapshot: jsonValue(row.journey_snapshot, null),
    isFavourite: Boolean(row.is_favourite), usageCount: Number(row.usage_count), lastUsedAt: row.last_used_at,
    createdAt: row.created_at, updatedAt: row.updated_at
  };
}
function alertRow(row) {
  return {
    id:Number(row.id), sourceKey:row.source_key, sourceName:row.source_name,
    routeCodes:jsonValue(row.route_codes, []), category:row.category, title:row.title,
    message:row.message, severity:row.severity, occurredAt:row.occurred_at,
    firstSeenAt:row.first_seen_at, lastSeenAt:row.last_seen_at
  };
}
export function createMySqlRepository(env = process.env) {
  const pool = mysql.createPool({
    host: env.MYSQL_HOST || '127.0.0.1', port: Number(env.MYSQL_PORT || 3306),
    user: env.MYSQL_USER, password: env.MYSQL_PASSWORD, database: env.MYSQL_DATABASE || 'srtos_qld_a3',
    waitForConnections: true, connectionLimit: 10, queueLimit: 0, charset: 'utf8mb4'
  });
  return {
    async ping() { await pool.query('SELECT 1'); },
    async close() { await pool.end(); },
    async createUser({ email, passwordHash, displayName }) {
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        const [r] = await conn.execute('INSERT INTO users(email,password_hash) VALUES (?,?)', [email, passwordHash]);
        const id = Number(r.insertId);
        await conn.execute('INSERT INTO profiles(user_id,display_name) VALUES (?,?)', [id, displayName || '']);
        await conn.execute('INSERT INTO alert_preferences(user_id) VALUES (?)', [id]);
        await conn.commit();
        return { id, email };
      } catch (e) { await conn.rollback(); throw e; } finally { conn.release(); }
    },
    async findUserByEmail(email) {
      const [rows] = await pool.execute('SELECT id,email,password_hash FROM users WHERE email=? LIMIT 1', [email]);
      return rows[0] ? { id:Number(rows[0].id), email:rows[0].email, passwordHash:rows[0].password_hash } : null;
    },
    async findUserById(id) {
      const [rows] = await pool.execute('SELECT id,email FROM users WHERE id=? LIMIT 1', [id]);
      return rows[0] ? { id:Number(rows[0].id), email:rows[0].email } : null;
    },
    async getProfile(userId) {
      const [rows] = await pool.execute(`SELECT u.id,u.email,p.display_name,p.phone,p.occupation,p.home_location,p.updated_at
        FROM users u JOIN profiles p ON p.user_id=u.id WHERE u.id=?`, [userId]);
      const r=rows[0]; if(!r) return null;
      return { userId:Number(r.id), email:r.email, displayName:r.display_name, phone:r.phone, occupation:r.occupation, homeLocation:r.home_location, updatedAt:r.updated_at };
    },
    async updateProfile(userId, p) {
      await pool.execute(`UPDATE profiles SET display_name=?,phone=?,occupation=?,home_location=? WHERE user_id=?`,
        [p.displayName ?? '', p.phone || null, p.occupation || null, p.homeLocation || null, userId]);
      return this.getProfile(userId);
    },
    async listRoutes(userId, favouriteOnly=false) {
      const [rows]=await pool.execute(`SELECT * FROM saved_routes WHERE user_id=? ${favouriteOnly?'AND is_favourite=1':''} ORDER BY is_favourite DESC,updated_at DESC`,[userId]);
      return rows.map(routeRow);
    },
    async getRoute(userId,id) { const [rows]=await pool.execute('SELECT * FROM saved_routes WHERE id=? AND user_id=?',[id,userId]); return rows[0]?routeRow(rows[0]):null; },
    async createRoute(userId,r) {
      const [res]=await pool.execute(`INSERT INTO saved_routes(user_id,route_name,origin_label,origin_lat,origin_lon,destination_label,destination_lat,destination_lon,route_codes,journey_snapshot,is_favourite)
        VALUES (?,?,?,?,?,?,?,?,CAST(? AS JSON),CAST(? AS JSON),?)`,
        [userId,r.routeName,r.originLabel,r.originLat,r.originLon,r.destinationLabel,r.destinationLat,r.destinationLon,JSON.stringify(r.routeCodes||[]),JSON.stringify(r.journeySnapshot??null),r.isFavourite?1:0]);
      return this.getRoute(userId,Number(res.insertId));
    },
    async updateRoute(userId,id,p) {
      const current=await this.getRoute(userId,id); if(!current) return null;
      await pool.execute('UPDATE saved_routes SET route_name=?,is_favourite=? WHERE id=? AND user_id=?',[p.routeName??current.routeName,p.isFavourite==null?(current.isFavourite?1:0):(p.isFavourite?1:0),id,userId]);
      return this.getRoute(userId,id);
    },
    async deleteRoute(userId,id) { const [r]=await pool.execute('DELETE FROM saved_routes WHERE id=? AND user_id=?',[id,userId]); return r.affectedRows>0; },
    async markRouteUsed(userId,id) {
      const [r]=await pool.execute('UPDATE saved_routes SET usage_count=usage_count+1,last_used_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?',[id,userId]);
      return r.affectedRows?this.getRoute(userId,id):null;
    },
    async getPreferences(userId) {
      const [rows]=await pool.execute('SELECT * FROM alert_preferences WHERE user_id=?',[userId]); const r=rows[0]; if(!r)return null;
      return {serviceAlertsEnabled:Boolean(r.service_alerts_enabled),delayAlertsEnabled:Boolean(r.delay_alerts_enabled),vehicleAlertsEnabled:Boolean(r.vehicle_alerts_enabled),delayThresholdMinutes:Number(r.delay_threshold_minutes),quietHoursEnabled:Boolean(r.quiet_hours_enabled),quietStart:r.quiet_start,quietEnd:r.quiet_end};
    },
    async updatePreferences(userId,p) {
      await pool.execute(`UPDATE alert_preferences SET service_alerts_enabled=?,delay_alerts_enabled=?,vehicle_alerts_enabled=?,delay_threshold_minutes=?,quiet_hours_enabled=?,quiet_start=?,quiet_end=? WHERE user_id=?`,
        [p.serviceAlertsEnabled?1:0,p.delayAlertsEnabled?1:0,p.vehicleAlertsEnabled?1:0,p.delayThresholdMinutes,p.quietHoursEnabled?1:0,p.quietStart||null,p.quietEnd||null,userId]);
      return this.getPreferences(userId);
    },
    async routeCodes(userId) {
      const routes=await this.listRoutes(userId,false); return [...new Set(routes.flatMap(r=>r.routeCodes).map(String))];
    },
    async upsertAlerts(items) {
      for (const n of items) {
        const routes=[...new Set((n.routes||[]).map(String).filter(Boolean))].slice(0,50);
        await pool.execute(`INSERT INTO alerts(source_key,source_name,route_codes,category,title,message,severity,occurred_at)
          VALUES (?,?,CAST(? AS JSON),?,?,?,?,?)
          ON DUPLICATE KEY UPDATE route_codes=VALUES(route_codes),category=VALUES(category),title=VALUES(title),message=VALUES(message),severity=VALUES(severity),occurred_at=VALUES(occurred_at),last_seen_at=CURRENT_TIMESTAMP`,
          [String(n.sourceKey),String(n.sourceName||'Translink GTFS Realtime').slice(0,80),JSON.stringify(routes),n.category||'service_alert',String(n.title||'Service alert').slice(0,255),String(n.message||''),n.severity||'info',n.occurredAt||null]);
      }
    },
    async listAlertsForUser(userId) {
      const allowed=new Set(await this.routeCodes(userId));
      const [rows]=await pool.execute('SELECT * FROM alerts ORDER BY last_seen_at DESC,id DESC LIMIT 100');
      return rows.map(alertRow).filter(a=>a.routeCodes.length===0||a.routeCodes.some(code=>allowed.has(String(code))));
    },
    async syncNotifications(userId,items) {
      await this.upsertAlerts(items);
      const allowed=new Set(await this.routeCodes(userId));
      for(const n of items){
        const routes=(n.routes||[]).map(String); const matched=routes.length===0?null:routes.find(x=>allowed.has(x));
        if(routes.length && !matched) continue;
        const [alertRows]=await pool.execute('SELECT id FROM alerts WHERE source_key=? LIMIT 1',[String(n.sourceKey)]);
        const alertId=alertRows[0]?Number(alertRows[0].id):null;
        await pool.execute(`INSERT INTO notifications(user_id,alert_id,source_key,route_code,category,title,message,severity,occurred_at)
          VALUES (?,?,?,?,?,?,?,?,COALESCE(?,CURRENT_TIMESTAMP)) ON DUPLICATE KEY UPDATE alert_id=VALUES(alert_id),title=VALUES(title),message=VALUES(message),severity=VALUES(severity),route_code=VALUES(route_code)`,
          [userId,alertId,String(n.sourceKey),matched||null,n.category||'service_alert',String(n.title).slice(0,255),String(n.message||''),n.severity||'info',n.occurredAt||null]);
      }
      return this.listNotifications(userId);
    },
    async listNotifications(userId) {
      const [rows]=await pool.execute('SELECT * FROM notifications WHERE user_id=? ORDER BY occurred_at DESC,id DESC LIMIT 100',[userId]);
      return rows.map(r=>({id:Number(r.id),alertId:r.alert_id?Number(r.alert_id):null,sourceKey:r.source_key,routeCode:r.route_code,category:r.category,title:r.title,message:r.message,severity:r.severity,isRead:Boolean(r.is_read),occurredAt:r.occurred_at,createdAt:r.created_at}));
    },
    async markNotificationRead(userId,id) { const [r]=await pool.execute('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?',[id,userId]); return r.affectedRows>0; }
  };
}
