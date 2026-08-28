# Requirements traceability

- User profile: `profiles` table + `/api/profile` GET/PUT.
- Login/logout/authentication: bcrypt + signed HttpOnly JWT session cookie + `/api/auth/*`.
- Saved/favourite routes: `saved_routes` table; owner-scoped CRUD; `is_favourite`; usage count.
- Alerts: dedicated MySQL `alerts` table populated from current Translink alerts supplied by the existing frontend `/api/live` route.
- Notifications: MySQL `notifications` table, linked to a user and optionally to a stored alert; route-scoped notifications are created only when the user's saved route codes match.
- Alert preferences: `alert_preferences` table.
- MySQL: all account/profile/route/preference/alert/notification persistence is MySQL.
- Existing website preservation: account backend is additive; Translink/OSRM/geocode/journey/live transport APIs remain in the Lovable frontend project.
- No Base44. No Lovable prompt-generated implementation. Frontend integration is source-code overlay/manual integration.
