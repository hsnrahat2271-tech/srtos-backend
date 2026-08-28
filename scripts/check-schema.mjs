import fs from 'node:fs';
const sql=fs.readFileSync(new URL('../sql/schema.sql', import.meta.url),'utf8');
const required=['users','profiles','saved_routes','alert_preferences','alerts','notifications'];
for(const t of required){if(!new RegExp(`CREATE\\s+TABLE\\s+IF\\s+NOT\\s+EXISTS\\s+${t}\\b`,'i').test(sql))throw new Error(`Missing table ${t}`)}
for(const phrase of ['fk_profiles_user','fk_saved_routes_user','fk_alert_preferences_user','fk_notifications_user','fk_notifications_alert','ON DELETE CASCADE','ON DELETE SET NULL']){if(!sql.includes(phrase))throw new Error(`Missing schema rule: ${phrase}`)}
console.log('Schema check: PASS (6 required MySQL tables + ownership/cascade relations present).');
