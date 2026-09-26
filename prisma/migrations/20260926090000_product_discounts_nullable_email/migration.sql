-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "discountType" TEXT,
    "discountPercent" REAL,
    "discountValueCents" INTEGER,
    "effectivePriceCents" INTEGER NOT NULL DEFAULT 0,
    "categoryId" TEXT NOT NULL,
    "collectionId" TEXT,
    "materials" TEXT NOT NULL,
    "finish" TEXT,
    "widthCm" INTEGER,
    "depthCm" INTEGER,
    "heightCm" INTEGER,
    "dimensionNote" TEXT,
    "careInstructions" TEXT,
    "availability" TEXT NOT NULL DEFAULT 'IN_STOCK',
    "sku" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Product_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Product" ("availability", "careInstructions", "categoryId", "collectionId", "createdAt", "currency", "depthCm", "description", "dimensionNote", "featured", "finish", "heightCm", "id", "materials", "name", "priceCents", "publishedAt", "sku", "slug", "status", "summary", "updatedAt", "widthCm") SELECT "availability", "careInstructions", "categoryId", "collectionId", "createdAt", "currency", "depthCm", "description", "dimensionNote", "featured", "finish", "heightCm", "id", "materials", "name", "priceCents", "publishedAt", "sku", "slug", "status", "summary", "updatedAt", "widthCm" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE INDEX "Product_status_featured_idx" ON "Product"("status", "featured");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_collectionId_idx" ON "Product"("collectionId");
CREATE INDEX "Product_priceCents_idx" ON "Product"("priceCents");
CREATE INDEX "Product_effectivePriceCents_idx" ON "Product"("effectivePriceCents");
CREATE TABLE "new_SiteSettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "storeName" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "footerBlurb" TEXT NOT NULL,
    "heroHeadline" TEXT NOT NULL,
    "heroSubhead" TEXT NOT NULL,
    "heroImageUrl" TEXT,
    "heroImageAlt" TEXT,
    "storyHeading" TEXT NOT NULL,
    "storyBody" TEXT NOT NULL,
    "storyImageUrl" TEXT,
    "storyImageAlt" TEXT,
    "visitHeading" TEXT NOT NULL,
    "visitBody" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "mapUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_SiteSettings" ("addressLine1", "addressLine2", "city", "country", "createdAt", "email", "footerBlurb", "heroHeadline", "heroImageAlt", "heroImageUrl", "heroSubhead", "id", "mapUrl", "phone", "postalCode", "region", "storeName", "storyBody", "storyHeading", "storyImageAlt", "storyImageUrl", "tagline", "updatedAt", "visitBody", "visitHeading") SELECT "addressLine1", "addressLine2", "city", "country", "createdAt", "email", "footerBlurb", "heroHeadline", "heroImageAlt", "heroImageUrl", "heroSubhead", "id", "mapUrl", "phone", "postalCode", "region", "storeName", "storyBody", "storyHeading", "storyImageAlt", "storyImageUrl", "tagline", "updatedAt", "visitBody", "visitHeading" FROM "SiteSettings";
DROP TABLE "SiteSettings";
ALTER TABLE "new_SiteSettings" RENAME TO "SiteSettings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

