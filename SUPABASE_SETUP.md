# 🎯 Supabase Setup Instructions

## Quick Setup

1. **Create Supabase Account**: https://supabase.com
2. **Create New Project**:
   - Name: `attireburg-store`
   - Password: (create and save it!)
   - Region: Choose closest
   - Plan: Free

3. **Get Connection String**:
   - Click "Connect" button
   - Select "Connection string" tab
   - Choose "Connection pooling"
   - Mode: "Transaction"
   - Copy the string

4. **Update `.env.local`**:
   Replace the DATABASE_URL with your Supabase connection string:
   ```
   DATABASE_URL="postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-region.pooler.supabase.com:6543/postgres"
   ```

5. **Restart Dev Server**:
   ```cmd
   # Stop current server (Ctrl+C)
   npm run dev
   ```

6. **Seed Database**:
   ```cmd
   curl -X POST http://localhost:3003/api/seed -H "Content-Type: application/json" -d "{\"type\":\"all\"}"
   ```

## Why Supabase?
- ✅ More reliable connection
- ✅ Better free tier
- ✅ Built-in dashboard
- ✅ Real-time features
- ✅ Easier to use

## Troubleshooting
- Make sure to use **Connection Pooling** (port 6543)
- Replace `[YOUR-PASSWORD]` with actual password
- Use **Transaction mode** for Prisma compatibility