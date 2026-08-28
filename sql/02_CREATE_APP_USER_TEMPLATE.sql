-- STANDALONE/BACKUP SETUP ONLY.
-- If you are using the outer ZERO-TO-DEMO handover, its preparation script creates this automatically.
-- Otherwise replace CHANGE_ME_STRONG_PASSWORD in ALL FOUR places below with the same strong password,
-- then run this entire file in MySQL Workbench while connected as root.
CREATE USER IF NOT EXISTS 'srtos_app'@'localhost' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
ALTER USER 'srtos_app'@'localhost' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE ON srtos_qld_a3.* TO 'srtos_app'@'localhost';
CREATE USER IF NOT EXISTS 'srtos_app'@'127.0.0.1' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
ALTER USER 'srtos_app'@'127.0.0.1' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE ON srtos_qld_a3.* TO 'srtos_app'@'127.0.0.1';
FLUSH PRIVILEGES;
