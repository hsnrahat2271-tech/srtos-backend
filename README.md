# SRTOS QLD – Assessment 3 MySQL Backend

This is the account/personalisation backend that is manually integrated with the existing Lovable SRTOS QLD transport frontend. It does **not** replace the existing Translink/OSRM journey APIs.

## Implements
- Register / Log In / Log Out using bcrypt password hashes and an HttpOnly JWT session cookie.
- User profile read/update.
- MySQL saved routes and favourites, owned by the logged-in user.
- Usage count for saved routes.
- Per-user alert preferences.
- A dedicated MySQL `alerts` table for source alerts.
- Per-user MySQL `notifications` linked to stored alerts where applicable.
- CORS allow-list and server-side user ownership checks.

## Required MySQL tables
`users`, `profiles`, `saved_routes`, `alert_preferences`, `alerts`, `notifications`.

## Windows quick start
1. Install Node.js LTS and MySQL Community Server + MySQL Workbench.
2. In Workbench, run `sql/schema.sql` while connected as root.
3. Open `sql/02_CREATE_APP_USER_TEMPLATE.sql`, replace `CHANGE_ME_STRONG_PASSWORD` in all four places with the same password, then run the file as root.
4. Copy `.env.example` to `.env`. Put the same password after `MYSQL_PASSWORD=` and generate a 32+ character `JWT_SECRET`.
5. Run `npm install`, `npm run check`, `npm test`, `npm run smoke:mysql`, then `npm start`.
6. Open `http://localhost:4173/api/health`. It must report `status: "ok"` and `database: "MySQL"`.

## Local only
Hosting is not required. Keep frontend and backend on `localhost` consistently during the demonstration.

## Notification boundary
This submission implements **in-app** notifications. It does not claim SMS, email or push delivery because no external messaging provider was specified.
