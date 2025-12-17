# 🚀 Attireburg E-commerce Setup Guide

Complete setup guide for the Attireburg premium clothing e-commerce platform.

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js 18+** installed
- **PostgreSQL** database (local or cloud)
- **Git** for version control
- **Code editor** (VS Code recommended)

## 🏗️ Project Setup

### 1. Clone & Install
```bash
# Clone the repository
git clone <your-repo-url>
cd attireburg-store

# Install dependencies
npm install
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Database (Required)
DATABASE_URL="postgresql://username:password@localhost:5432/attireburg_db"

# JWT Secret (Required)
JWT_SECRET="your-super-secret-jwt-key-here"

# Environment
NODE_ENV="development"

# Optional: External Services
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### 3. Database Setup
```bash
# Complete database setup (recommended)
npm run db:setup
```

This command will:
- Generate Prisma client
- Push schema to database
- Seed sample data
- Create admin user

**Alternative manual setup:**
```bash
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run dev          # Start development server
npm run db:seed      # Seed sample data
```

### 4. Start Development Server
```bash
npm run dev
```

## 🎯 Access Points

After setup, you can access:

| Service | URL | Credentials |
|---------|-----|-------------|
| **Store Frontend** | http://localhost:3000 | - |
| **Admin Panel** | http://localhost:3000/admin | admin@attireburg.de / admin123 |
| **Database GUI** | `npm run db:studio` | - |
| **API Health** | http://localhost:3000/api/health | - |
| **Database Test** | http://localhost:3000/api/test-db | - |

## 🗄️ Database Information

### Schema Overview
- **Users** - Customer and admin accounts
- **Products** - Complete product catalog with variations
- **ProductCategories** - Hierarchical category system
- **Orders** - Order management with items and tracking
- **Reviews** - Product reviews and ratings
- **MediaFiles** - File management system
- **Settings** - Application configuration

### Sample Data
The seeder creates:
- **3 categories**: Pullover, Jacken, Strickwaren
- **5 products**: Premium German clothing items
- **1 admin user**: Full access to admin panel

### Database Commands
```bash
npm run db:setup     # Complete setup with sample data
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema changes
npm run db:studio    # Open Prisma Studio GUI
npm run db:seed      # Seed sample data only
```

## 🔧 Development Workflow

### Adding New Products
1. Visit `/admin/products/new`
2. Fill in product details (German + English)
3. Upload images via media library
4. Set categories, pricing, and inventory
5. Publish when ready

### Managing Categories
1. Visit `/admin/products` → Categories tab
2. Create hierarchical category structure
3. Assign products to categories
4. Manage category images and descriptions

### Order Management
1. Visit `/admin/orders`
2. View order details and customer information
3. Update order status and tracking
4. Process refunds and cancellations

### User Management
1. Visit `/admin/users`
2. View customer accounts and activity
3. Manage admin permissions
4. Handle customer support requests

## 📊 Admin Features

### Dashboard
- Real-time database connection status
- Product, order, and user statistics
- Recent orders and top-selling products
- Quick action shortcuts

### Product Management
- Advanced product editor with variations
- Bulk operations (status, category, delete)
- Import/export functionality
- SEO optimization tools
- Inventory management

### Media Library
- Organized file management with folders
- Image upload and optimization
- Bulk operations and search
- Integration with product editor

### Analytics
- Sales performance tracking
- Product popularity metrics
- Customer behavior insights
- Revenue reporting

## 🌐 API Endpoints

### Products
```
GET    /api/products              # List products with filters
POST   /api/products              # Create product
GET    /api/products/[id]         # Get single product
PUT    /api/products/[id]         # Update product
DELETE /api/products/[id]         # Delete product
POST   /api/products/bulk         # Bulk operations
```

### Categories
```
GET    /api/categories            # List categories
POST   /api/categories            # Create category
GET    /api/categories/[id]       # Get single category
PUT    /api/categories/[id]       # Update category
DELETE /api/categories/[id]       # Delete category
```

### System
```
GET    /api/health                # Database health check
GET    /api/test-db               # Database connection test
POST   /api/seed                  # Seed database (dev only)
GET    /api/analytics             # Analytics data
```

## 🚀 Production Deployment

### Environment Variables
```env
NODE_ENV="production"
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
NEXTAUTH_SECRET="your-production-nextauth-secret"
NEXTAUTH_URL="https://your-domain.com"
```

### Build & Deploy
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Database Migration
```bash
# Generate migration
npx prisma migrate dev --name init

# Deploy to production
npx prisma migrate deploy
```

## 🔍 Troubleshooting

### Database Connection Issues
1. Check PostgreSQL is running
2. Verify `DATABASE_URL` format
3. Ensure database exists
4. Check user permissions

### Build Errors
1. Clear Next.js cache: `rm -rf .next`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check TypeScript errors: `npm run lint`

### Seeding Issues
1. Ensure development server is running
2. Check `/api/seed` endpoint accessibility
3. Clear existing data if conflicts occur

### Performance Issues
1. Check database indexes
2. Optimize image sizes
3. Enable caching in production
4. Monitor database queries

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)

## 🆘 Support

For issues and questions:
1. Check this setup guide
2. Review the [DATABASE_SETUP.md](./DATABASE_SETUP.md)
3. Check API endpoints at `/api/health` and `/api/test-db`
4. Review console logs for detailed error messages

---

**🎉 Congratulations!** Your Attireburg e-commerce platform is now ready for development and customization.