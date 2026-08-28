USE srtos_qld_a3;
SHOW TABLES;
SELECT id,email,created_at FROM users ORDER BY id;
SELECT id,user_id,route_name,is_favourite,usage_count,last_used_at FROM saved_routes ORDER BY id;
SELECT id,source_key,title,last_seen_at FROM alerts ORDER BY id DESC LIMIT 10;
SELECT id,user_id,source_key,route_code,title,is_read FROM notifications ORDER BY id DESC LIMIT 10;
-- Do NOT screenshot password_hash, MYSQL_PASSWORD or JWT_SECRET.
