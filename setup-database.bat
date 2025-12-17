@echo off
echo 🚀 Setting up Attireburg Database...
echo.

echo 📦 Generating Prisma client...
npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Failed to generate Prisma client
    pause
    exit /b 1
)

echo.
echo 🗄️ Pushing schema to database...
npx prisma db push
if %errorlevel% neq 0 (
    echo ❌ Failed to push schema to database
    echo ⚠️  Make sure your DATABASE_URL is configured in .env.local
    pause
    exit /b 1
)

echo.
echo ✅ Database setup complete!
echo.
echo 📋 Next steps:
echo    1. Run: npm run dev
echo    2. Visit: http://localhost:3000/api/seed
echo    3. Then visit: http://localhost:3000/admin
echo    4. Login with: admin@attireburg.de / admin123
echo.
pause