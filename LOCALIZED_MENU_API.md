# Localized Menu API Implementation

## Overview
The menu form now supports localized fields for both English and Thai languages. The API should handle the following localized fields:

## Database Schema Updates
The menu items should have the following fields:

```sql
-- New localized fields
name_en VARCHAR(255) NOT NULL,
name_th VARCHAR(255) NOT NULL,
description_en TEXT,
description_th TEXT,
category_en VARCHAR(100) NOT NULL,
category_th VARCHAR(100) NOT NULL,

-- Legacy fields for backward compatibility
name VARCHAR(255), -- Can be deprecated later
description TEXT, -- Can be deprecated later
category VARCHAR(100), -- Can be deprecated later
```

## API Request Structure

### Create Menu Item (POST /admin/menu)
```json
{
  "name_en": "Americano Coffee",
  "name_th": "กาแฟอเมริกาโน่",
  "description_en": "Rich and bold coffee with hot water",
  "description_th": "กาแฟเข้มข้นผสมน้ำร้อน",
  "category_en": "Coffee",
  "category_th": "กาแฟ",
  "base_price": 65.00,
  "image_url": "https://example.com/americano.jpg",
  "active": true,
  "customizations": {
    "sizes": ["Small", "Medium", "Large"],
    "milk": ["Regular", "Oat", "Almond"]
  }
}
```

### Update Menu Item (PUT /admin/menu/{id})
```json
{
  "name_en": "Americano Coffee",
  "name_th": "กาแฟอเมริกาโน่",
  "description_en": "Rich and bold coffee with hot water - Updated",
  "description_th": "กาแฟเข้มข้นผสมน้ำร้อน - อัปเดตแล้ว",
  "category_en": "Coffee",
  "category_th": "กาแฟ",
  "base_price": 70.00,
  "image_url": "https://example.com/americano-new.jpg",
  "active": true,
  "customizations": {
    "sizes": ["Small", "Medium", "Large"],
    "milk": ["Regular", "Oat", "Almond", "Soy"]
  }
}
```

## API Response Structure

### Get Menu Items (GET /admin/menu)
```json
[
  {
    "id": "1",
    "name_en": "Americano Coffee",
    "name_th": "กาแฟอเมริกาโน่",
    "description_en": "Rich and bold coffee with hot water",
    "description_th": "กาแฟเข้มข้นผสมน้ำร้อน",
    "category_en": "Coffee",
    "category_th": "กาแฟ",
    "base_price": 65.00,
    "image_url": "https://example.com/americano.jpg",
    "active": true,
    "customizations": {
      "sizes": ["Small", "Medium", "Large"],
      "milk": ["Regular", "Oat", "Almond"]
    },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z",
    // Legacy fields for backward compatibility
    "name": "Americano Coffee",
    "description": "Rich and bold coffee with hot water",
    "category": "Coffee"
  }
]
```

## Frontend Implementation Details

### Form Fields
The form now includes:
- **Name (English)** - Required field for English name
- **Name (Thai)** - Required field for Thai name  
- **Description (English)** - Optional field for English description
- **Description (Thai)** - Optional field for Thai description
- **Category (English)** - Required field for English category
- **Category (Thai)** - Required field for Thai category
- **Base Price** - Required numeric field
- **Image** - Optional image URL or file upload
- **Availability** - Active/Inactive status
- **Customizations** - Dynamic key-value options

### Display Logic
- The frontend automatically displays the appropriate language based on the user's language setting
- English fields are shown when language is set to 'en'
- Thai fields are shown when language is set to 'th'
- Falls back to legacy fields if localized fields are not available

### Backward Compatibility
- The system maintains backward compatibility with existing menu items
- If localized fields are not available, it falls back to the legacy `name`, `description`, and `category` fields
- New menu items will always include both English and Thai values

## Migration Strategy
1. Update database schema to include localized fields
2. Create migration script to populate localized fields from existing data
3. Update API endpoints to handle localized fields
4. Test with frontend implementation
5. Gradually phase out legacy fields once all data is migrated