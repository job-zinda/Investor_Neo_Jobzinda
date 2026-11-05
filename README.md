# Neo JobZinda Corporate & Investor Platform

Starter full-stack implementation for neojobzinda.com.

## Architecture
- `frontend/`: React + Vite + Tailwind + React Router + Recharts
- `backend/`: Django + Django REST Framework + SimpleJWT + PostgreSQL
- Public pages: company landing page, ecosystem/app directory, announcements, contact
- Private pages: investor dashboard and admin dashboard

## Important
This is a deployable starter, not a live deployment. Before production:
1. Set strong secrets and database credentials in environment variables.
2. Configure HTTPS, domain DNS, backups, email delivery and private media storage.
3. Review financial/legal disclosures with the company's accountant and lawyer.
4. Add verified app URLs, company registration details, leadership details and approved metrics.
5. Run migrations and create the first superuser.

## Backend setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

## Frontend setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend defaults to `http://localhost:5173`; API defaults to `http://127.0.0.1:8000/api`.

## Deploy the backend to Render

The root `render.yaml` defines a Render Blueprint for the Django API. Push this repository to a Git provider, create a Render PostgreSQL database, then create a new Blueprint in Render and connect the repository. When prompted for `DATABASE_URL`, provide the database's internal connection URL. Set `CORS_ALLOWED_ORIGINS` to the deployed frontend's full origin (for example, `https://your-site.onrender.com`).

The Blueprint currently uses Render's free web-service plan for a low-cost preview. Free web services sleep while idle and do not provide the service Shell. Render's free Postgres expires after 30 days, so choose a paid Postgres plan for data you need to keep. Uploaded logos and financial documents also need durable object storage or a persistent disk before production use.

The admin URL is `https://<your-api-host>/django-admin/`. To create the first Django admin account, use the service Shell on a paid web-service plan and run `python manage.py createsuperuser`. On the free web-service plan, connect from a trusted local machine using the database's external URL and run the same command with `DATABASE_URL` set to that URL.

The separate React admin app is in `admin-frontend` and runs locally at `http://localhost:5174`. It uses the Django staff token endpoints and protected admin APIs. Staff can create investor usernames, profiles, and initial passwords there; Django validates and hashes passwords, and the API never returns them. Inactive investor profiles cannot access the investor dashboard. Public website and admin app origins both need to be included in `CORS_ALLOWED_ORIGINS`.

The root `render.yaml` also defines the admin React app as a static site. The Blueprint prompts for `VITE_API_URL` and `VITE_PUBLIC_SITE_URL`; provide `https://<your-api-host>/api` and the public website URL. For the public website, deploy `frontend` as another Render Static Site with `npm ci && npm run build` as its build command and `dist` as its publish directory. Set its `VITE_API_URL` to `https://<your-api-host>/api` and `VITE_ADMIN_URL` to the deployed admin site URL.

## Roles
- `ADMIN`: full access to company content, financial records and investor accounts.
- `INVESTOR`: read-only access to company-level published financial summaries and their own investment records.
- Django superusers/staff can manage all records through Django Admin.

Financial records use decimal currency fields. The starter defaults to INR. Do not treat the dashboard as audited financial statements.
