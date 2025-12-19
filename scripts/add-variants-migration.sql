-- Migration to add product variants support
-- Run this SQL script manually in your PostgreSQL database

-- Add new fields to Product table
ALTER TABLE "Product" 
ADD COLUMN "hasVariants" BOOLEAN DEFAULT false,
ADD COLUMN "attributes" JSONB;

-- Create ProductVariant table
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "salePrice" DOUBLE PRECISION,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "images" TEXT[],
    "attributes" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- Add unique constraint on SKU
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_sku_key" UNIQUE ("sku");

-- Add foreign key constraint
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");
CREATE INDEX "ProductVariant_sku_idx" ON "ProductVariant"("sku");
CREATE INDEX "ProductVariant_isActive_idx" ON "ProductVariant"("isActive");

-- Add variantId to OrderItem table
ALTER TABLE "OrderItem" 
ADD COLUMN "variantId" TEXT,
ADD COLUMN "color" TEXT;

-- Add index for variantId
CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem"("variantId");

-- Update CartItem table
ALTER TABLE "CartItem" 
ADD COLUMN "variantId" TEXT;

-- Drop the old unique constraint and create a new one
ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_cartId_productId_size_color_key";
ALTER TABLE "CartItem" ADD CONSTRAINT "CartItem_cartId_productId_variantId_size_color_key" UNIQUE ("cartId", "productId", "variantId", "size", "color");

-- Add index for variantId in CartItem
CREATE INDEX "CartItem_variantId_idx" ON "CartItem"("variantId");