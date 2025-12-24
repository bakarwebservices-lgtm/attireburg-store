# Production Deployment Guide

This guide covers deploying Attireburg e-commerce store to production.

## 🚀 Pre-Deployment Checklist

### ✅ Core Functionality
- [x] Product catalog with variants
- [x] Shopping cart and checkout
- [x] User authentication and accounts
- [x] Order management system
- [x] Payment processing (PayPal, Google Pay, COD)
- [x] Email notifications
- [x] Admin dashboard
- [x] Inventory management
- [x] Backorder/waitlist system

### ✅ Production Requirements

#### Environment Variables
Copy `.env.example` to `.env.production` and configure:

```bash
# Required for Production
NODE_ENV="production"
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-secure-jwt-secret-32-chars-min"
NEXT_PUBLIC_BASE_URL="https://yourdomain.com"

# Payment Configuration
PAYPAL_CLIENT_ID="your-production-paypal-client-id"
PAYPAL_CLIENT_SECRET="your-production-paypal-client-secret"
PAYPAL_ENVIRONMENT="production"

GOOGLE_PAY_ENVIRONMENT="PRODUCTION"
GOOGLE_PAY_MERCHANT_ID="your-production-merchant-id"

# Email Configuration
EMAIL_PROVIDER="sendgrid"  # or "mailgun", "resend"
EMAIL_API_KEY="your-email-service-api-key"
FROM_EMAIL="noreply@yourdomain.com"
FROM_NAME="Your Store Name"

# Feature Flags
ENABLE_BACKORDERS="true"
ENABLE_WAITLIST="true"
ENABLE_VARIANTS="true"
ENABLE_ANALYTICS="true"
```

#### Database Setup
1. Set up PostgreSQL database (recommended: Supabase, Railway, or AWS RDS)
2. Run migrations:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
3. Seed initial data:
   ```bash
   npm run db:seed
   ```

#### Payment Setup
1. **PayPal**: 
   - Create production app at https://developer.paypal.com
   - Configure webhook endpoints
   - Test with real transactions

2. **Google Pay**:
   - Register merchant at https://pay.google.com/business/console
   - Configure payment methods
   - Test integration

#### Email Setup
Choose one email provider:
- **SendGrid**: Sign up at https://sendgrid.com
- **Mailgun**: Sign up at https://mailgun.com
- **Resend**: Sign up at https://resend.com

## 🌐 Deployment Options

### Option 1: Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Option 2: Railway
1. Connect GitHub repository to Railway
2. Configure environment variables
3. Deploy with automatic builds

### Option 3: Docker + VPS
1. Build Docker image:
   ```bash
   docker build -t attireburg-store .
   ```
2. Deploy to your VPS with docker-compose

### Option 4: AWS/GCP/Azure
Use their respective container services or static hosting.

## 🔧 Post-Deployment Setup

### 1. Health Check
Visit `https://yourdomain.com/api/health` to verify all systems are working.

### 2. Admin Account
Create admin account via API or database:
```bash
curl -X POST https://yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "secure-password",
    "firstName": "Admin",
    "lastName": "User",
    "isAdmin": true
  }'
```

### 3. Initial Products
1. Login to admin dashboard: `https://yourdomain.com/admin`
2. Add product categories
3. Upload product images
4. Create initial product catalog

### 4. Payment Testing
1. Test PayPal payments with small amounts
2. Verify Google Pay integration
3. Test cash-on-delivery flow

### 5. Email Testing
1. Place test order to verify confirmation emails
2. Test restock notifications
3. Verify shipping notifications

## 🔒 Security Checklist

- [ ] HTTPS enabled with valid SSL certificate
- [ ] Strong JWT secret (32+ characters)
- [ ] Database credentials secured
- [ ] API keys stored as environment variables
- [ ] CORS configured properly
- [ ] Rate limiting implemented (if needed)
- [ ] Input validation on all forms
- [ ] SQL injection protection (Prisma handles this)
- [ ] XSS protection enabled

## 📊 Monitoring & Analytics

### Health Monitoring
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Monitor `/api/health` endpoint
- Set up error tracking (Sentry)

### Business Analytics
- Enable Google Analytics
- Track conversion rates
- Monitor order completion rates
- Set up payment failure alerts

### Performance Monitoring
- Monitor page load times
- Track Core Web Vitals
- Monitor database performance
- Set up alerts for high error rates

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL format
   - Check database server status
   - Ensure IP whitelist includes your deployment

2. **Payment Failures**
   - Verify PayPal credentials
   - Check webhook configurations
   - Test with PayPal sandbox first

3. **Email Not Sending**
   - Verify email provider credentials
   - Check spam folders
   - Verify sender domain authentication

4. **Build Failures**
   - Check TypeScript errors
   - Verify all dependencies installed
   - Check environment variables

### Debug Commands
```bash
# Check health status
curl https://yourdomain.com/api/health

# Test database connection
npm run db:studio

# View logs (Vercel)
vercel logs

# Test email configuration
curl -X POST https://yourdomain.com/api/test-email
```

## 📈 Performance Optimization

### Before Launch
- [ ] Optimize images (WebP format)
- [ ] Enable compression
- [ ] Implement caching headers
- [ ] Minimize bundle size
- [ ] Enable database connection pooling

### After Launch
- Monitor performance metrics
- Optimize slow database queries
- Implement CDN for static assets
- Consider Redis for session storage
- Scale database as needed

## 🔄 Maintenance

### Regular Tasks
- Monitor error logs daily
- Update dependencies monthly
- Backup database weekly
- Review security updates
- Monitor payment processor changes

### Scaling Considerations
- Database read replicas
- CDN for global performance
- Load balancing for high traffic
- Microservices architecture for complex features

## 📞 Support

For deployment issues:
1. Check health endpoint first
2. Review application logs
3. Verify environment configuration
4. Test individual API endpoints
5. Contact hosting provider support if needed

---

**Ready for Production!** 🎉

Your Attireburg e-commerce store is now ready for production deployment with:
- Complete order management
- Multiple payment methods
- Email notifications
- Admin dashboard
- Inventory management
- Customer accounts
- Mobile-responsive design
- German/English localization