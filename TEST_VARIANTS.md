# Testing Product Variants

## How to Test the Variants Feature

1. **Go to Admin Panel**: http://localhost:3002/admin/products
2. **Edit any existing product** or create a new one
3. **Go to "Eigenschaften" (Attributes) tab**
4. **Add attributes for variants**:
   - Click "Eigenschaft hinzufügen"
   - Name: "Farbe", Values: "Rot, Blau, Grün" ✓ Check "Für Varianten verwenden"
   - Click "Eigenschaft hinzufügen" again
   - Name: "Größe", Values: "S, M, L, XL" ✓ Check "Für Varianten verwenden"

5. **Generate Variants**:
   - Click "Varianten generieren" button in Attributes tab
   - OR go to "Varianten" tab and click "Alle Varianten generieren"

6. **Manage Individual Variants**:
   - Go to "Varianten" tab
   - Each variant (e.g., "Rot-S", "Rot-M", "Blau-L") has:
     - ✅ Individual SKU
     - ✅ Individual pricing (can override base price)
     - ✅ Individual stock levels (e.g., 5 red sweaters, 8 blue ones)
     - ✅ Individual images (upload different images for each color)

7. **Bulk Operations**:
   - Use "Alle Lagerbestände setzen" to set stock for all variants
   - Use "Alle Preise setzen" to set prices for all variants

## Expected Results

- ✅ Generate 12 variants (3 colors × 4 sizes)
- ✅ Each variant has unique SKU like "SWEATER-Farbe-Rot_Größe-S"
- ✅ Individual inventory management per variant
- ✅ Upload different images per variant (perfect for showing different colors)
- ✅ Visual inventory status (green/yellow/red based on stock)
- ✅ Save variants to database

## Features Implemented

### ✅ Individual Variant Management
- Each variant has its own stock level
- Each variant can have different pricing
- Each variant can have unique images
- Visual stock status indicators

### ✅ Bulk Management Tools
- Set all stock levels at once
- Set all prices at once
- Total inventory summary

### ✅ Enhanced UI
- Color-coded stock levels (red for low stock)
- Inventory status indicators
- Variant summary with total stock
- Better visual organization

The system now supports exactly what you requested - individual inventory for each variant combination!