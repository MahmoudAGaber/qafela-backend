# Translate Items Script

This script translates all item titles and descriptions from Arabic to English in the database.

## Usage

```bash
npm run translate:items
```

Or directly:

```bash
ts-node-dev --transpile-only scripts/translateItems.ts
```

## What it does

1. Connects to MongoDB using `MONGO_URI` from `.env`
2. Fetches all items from the database
3. For each item:
   - Translates `title` (Arabic) → `titleEn` (English) if `titleEn` is missing
   - Translates `description` (Arabic) → `descriptionEn` (English) if `descriptionEn` is missing
4. Updates items in the database with translations
5. Skips items that already have translations

## Translation Service

The script uses **LibreTranslate** (free public API) by default:
- Public instance: `https://libretranslate.de/translate`
- No API key required
- Rate limited (adds 500ms delay between requests)

## Alternative Translation Services

### Option 1: Google Translate API

1. Install the package:
```bash
npm install @google-cloud/translate
```

2. Get a Google Cloud API key and add to `.env`:
```
GOOGLE_TRANSLATE_API_KEY=your_api_key_here
```

3. Uncomment the Google Translate code in `translateItems.ts` and comment out the LibreTranslate code.

### Option 2: Other Translation APIs

You can modify the `translateText` function to use any translation service:
- DeepL API
- Microsoft Translator
- AWS Translate
- Custom translation service

## Environment Variables

- `MONGO_URI` - MongoDB connection string (default: `mongodb://127.0.0.1:27017/qafela`)
- `GOOGLE_TRANSLATE_API_KEY` - (Optional) Google Translate API key if using Google Translate

## Notes

- The script only translates items that are missing English translations
- Items with existing `titleEn` or `descriptionEn` are skipped
- Adds a 500ms delay between translations to avoid rate limiting
- Shows progress for each item being translated

