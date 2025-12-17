# Attireburg E-commerce Store

Premium German clothing brand e-commerce platform built with Next.js 15, TypeScript, and Prisma.

## Features

✅ **Complete Admin Portal** - Product management, orders, analytics  
✅ **Advanced Product System** - Categories, variations, attributes, inventory  
✅ **Media Library** - File management with folders and organization  
✅ **Bilingual Support** - German (primary) and English  
✅ **User Management** - Customer accounts, wishlists, order history  
✅ **Order System** - Complete checkout flow with PayPal integration  
✅ **Database Integration** - PostgreSQL with comprehensive schema  

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup
```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your PostgreSQL connection string
# DATABASE_URL="postgresql://username:password@localhost:5432/attireburg_db"

# Complete database setup (generates client, pushes schema, seeds data)
npm run db:setup
```

### 3. Start Development Server
```bash
npm run dev
```

Visit:
- **Store:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin
- **Login:** admin@attireburg.de / admin123

## Database Setup

For detailed database setup instructions, see [DATABASE_SETUP.md](./DATABASE_SETUP.md)

### Quick Commands
```bash
npm run db:setup     # Complete setup with sample data
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:studio    # Open database GUI
npm run db:seed      # Seed sample data
```

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.6
- **Database:** PostgreSQL with Prisma ORM 5.22
- **Styling:** Tailwind CSS 3.4
- **Authentication:** JWT with bcrypt
- **File Upload:** Built-in media management
- **Deployment:** Vercel-ready

## Project Structure