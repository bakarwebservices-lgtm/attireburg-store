# Attireburg E-commerce Store

Premium clothing brand e-commerce platform built with Next.js 15, TypeScript, and Prisma.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
- Create a free PostgreSQL database at [Neon.tech](https://neon.tech)
- Copy your connection string
- Paste it in `.env.local` file (replace `your-postgres-connection-string-here`)

### 3. Initialize Database
```bash
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## Tech Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL with Prisma ORM
- **Deployment:** Vercel

## Project Structure