-- Coupon table migration
-- Run this in your Supabase SQL editor: https://app.supabase.com → SQL Editor

CREATE TABLE IF NOT EXISTS "Coupon" (
  "id"              TEXT NOT NULL,
  "code"            TEXT NOT NULL,
  "description"     TEXT,
  "discountType"    TEXT NOT NULL DEFAULT 'percentage',
  "discountValue"   DOUBLE PRECISION NOT NULL,
  "minOrderAmount"  DOUBLE PRECISION,
  "maxUses"         INTEGER,
  "usedCount"       INTEGER NOT NULL DEFAULT 0,
  "isActive"        BOOLEAN NOT NULL DEFAULT true,
  "expiresAt"       TIMESTAMP(3),
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Coupon_code_key" ON "Coupon"("code");
CREATE INDEX IF NOT EXISTS "Coupon_code_idx" ON "Coupon"("code");
CREATE INDEX IF NOT EXISTS "Coupon_isActive_idx" ON "Coupon"("isActive");
