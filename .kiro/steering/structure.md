# Project Structure

## Root Directory
```
├── src/                 # Source code
├── prisma/             # Database schema and migrations
├── public/             # Static assets
├── .kiro/              # Kiro configuration and steering
├── .next/              # Next.js build output
└── node_modules/       # Dependencies
```

## Source Structure (`src/`)
```
src/
├── app/                # Next.js App Router pages
│   ├── layout.tsx      # Root layout with navigation
│   ├── page.tsx        # Homepage
│   ├── globals.css     # Global styles
│   └── products/       # Product pages
├── components/         # Reusable UI components
│   ├── Footer.tsx
│   ├── Navbar.tsx
│   └── LanguageSwitcher.tsx
└── lib/                # Utility libraries
    ├── prisma.ts       # Database client
    └── translations.ts # i18n translations
```

## Architecture Patterns

### App Router Structure
- Use `page.tsx` for route pages
- Use `layout.tsx` for shared layouts
- Client components marked with `'use client'`
- Server components by default

### Component Organization
- **Layout components** in root layout (Navbar, Footer)
- **Reusable components** in `src/components/`
- **Page-specific components** co-located with pages

### State Management
- React Context for global state (language switching)
- Local state with useState for component-specific data
- Custom hooks for shared logic (`useLanguage`)

### Database Layer
- Prisma client singleton pattern in `src/lib/prisma.ts`
- Models: Product, User, Order, OrderItem, Wishlist
- Indexes on frequently queried fields

### Internationalization
- Translation object in `src/lib/translations.ts`
- Language context provider in root layout
- Support for German (primary) and English
- Bilingual database fields (name/nameEn, description/descriptionEn)

## Naming Conventions
- **Files**: PascalCase for components, camelCase for utilities
- **Components**: PascalCase function names
- **Database**: camelCase fields, PascalCase models
- **CSS**: Tailwind utility classes, custom primary color palette