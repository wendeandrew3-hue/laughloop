# LaughLoop — Live Comedy & Shows

Live: https://laughlooplive.vercel.app
Admin: https://laughlooplive.vercel.app/admin.html (password in laughloop-admin-credentials.txt)

Static site (index.html + styles.css + app.js) + Vercel serverless API (api/) backed by
a dedicated Neon Postgres database (laughloop, tables: orders, subscribers, show_submissions).

Deployed on the Vercel team "drew" as project "laughloop". Env vars on the project:
DATABASE_URL (Neon laughloop db), ADMIN_PASSWORD.

Test-mode checkout: card numbers never stored; only brand + last 4 digits.
