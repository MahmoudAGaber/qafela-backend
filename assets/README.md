# Assets Directory

This directory contains static assets and configuration files for the Qafela backend.

## items.json

The `items.json` file contains the master list of all items available in the game. Items defined here can be used when creating qafalas (drops).

### Structure

```json
{
  "items": [
    {
      "key": "unique_item_key",
      "title": "Arabic title",
      "titleEn": "English title",
      "description": "Arabic description",
      "descriptionEn": "English description",
      "rarity": "common | rare | epic | legendary | barter",
      "priceDinar": 10,
      "givesPoints": 5,
      "givesXp": 10,
      "requiredLevel": 1,
      "type": "item_type",
      "barter": false,
      "stock": 20,
      "maxPerUser": 5,
      "icon": "icon_name",
      "imageUrl": "optional_image_url",
      "visualId": "optional_visual_id"
    }
  ]
}
```

### Fields

- **key** (required): Unique identifier for the item
- **title** (required): Arabic title
- **titleEn** (optional): English title
- **description** (optional): Arabic description
- **descriptionEn** (optional): English description
- **rarity** (required): Item rarity level
- **priceDinar** (required): Price in dinars
- **givesPoints** (required): Points awarded when purchased
- **givesXp** (optional): XP awarded when purchased
- **requiredLevel** (optional): Minimum level required to purchase
- **type** (optional): Item type/category
- **barter** (required): Whether item is barter-only
- **stock** (optional): Default stock quantity
- **maxPerUser** (optional): Maximum quantity per user (null for unlimited)
- **icon** (optional): Icon identifier
- **imageUrl** (optional): Image URL
- **visualId** (optional): Visual identifier for UI

### Usage

Items from this file are:
1. Loaded by the admin API (`/api/admin/items`)
2. Used when creating/editing qafalas - items are referenced by key
3. Resolved when generating drops - item keys are looked up and full item data is populated

### Editing

Items can be edited through:
- The admin dashboard at `/items`
- Directly editing the JSON file (requires server restart)
- Admin API endpoints (`/api/admin/items`)


