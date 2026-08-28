CREATE DATABASE IF NOT EXISTS srtos_qld_a3 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE srtos_qld_a3;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS profiles (
  user_id BIGINT UNSIGNED NOT NULL,
  display_name VARCHAR(100) NOT NULL DEFAULT '',
  phone VARCHAR(40) NULL,
  occupation VARCHAR(120) NULL,
  home_location VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT fk_profiles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS saved_routes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  route_name VARCHAR(120) NOT NULL,
  origin_label VARCHAR(255) NOT NULL,
  origin_lat DECIMAL(10,7) NOT NULL,
  origin_lon DECIMAL(10,7) NOT NULL,
  destination_label VARCHAR(255) NOT NULL,
  destination_lat DECIMAL(10,7) NOT NULL,
  destination_lon DECIMAL(10,7) NOT NULL,
  route_codes JSON NOT NULL,
  journey_snapshot JSON NULL,
  is_favourite BOOLEAN NOT NULL DEFAULT FALSE,
  usage_count INT UNSIGNED NOT NULL DEFAULT 0,
  last_used_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_saved_routes_user (user_id),
  KEY idx_saved_routes_user_favourite (user_id, is_favourite),
  CONSTRAINT fk_saved_routes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS alert_preferences (
  user_id BIGINT UNSIGNED NOT NULL,
  service_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  delay_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  vehicle_alerts_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  delay_threshold_minutes TINYINT UNSIGNED NOT NULL DEFAULT 10,
  quiet_hours_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  quiet_start TIME NULL,
  quiet_end TIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  CONSTRAINT chk_delay_threshold CHECK (delay_threshold_minutes BETWEEN 1 AND 60),
  CONSTRAINT fk_alert_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Source alerts are stored separately from per-user notifications so the assignment's
-- "alerts and notifications from MySQL" requirement is explicit and demonstrable.
CREATE TABLE IF NOT EXISTS alerts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  source_key VARCHAR(190) NOT NULL,
  source_name VARCHAR(80) NOT NULL DEFAULT 'Translink GTFS Realtime',
  route_codes JSON NOT NULL,
  category ENUM('service_alert','delay','vehicle','system') NOT NULL DEFAULT 'service_alert',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  severity ENUM('info','warning','critical') NOT NULL DEFAULT 'info',
  occurred_at TIMESTAMP NULL,
  first_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_alert_source_key (source_key),
  KEY idx_alerts_last_seen (last_seen_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  alert_id BIGINT UNSIGNED NULL,
  source_key VARCHAR(190) NOT NULL,
  route_code VARCHAR(50) NULL,
  category ENUM('service_alert','delay','vehicle','system') NOT NULL DEFAULT 'service_alert',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  severity ENUM('info','warning','critical') NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_notification_user_source (user_id, source_key),
  KEY idx_notifications_user_created (user_id, created_at),
  KEY idx_notifications_alert (alert_id),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_alert FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE USER IF NOT EXISTS 'srtos_app'@'localhost' IDENTIFIED BY 'QlCwgMEhowVYDvmOWKYNFENwlqXmQdcpAa9!';
ALTER USER 'srtos_app'@'localhost' IDENTIFIED BY 'QlCwgMEhowVYDvmOWKYNFENwlqXmQdcpAa9!';
GRANT SELECT, INSERT, UPDATE, DELETE ON srtos_qld_a3.* TO 'srtos_app'@'localhost';

CREATE USER IF NOT EXISTS 'srtos_app'@'127.0.0.1' IDENTIFIED BY 'QlCwgMEhowVYDvmOWKYNFENwlqXmQdcpAa9!';
ALTER USER 'srtos_app'@'127.0.0.1' IDENTIFIED BY 'QlCwgMEhowVYDvmOWKYNFENwlqXmQdcpAa9!';
GRANT SELECT, INSERT, UPDATE, DELETE ON srtos_qld_a3.* TO 'srtos_app'@'127.0.0.1';
FLUSH PRIVILEGES;