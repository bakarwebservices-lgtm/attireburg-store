# Database Setup Guide

This guide will help you set up the PostgreSQL database for the Attireburg e-commerce platform.

## Prerequisites

1. **PostgreSQL** installed and running
2. **Node.js** and **npm** installed
3. **Environment variables** configured

## Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the example environment file and configure your database:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set your database URL:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/attireburg_db"
```

### 3. Run Database Setup
This will generate the Prisma client, push the schema, and seed sample data:

```bash
npm run db:setup
```

### 4. Start Development Server
```bash
npm run dev
```

## Manual Setup

If you prefer to set up step by step:

### 1. Generate Prisma Client
```bash
npm run db:generate
```

### 2. Push Schema to Database
```bash
npm run db:push
```

### 3. Seed Sample Data
Start the development server first:
```bash
npm run dev
```

Then seed the database:
```bash
npm run db:seed
```

Or visit: http://localhost:3000/api/seed

## Database Schema

The database includes the following main entities:

### Core Entities
- **Users** - Customer and admin accounts
- **Products** - Product catalog with variations and attributes
- **ProductCategories** - Hierarchical category system
- **Orders** - Order management with items
- **Reviews** - Product reviews and ratings

### Supporting Entities
- **Addresses** - Customer shipping/billing addresses
- **WishlistItems** - Customer wishlists
- **MediaFiles** - File management system
- **Settings** - Application configuration

## Sample Data

The seeder creates:
- **3 product categories** (Pullover, Jacken, Strickwaren)
- **5 sample products** with German/English descriptions
- **1 admin user** (admin@attireburg.de / admin123)

## Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:setup` | Complete database setup |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema changes |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed sample data |

## API Endpoints

### Products
- `GET /api/products` - List products with filters
- `POST /api/products` - Create product
- `GET /api/products/[id]` - Get single product
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product
- `POST /api/products/bulk` - Bulk operations

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `GET /api/categories/[id]` - Get single category
- `PUT /api/categories/[id]` - Update category
- `DELETE /api/categories/[id]` - Delete category

### Analytics
- `GET /api/analytics` - Get analytics data

### System
- `GET /api/health` - Database health check
- `POST /api/seed` - Seed database (dev only)

## Troubleshooting

### Database Connection Issues
1. Ensure PostgreSQL is running
2. Check your `DATABASE_URL` in `.env.local`
3. Verify database exists and user has permissions

### Schema Issues
```bash
# Reset database (WARNING: This will delete all data)
npx prisma db push --force-reset
```

### Seeding Issues
1. Ensure development server is running (`npm run dev`)
2. Check that `/api/seed` endpoint is accessible
3. Verify no existing data conflicts

## Production Setup

For production deployment:

1. Set `NODE_ENV=production` in environment
2. Use a production PostgreSQL database
3. Run migrations instead of `db push`:
   ```bash
   npx prisma migrate deploy
   ```
4. Seeding is disabled in production for security

## Database Backup

To backup your database:
```bash
pg_dump -U username -h localhost attireburg_db > backup.sql
```

To restore:
```bash
psql -U username -h localhost attireburg_db < backup.sql
```