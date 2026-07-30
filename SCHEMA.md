# Database Schema Documentation

This document provides a comprehensive overview of the database structure for **Attireburg Store**. The database is managed via [Prisma ORM](https://www.prisma.io/) with a PostgreSQL backend (hosted on Supabase).

---

## Entity-Relationship Overview

The database model is structured around core e-commerce entities:
- **Products & Variants**: Catalog items, size/color variations, stock, and pricing overrides.
- **Users & Authentication**: User accounts, contact details, address records, and role flags (`isAdmin`).
- **Orders & Financial Transactions**: Order lifecycle, shipping addresses, discounts, and line items.
- **Cart & Wishlist**: Persistent shopping cart state and saved wishlist items.
- **Backorder & Restock System**: Waitlist subscriptions, automated notification metrics, and estimated restock schedules.
- **Store Operations & CMS**: Categories, promotional coupons, site settings, legal content, newsletter subscriptions, and contact messages.

---

## Database Enums

### `OrderStatus`
Defines the lifecycle state of a customer order.

| Value | Description |
| :--- | :--- |
| `PENDING` | Order created; awaiting payment confirmation or processing |
| `PROCESSING` | Payment confirmed; order being prepared for dispatch |
| `SHIPPED` | Order dispatched with carrier tracking |
| `DELIVERED` | Order successfully delivered to customer |
| `CANCELLED` | Order cancelled by user or admin |

---

## Data Models (Tables)

### 1. `Product`
Stores main catalog item data, including pricing, details, multi-language descriptions, SEO tags, and links to variants, reviews, and inventory systems.

- **Table Name**: `Product`
- **Primary Key**: `id` (`String`, `cuid()`)

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id`, `@default(cuid())` | Unique product identifier |
| `name` | `String` | — | Product name (German/Default) |
| `nameEn` | `String` | — | Product name in English |
| `description` | `String` | `@db.Text` | Detailed product description (German) |
| `descriptionEn` | `String` | `@db.Text` | Detailed product description (English) |
| `price` | `Float` | — | Base price in Euros (€) |
| `currency` | `String` | `@default("EUR")` | Price currency code |
| `images` | `String[]` | — | Array of image URLs |
| `category` | `String` | — | Category identifier/slug |
| `sizes` | `String[]` | — | Available simple size options (e.g. `["S", "M", "L"]`) |
| `colors` | `String[]` | — | Available simple color options |
| `stock` | `Int` | `@default(0)` | Stock count for non-variant product |
| `featured` | `Boolean` | `@default(false)` | Homepage featured display flag |
| `onSale` | `Boolean` | `@default(false)` | Sale flag |
| `salePrice` | `Float?` | Optional | Discounted sale price |
| `sku` | `String?` | `@unique`, Optional | Stock Keeping Unit |
| `weight` | `Float?` | Optional | Product weight in kg |
| `tags` | `String[]` | — | Search and filter tags |
| `metaTitle` | `String?` | Optional | SEO title tag |
| `metaDescription` | `String?` | Optional | SEO meta description |
| `isActive` | `Boolean` | `@default(true)` | Product visibility toggle |
| `hasVariants` | `Boolean` | `@default(false)` | Flag indicating if product uses `ProductVariant` records |
| `attributes` | `Json?` | Optional | JSON configuration of product attributes |
| `createdAt` | `DateTime` | `@default(now())` | Record creation timestamp |
| `updatedAt` | `DateTime` | `@updatedAt` | Last record modification timestamp |

#### Foreign Keys & Relationships
- `variants`: `ProductVariant[]` — 1-to-Many relation with `ProductVariant` (Cascade delete).
- `orderItems`: `OrderItem[]` — 1-to-Many relation with `OrderItem` (Restrict delete).
- `reviews`: `Review[]` — 1-to-Many relation with `Review` (Cascade delete).
- `cartItems`: `CartItem[]` — 1-to-Many relation with `CartItem`.
- `wishlist`: `Wishlist[]` — 1-to-Many relation with `Wishlist` (Cascade delete).
- `waitlistSubscriptions`: `WaitlistSubscription[]` — 1-to-Many relation (Cascade delete).
- `restockSchedules`: `RestockSchedule[]` — 1-to-Many relation (Cascade delete).

#### Database Indexes
- `@@index([category])`
- `@@index([featured])`
- `@@index([isActive])`
- `@@index([onSale])`

---

### 2. `ProductVariant`
Represents specific product variation combinations (e.g. Size L in Black) with independent SKU, pricing, image, and stock management.

- **Table Name**: `ProductVariant`
- **Primary Key**: `id` (`String`, `cuid()`)

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id`, `@default(cuid())` | Unique variant identifier |
| `productId` | `String` | Foreign Key | References `Product.id` |
| `sku` | `String` | `@unique` | Variant SKU |
| `price` | `Float?` | Optional | Price override if different from parent product |
| `salePrice` | `Float?` | Optional | Sale price override |
| `stock` | `Int` | `@default(0)` | Variant-specific stock level |
| `images` | `String[]` | — | Variant-specific image URLs |
| `attributes` | `Json` | — | Key-value pairs (e.g., `{"color": "red", "size": "L"}`) |
| `isActive` | `Boolean` | `@default(true)` | Active status flag |
| `createdAt` | `DateTime` | `@default(now())` | Record creation timestamp |
| `updatedAt` | `DateTime` | `@updatedAt` | Last update timestamp |

#### Foreign Keys & Relationships
- `product`: `Product` — Belongs to `Product` via `productId` (`onDelete: Cascade`).
- `waitlistSubscriptions`: `WaitlistSubscription[]` — 1-to-Many relation with `WaitlistSubscription` (`onDelete: Cascade`).
- `restockSchedules`: `RestockSchedule[]` — 1-to-Many relation with `RestockSchedule` (`onDelete: Cascade`).

#### Database Indexes
- `@@index([productId])`
- `@@index([sku])`
- `@@index([isActive])`

---

### 3. `User`
Stores customer and administrator account credentials, personal profile details, default shipping address, and security permissions.

- **Table Name**: `User`
- **Primary Key**: `id` (`String`, `cuid()`)

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id`, `@default(cuid())` | Unique user identifier |
| `email` | `String` | `@unique` | User login email address |
| `name` | `String` | — | Full display name |
| `firstName` | `String?` | Optional | First name |
| `lastName` | `String?` | Optional | Last name |
| `password` | `String` | — | Hashed password |
| `phone` | `String?` | Optional | Contact phone number |
| `address` | `String?` | Optional | Default street address |
| `city` | `String?` | Optional | Default city |
| `postalCode` | `String?` | Optional | Default postal code |
| `country` | `String` | `@default("Germany")` | Default country |
| `isAdmin` | `Boolean` | `@default(false)` | Administrator privileges flag |
| `isActive` | `Boolean` | `@default(true)` | User account active status |
| `lastLogin` | `DateTime?` | Optional | Timestamp of last login |
| `createdAt` | `DateTime` | `@default(now())` | Account creation timestamp |
| `updatedAt` | `DateTime` | `@updatedAt` | Account modification timestamp |

#### Foreign Keys & Relationships
- `orders`: `Order[]` — 1-to-Many relation with `Order`.
- `wishlist`: `Wishlist[]` — 1-to-Many relation with `Wishlist`.
- `reviews`: `Review[]` — 1-to-Many relation with `Review`.
- `cart`: `Cart?` — 1-to-1 relation with `Cart`.
- `waitlistSubscriptions`: `WaitlistSubscription[]` — 1-to-Many relation with `WaitlistSubscription`.

---

### 4. `Order`
Stores financial transactions, shipping details, payment metadata, coupons applied, and backorder tracking status.

- **Table Name**: `Order`
- **Primary Key**: `id` (`String`, `cuid()`)

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id`, `@default(cuid())` | Unique order identifier |
| `userId` | `String` | Foreign Key | References `User.id` |
| `status` | `OrderStatus` | `@default(PENDING)` | Order lifecycle enum status |
| `totalAmount` | `Float` | — | Grand total of order in EUR |
| `currency` | `String` | `@default("EUR")` | Currency code |
| `paymentMethod` | `String` | `@default("cod")` | Payment method (`"cod"`, `"paypal"`, `"googlepay"`) |
| `paypalOrderId` | `String?` | Optional | External PayPal transaction/order ID |
| `paypalPayerId` | `String?` | Optional | External PayPal payer identifier |
| `shippingAddress` | `String` | — | Delivery street address |
| `shippingCity` | `String` | — | Delivery city |
| `shippingPostal` | `String` | — | Delivery postal code |
| `couponCode` | `String?` | Optional | Applied promo code |
| `discountAmount` | `Float` | `@default(0)` | Discount amount deducted |
| `orderType` | `String` | `@default("standard")` | Order fulfillment type (`"standard"`, `"backorder"`, `"preorder"`) |
| `expectedFulfillmentDate` | `DateTime?` | Optional | Estimated dispatch date for backorders |
| `backorderPriority` | `Int?` | Optional | Priority queue index for backordered items |
| `createdAt` | `DateTime` | `@default(now())` | Order placement timestamp |
| `updatedAt` | `DateTime` | `@updatedAt` | Last modification timestamp |

#### Foreign Keys & Relationships
- `user`: `User` — Belongs to `User` via `userId`.
- `items`: `OrderItem[]` — 1-to-Many relation with `OrderItem` (`onDelete: Cascade`).

#### Database Indexes
- `@@index([userId])`
- `@@index([status])`
- `@@index([orderType])`
- `@@index([expectedFulfillmentDate])`

---

### 5. `OrderItem`
Line items contained within an order, locking in the price, selected variation, and quantity at time of purchase.

- **Table Name**: `OrderItem`
- **Primary Key**: `id` (`String`, `cuid()`)

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id`, `@default(cuid())` | Unique line item ID |
| `orderId` | `String` | Foreign Key | References `Order.id` |
| `productId` | `String` | Foreign Key | References `Product.id` |
| `variantId` | `String?` | Foreign Key, Optional | References `ProductVariant.id` |
| `quantity` | `Int` | — | Item count purchased |
| `size` | `String` | — | Chosen size at checkout |
| `color` | `String?` | Optional | Chosen color at checkout |
| `price` | `Float` | — | Purchased price per unit |

#### Foreign Keys & Relationships
- `order`: `Order` — Belongs to `Order` via `orderId` (`onDelete: Cascade`).
- `product`: `Product` — References `Product` via `productId` (`onDelete: Restrict`).

#### Database Indexes
- `@@index([orderId])`
- `@@index([productId])`
- `@@index([variantId])`

---

### 6. `Cart`
Persistent shopping cart container for an authenticated user.

- **Table Name**: `Cart`
- **Primary Key**: `id` (`String`, `cuid()`)

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id`, `@default(cuid())` | Unique cart ID |
| `userId` | `String` | Foreign Key, `@unique` | References `User.id` (1-to-1) |
| `createdAt` | `DateTime` | `@default(now())` | Cart creation timestamp |
| `updatedAt` | `DateTime` | `@updatedAt` | Cart update timestamp |

#### Foreign Keys & Relationships
- `user`: `User` — Belongs to `User` via `userId` (`onDelete: Cascade`).
- `items`: `CartItem[]` — 1-to-Many relation with `CartItem` (`onDelete: Cascade`).

---

### 7. `CartItem`
Individual item added to a user's active shopping cart.

- **Table Name**: `CartItem`
- **Primary Key**: `id` (`String`, `cuid()`)

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id`, `@default(cuid())` | Unique cart item ID |
| `cartId` | `String` | Foreign Key | References `Cart.id` |
| `productId` | `String` | Foreign Key | References `Product.id` |
| `variantId` | `String?` | Foreign Key, Optional | References `ProductVariant.id` |
| `quantity` | `Int` | — | Selected quantity |
| `size` | `String` | — | Selected size |
| `color` | `String?` | Optional | Selected color |
| `createdAt` | `DateTime` | `@default(now())` | Added timestamp |

#### Foreign Keys & Relationships
- `cart`: `Cart` — Belongs to `Cart` via `cartId` (`onDelete: Cascade`).
- `product`: `Product` — References `Product` via `productId`.

#### Unique & Indexes
- `@@unique([cartId, productId, variantId, size, color])`
- `@@index([cartId])`
- `@@index([variantId])`

---

### 8. `Wishlist`
Stores user-saved favorite products for easy retrieval.

- **Table Name**: `Wishlist`
- **Primary Key**: `id` (`String`, `cuid()`)

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id`, `@default(cuid())` | Unique wishlist record ID |
| `userId` | `String` | Foreign Key | References `User.id` |
| `productId` | `String` | Foreign Key | References `Product.id` |
| `createdAt` | `DateTime` | `@default(now())` | Time item was added to wishlist |

#### Foreign Keys & Relationships
- `user`: `User` — Belongs to `User` via `userId` (`onDelete: Cascade`).
- `product`: `Product` — References `Product` via `productId` (`onDelete: Cascade`).

#### Unique & Indexes
- `@@unique([userId, productId])`
- `@@index([userId])`

---

### 9. `Review`
Customer ratings, written reviews, and verified purchase status for products.

- **Table Name**: `Review`
- **Primary Key**: `id` (`String`, `cuid()`)

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id`, `@default(cuid())` | Unique review ID |
| `userId` | `String` | Foreign Key | References `User.id` |
| `productId` | `String` | Foreign Key | References `Product.id` |
| `rating` | `Int` | — | Numerical rating score (1–5 stars) |
| `title` | `String?` | Optional | Review header title |
| `comment` | `String?` | `@db.Text`, Optional | Detailed review text |
| `isVerified` | `Boolean` | `@default(false)` | Verified purchase badge |
| `createdAt` | `DateTime` | `@default(now())` | Submission timestamp |
| `updatedAt` | `DateTime` | `@updatedAt` | Modification timestamp |

#### Foreign Keys & Relationships
- `user`: `User` — Belongs to `User` via `userId` (`onDelete: Cascade`).
- `product`: `Product` — References `Product` via `productId` (`onDelete: Cascade`).

#### Unique & Indexes
- `@@unique([userId, productId])`
- `@@index([productId])`
- `@@index([rating])`

---

### 10. `Category`
Product category taxonomy supporting bilingual names, custom slugs, and sort orders.

- **Table Name**: `Category`
- **Primary Key**: `id` (`String`, `cuid()`)

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id`, `@default(cuid())` | Unique category ID |
| `name` | `String` | — | German category name |
| `nameEn` | `String` | — | English category name |
| `slug` | `String` | `@unique` | URL-safe slug (e.g. `herrenkleidung`) |
| `description` | `String?` | Optional | Category description |
| `image` | `String?` | Optional | Category banner/cover image URL |
| `isActive` | `Boolean` | `@default(true)` | Category active state |
| `sortOrder` | `Int` | `@default(0)` | Integer for navigation display order |
| `createdAt` | `DateTime` | `@default(now())` | Record creation timestamp |
| `updatedAt` | `DateTime` | `@updatedAt` | Record update timestamp |

#### Indexes
- `@@index([isActive])`
- `@@index([sortOrder])`

---

### 11. `LegalContent`
Dynamic content management for mandatory legal pages (Imprint, Privacy Policy, Terms & Conditions).

- **Table Name**: `LegalContent`
- **Primary Key**: `id` (`String`) — Values: `"imprint"`, `"privacy"`, `"terms"`

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id` | Document key identifier (`"imprint"`, `"privacy"`, `"terms"`) |
| `contentDe` | `String` | `@db.Text` | Full legal text content in German |
| `contentEn` | `String` | `@db.Text` | Full legal text content in English |
| `updatedAt` | `DateTime` | `@updatedAt` | Last edit timestamp |

---

### 12. `SiteSettings`
Global configuration settings for store metadata, shipping costs, tax rates, contact information, and homepage announcements.

- **Table Name**: `SiteSettings`
- **Primary Key**: `id` (`String`, `@default("default")`)

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id`, `@default("default")` | Singleton settings ID |
| `storeName` | `String` | `@default("Attireburg")` | Business display name |
| `storeDescription` | `String` | `@default(...)` | German store description |
| `storeDescriptionEn` | `String` | `@default(...)` | English store description |
| `storeEmail` | `String` | `@default("info@attireburg.de")` | Main contact email |
| `storePhone` | `String` | `@default("+49 30 12345678")` | Main contact telephone |
| `storeAddress` | `String` | `@default("Musterstraße 123")` | Store physical address |
| `storeCity` | `String` | `@default("Berlin")` | Store city |
| `storePostalCode` | `String` | `@default("10115")` | Store postal code |
| `heroTitleDe` | `String` | `@default("Premium Deutsche Kleidung")` | Hero title (German) |
| `heroTitleEn` | `String` | `@default("Premium German Clothing")` | Hero title (English) |
| `heroSubtitleDe` | `String` | `@default("Neue Kollektion 2026")` | Hero subtitle (German) |
| `heroSubtitleEn` | `String` | `@default("New Collection 2026")` | Hero subtitle (English) |
| `logoUrl` | `String?` | Optional | Logo image asset URL |
| `freeShippingThreshold` | `Float` | `@default(50)` | Euro threshold for free shipping |
| `standardShippingCost` | `Float` | `@default(4.99)` | Default shipping fee (€) |
| `taxRate` | `Float` | `@default(19)` | Value Added Tax percentage (e.g. 19%) |
| `orderNotifications` | `Boolean` | `@default(true)` | Email alerts flag for new orders |
| `lowStockAlerts` | `Boolean` | `@default(true)` | Email alerts flag for low stock |
| `announcementDe` | `String` | `@default(...)` | Announcement ticker content (German) |
| `announcementEn` | `String` | `@default(...)` | Announcement ticker content (English) |
| `updatedAt` | `DateTime` | `@updatedAt` | Settings update timestamp |

---

### 13. `Newsletter`
Stores newsletter subscriber email registrations.

- **Table Name**: `Newsletter`
- **Primary Key**: `id` (`String`, `cuid()`)

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id`, `@default(cuid())` | Unique subscriber record ID |
| `email` | `String` | `@unique` | Subscriber email address |
| `isActive` | `Boolean` | `@default(true)` | Subscription active toggle |
| `createdAt` | `DateTime` | `@default(now())` | Registration timestamp |

---

### 14. `Coupon`
Promotional discount codes, application rules, usage limits, and expiration tracking.

- **Table Name**: `Coupon`
- **Primary Key**: `id` (`String`, `cuid()`)

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id`, `@default(cuid())` | Unique coupon ID |
| `code` | `String` | `@unique` | Uppercase coupon code |
| `description` | `String?` | Optional | Internal note or description |
| `discountType` | `String` | `@default("percentage")` | Discount type (`"percentage"` or `"fixed"`) |
| `discountValue` | `Float` | — | Percentage value (e.g. 15) or Euro amount |
| `minOrderAmount` | `Float?` | Optional | Minimum subtotal order threshold (€) |
| `maxUses` | `Int?` | Optional | Max redemption usage cap |
| `usedCount` | `Int` | `@default(0)` | Current usage count |
| `isActive` | `Boolean` | `@default(true)` | Active status flag |
| `expiresAt` | `DateTime?` | Optional | Coupon expiry date |
| `createdAt` | `DateTime` | `@default(now())` | Creation date |
| `updatedAt` | `DateTime` | `@updatedAt` | Last modified date |

#### Indexes
- `@@index([code])`
- `@@index([isActive])`

---

### 15. `ContactMessage`
Inquiries submitted via the store contact form.

- **Table Name**: `ContactMessage`
- **Primary Key**: `id` (`String`, `cuid()`)

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id`, `@default(cuid())` | Unique message ID |
| `name` | `String` | — | Sender full name |
| `email` | `String` | — | Sender email address |
| `subject` | `String` | — | Subject header |
| `message` | `String` | `@db.Text` | Inquiry body content |
| `isRead` | `Boolean` | `@default(false)` | Read status flag for admin dashboard |
| `createdAt` | `DateTime` | `@default(now())` | Submission timestamp |

#### Indexes
- `@@index([isRead])`
- `@@index([createdAt])`

---

### 16. `WaitlistSubscription`
Manages backorder and restock alert subscriptions for out-of-stock products or specific variants.

- **Table Name**: `WaitlistSubscription`
- **Primary Key**: `id` (`String`, `cuid()`)

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id`, `@default(cuid())` | Unique subscription ID |
| `email` | `String` | — | Subscriber email address |
| `productId` | `String` | Foreign Key | References `Product.id` |
| `variantId` | `String?` | Foreign Key, Optional | References `ProductVariant.id` |
| `userId` | `String?` | Foreign Key, Optional | References `User.id` |
| `isActive` | `Boolean` | `@default(true)` | Subscription status |
| `createdAt` | `DateTime` | `@default(now())` | Subscription creation timestamp |
| `updatedAt` | `DateTime` | `@updatedAt` | Record update timestamp |

#### Foreign Keys & Relationships
- `product`: `Product` — Belongs to `Product` (`onDelete: Cascade`).
- `variant`: `ProductVariant` — References `ProductVariant` (`onDelete: Cascade`).
- `user`: `User` — Optional link to registered `User` (`onDelete: Cascade`).
- `notifications`: `RestockNotification[]` — 1-to-Many relation with `RestockNotification`.

#### Unique & Indexes
- `@@unique([email, productId, variantId])`
- `@@index([productId])`
- `@@index([variantId])`
- `@@index([userId])`
- `@@index([isActive])`

---

### 17. `RestockNotification`
Tracks email alerts dispatched to waitlisted customers and records marketing metrics (opens, clicks, purchases).

- **Table Name**: `RestockNotification`
- **Primary Key**: `id` (`String`, `cuid()`)

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id`, `@default(cuid())` | Unique notification ID |
| `waitlistSubscriptionId` | `String` | Foreign Key | References `WaitlistSubscription.id` |
| `sentAt` | `DateTime` | `@default(now())` | Email dispatch timestamp |
| `emailOpened` | `Boolean` | `@default(false)` | Flag indicating email was opened |
| `linkClicked` | `Boolean` | `@default(false)` | Flag indicating product link was clicked |
| `purchaseCompleted` | `Boolean` | `@default(false)` | Flag indicating resultant sale conversion |

#### Foreign Keys & Relationships
- `waitlistSubscription`: `WaitlistSubscription` — References parent subscription (`onDelete: Cascade`).

#### Indexes
- `@@index([waitlistSubscriptionId])`
- `@@index([sentAt])`

---

### 18. `RestockSchedule`
Tracks estimated inventory restock arrival dates and vendor notes for backordered products.

- **Table Name**: `RestockSchedule`
- **Primary Key**: `id` (`String`, `cuid()`)

| Field | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `String` | `@id`, `@default(cuid())` | Unique restock schedule ID |
| `productId` | `String` | Foreign Key | References `Product.id` |
| `variantId` | `String?` | Foreign Key, Optional | References `ProductVariant.id` |
| `expectedDate` | `DateTime?` | Optional | Estimated arrival date of new inventory |
| `actualDate` | `DateTime?` | Optional | Actual recorded arrival date |
| `notes` | `String?` | `@db.Text`, Optional | Internal supplier notes |
| `createdAt` | `DateTime` | `@default(now())` | Record creation timestamp |
| `updatedAt` | `DateTime` | `@updatedAt` | Record update timestamp |

#### Foreign Keys & Relationships
- `product`: `Product` — Belongs to `Product` (`onDelete: Cascade`).
- `variant`: `ProductVariant` — References `ProductVariant` (`onDelete: Cascade`).

#### Unique & Indexes
- `@@unique([productId, variantId])`
- `@@index([productId])`
- `@@index([variantId])`
- `@@index([expectedDate])`
