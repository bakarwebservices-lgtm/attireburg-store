# Technology Stack

## Framework & Runtime
- **Next.js 15.1** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5.6** - Type safety and development experience
- **Node.js** - Runtime environment

## Database & ORM
- **PostgreSQL** - Primary database
- **Prisma 5.22** - Database ORM and migrations
- Database connection via `DATABASE_URL` environment variable

## Styling & UI
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Custom color palette** - Primary brand colors (browns/earth tones)
- **Inter font** - Google Fonts integration
- **Responsive design** - Mobile-first approach

## Key Libraries
- **@prisma/client** - Database client
- **autoprefixer** - CSS vendor prefixes
- **postcss** - CSS processing

## Development Tools
- **ESLint** - Code linting via Next.js
- **TypeScript strict mode** - Enhanced type checking
- **Path aliases** - `@/*` maps to `./src/*`

## Common Commands
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema changes
npx prisma studio    # Open database GUI
```

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - Environment (development/production)