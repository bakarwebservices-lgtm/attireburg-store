# 🚀 Quick Setup Guide for Attireburg

## Prerequisites
You need a PostgreSQL database. Here are your options:

### Option 1: Local PostgreSQL
If you have PostgreSQL installed locally:
```
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/attireburg_db"
```

### Option 2: Free Cloud Database (Recommended)
Get a free PostgreSQL database from:
- **Neon.tech** (recommended): https://neon.tech
- **Supabase**: https://supabase.com
- **Railway**: https://railway.app

## Setup Steps

### 1. Configure Database
Edit `.env.local` and replace the DATABASE_URL with your actual connection string:
```env
DATABASE_URL="your-actual-postgresql-connection-string-here"
```

### 2. Run Setup (Choose one method)

#### Method A: Using Batch File (Easiest)
Double-click `setup-database.bat` or run in Command Prompt:
```cmd
setup-database.bat
```

#### Method B: Manual Commands
Run these commands in Command Prompt (not PowerShell):
```cmd
npx prisma generate
npx prisma db push
npm run dev
```

### 3. Seed Sample Data
After the development server is running, visit:
```
http://localhost:3000/api/seed
```

### 4. Access Admin Panel
Visit the admin panel:
```
http://localhost:3000/admin
```
Login with:
- Email: `admin@attireburg.de`
- Password: `admin123`

## Troubleshooting

### PowerShell Issues
If you get PowerShell execution policy errors:
1. Open PowerShell as Administrator
2. Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
3. Or use Command Prompt instead

### Database Connection Issues
1. Make sure PostgreSQL is running (if local)
2. Check your DATABASE_URL format
3. Ensure the database exists
4. Verify credentials are correct

### Need Help?
- Check the database connection: http://localhost:3000/api/health
- Test database operations: http://localhost:3000/api/test-db
- View detailed logs in the terminal

## What You'll Get
- ✅ Complete e-commerce database schema
- ✅ 3 product categories (Pullover, Jacken, Strickwaren)
- ✅ 5 sample German products
- ✅ Admin user account
- ✅ Full admin panel with real data
- ✅ Working API endpoints

## Next Steps After Setup
1. Explore the admin panel at `/admin`
2. Add your own products
3. Customize the store design
4. Configure payment methods
5. Deploy to production

Happy coding! 🎉