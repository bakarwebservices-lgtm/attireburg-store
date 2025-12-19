-- Migration script for backorder system
-- Add backorder fields to Order table
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "orderType" TEXT DEFAULT 'standard';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "expectedFulfillmentDate" TIMESTAMP;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "backorderPriority" INTEGER;

-- Create indexes for new Order fields
CREATE INDEX IF NOT EXISTS "Order_orderType_idx" ON "Order"("orderType");
CREATE INDEX IF NOT EXISTS "Order_expectedFulfillmentDate_idx" ON "Order"("expectedFulfillmentDate");

-- Create WaitlistSubscription table
CREATE TABLE IF NOT EXISTS "WaitlistSubscription" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "userId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistSubscription_pkey" PRIMARY KEY ("id")
);

-- Create RestockNotification table
CREATE TABLE IF NOT EXISTS "RestockNotification" (
    "id" TEXT NOT NULL,
    "waitlistSubscriptionId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailOpened" BOOLEAN NOT NULL DEFAULT false,
    "linkClicked" BOOLEAN NOT NULL DEFAULT false,
    "purchaseCompleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RestockNotification_pkey" PRIMARY KEY ("id")
);

-- Create RestockSchedule table
CREATE TABLE IF NOT EXISTS "RestockSchedule" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "expectedDate" TIMESTAMP(3),
    "actualDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RestockSchedule_pkey" PRIMARY KEY ("id")
);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "WaitlistSubscription_email_productId_variantId_key" ON "WaitlistSubscription"("email", "productId", "variantId");
CREATE UNIQUE INDEX IF NOT EXISTS "RestockSchedule_productId_variantId_key" ON "RestockSchedule"("productId", "variantId");

-- Create indexes
CREATE INDEX IF NOT EXISTS "WaitlistSubscription_productId_idx" ON "WaitlistSubscription"("productId");
CREATE INDEX IF NOT EXISTS "WaitlistSubscription_variantId_idx" ON "WaitlistSubscription"("variantId");
CREATE INDEX IF NOT EXISTS "WaitlistSubscription_userId_idx" ON "WaitlistSubscription"("userId");
CREATE INDEX IF NOT EXISTS "WaitlistSubscription_isActive_idx" ON "WaitlistSubscription"("isActive");

CREATE INDEX IF NOT EXISTS "RestockNotification_waitlistSubscriptionId_idx" ON "RestockNotification"("waitlistSubscriptionId");
CREATE INDEX IF NOT EXISTS "RestockNotification_sentAt_idx" ON "RestockNotification"("sentAt");

CREATE INDEX IF NOT EXISTS "RestockSchedule_productId_idx" ON "RestockSchedule"("productId");
CREATE INDEX IF NOT EXISTS "RestockSchedule_variantId_idx" ON "RestockSchedule"("variantId");
CREATE INDEX IF NOT EXISTS "RestockSchedule_expectedDate_idx" ON "RestockSchedule"("expectedDate");

-- Add foreign key constraints
ALTER TABLE "WaitlistSubscription" ADD CONSTRAINT IF NOT EXISTS "WaitlistSubscription_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WaitlistSubscription" ADD CONSTRAINT IF NOT EXISTS "WaitlistSubscription_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WaitlistSubscription" ADD CONSTRAINT IF NOT EXISTS "WaitlistSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RestockNotification" ADD CONSTRAINT IF NOT EXISTS "RestockNotification_waitlistSubscriptionId_fkey" FOREIGN KEY ("waitlistSubscriptionId") REFERENCES "WaitlistSubscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RestockSchedule" ADD CONSTRAINT IF NOT EXISTS "RestockSchedule_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RestockSchedule" ADD CONSTRAINT IF NOT EXISTS "RestockSchedule_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;