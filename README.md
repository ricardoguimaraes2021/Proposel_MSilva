# MSilva Proposals

A web application for creating and managing catering and event proposals. Build professional PDF quotes in Portuguese or English, manage clients and services, and keep everything in one place.

**Repository:** [Proposel_MSilva](https://github.com/ricardoguimaraes2021/Proposel_MSilva)

---

## Features

- **Proposals**
  - Multi-step wizard: client, event, services, content, summary
  - Reorder services before generating the PDF
  - PDF in **Portuguese** or **English** (titles, labels, terms, service names)
  - VAT options: values with or without VAT
  - Optional custom intro and general terms

- **Clients**
  - Register recurring clients (e.g. companies) with name, email, phone, company, NIF, address
  - Select a client when creating a proposal to auto-fill details and event location
  - NIF stored for invoicing

- **Services catalog**
  - Categories and services with PT/EN names and descriptions
  - Included items and priced options per service
  - Used in the proposal wizard and reflected in the PDF

- **Terms templates**
  - Create and edit general terms templates in **Settings**
  - Each template has **Portuguese** and **English** content for correct PDF language
  - Choose a template in the proposal content step and edit if needed

- **Company profile**
  - Company name, tagline (PT/EN), logo URL, contact details, address
  - Used in the PDF header and contact section

- **Authentication**
  - Sign up, login, password reset (Supabase Auth)
  - Protected dashboard routes

---

## Tech stack

- **Next.js** (App Router, React Server Components)
- **Supabase** (PostgreSQL, Auth)
- **React PDF** (`@react-pdf/renderer`) for PDF generation
- **Tailwind CSS** + **shadcn/ui** (Radix UI)
- **TypeScript**

---

## Prerequisites

- **Node.js** 20+
- A **Supabase** project ([supabase.com](https://supabase.com))

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/ricardoguimaraes2021/Proposel_MSilva.git
cd Proposel_MSilva
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment variables

Copy the example file and add your own values (do not commit `.env` or `.env.local`):

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key |

Get these from: **Supabase Dashboard → Project Settings → API**.

### 4. Database

Run the SQL scripts in your Supabase SQL editor in a sensible order:

1. **Schema:** `supabase-schema.sql` (creates tables)
2. **Migrations** (if you already have an older schema):  
   `supabase-migrate-clients.sql`, `supabase-migrate-remove-colors.sql`, etc.
3. **Seeds** (optional):  
   `supabase-seed-terms-templates.sql`, `supabase-seed.sql`, and any other seed files you need.

Refer to the file comments and your current schema when applying migrations.

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up or log in, then use the dashboard to create proposals, manage clients, and configure services and terms.

---

## Project structure

```
app/
  api/                    # API routes (proposals, clients, services, terms, etc.)
  auth/                   # Auth pages (login, sign-up, password reset)
  dashboard/              # Protected dashboard (proposals, clients, services, settings)
  layout.tsx, page.tsx
components/
  dashboard/              # Tables, wizards, dialogs for the dashboard
  pdf/                    # PDF document and preview components
  ui/                     # shadcn UI components
lib/
  supabase/              # Supabase client (browser + server)
  build-proposal-preview-data.ts
types/
  index.ts               # Shared TypeScript types
supabase-*.sql           # Schema, migrations, and seed scripts
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Security notes

- Do **not** commit `.env`, `.env.local`, or any file containing Supabase keys or secrets.
- The `.gitignore` is set to exclude environment and secret files; always review `git status` before committing.
- Use the **anon/public** key in the browser; keep the **service role** key only on the server if needed and never expose it to the client.

---

## License

MIT
