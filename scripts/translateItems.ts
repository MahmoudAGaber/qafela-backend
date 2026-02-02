import 'dotenv/config';
import mongoose from 'mongoose';
import { Item } from '../src/modules/item/item.model';

/**
 * Simple translation function using a free translation API
 * You can replace this with Google Translate API or any other service
 */
async function translateText(text: string, targetLang: string = 'en', retries: number = 3): Promise<string> {
  if (!text || text.trim().length === 0) {
    return '';
  }

  // Option 1: Use Google Translate API (requires API key)
  // Uncomment and configure if you have Google Translate API key
  /*
  const { Translate } = require('@google-cloud/translate').v2;
  const translate = new Translate({ key: process.env.GOOGLE_TRANSLATE_API_KEY });
  const [translation] = await translate.translate(text, targetLang);
  return translation;
  */

  // Option 2: Use MyMemory Translation API (free, no API key needed for limited use)
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const encodedText = encodeURIComponent(text);
      const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=ar|en`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          if (data.responseData && data.responseData.translatedText) {
            return data.responseData.translatedText;
          }
        } else {
          // Got HTML instead of JSON, try next attempt
          if (attempt < retries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
            continue;
          }
        }
      }
    } catch (error: any) {
      if (attempt < retries) {
        console.warn(`⚠️  Translation attempt ${attempt} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      console.warn(`Translation API error for "${text.substring(0, 30)}...":`, error.message);
    }
  }

  // Option 3: Try LibreTranslate as fallback
  try {
    const response = await fetch('https://libretranslate.com/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: 'ar',
        target: 'en',
        format: 'text',
      }),
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.translatedText) {
          return data.translatedText;
        }
      }
    }
  } catch (error) {
    // Fall through to final fallback
  }

  // Final fallback - return original text with a note
  console.warn(`⚠️  Could not translate: "${text.substring(0, 50)}..." - using original text`);
  return text;
}

/**
 * Translate all items in the database
 * @param forceRetranslate - If true, will retranslate even if English versions exist
 */
async function translateItems(forceRetranslate: boolean = false) {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/qafela';
  
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all items
    const items = await Item.find({}).lean();
    console.log(`📦 Found ${items.length} items to process`);
    console.log(`🔄 Force retranslate: ${forceRetranslate ? 'YES' : 'NO (only missing translations)'}`);
    console.log('');

    let translated = 0;
    let skipped = 0;
    let errors = 0;

    for (const item of items) {
      try {
        const updates: any = {};
        let needsUpdate = false;

        // Always translate title if Arabic title exists
        if (item.title && item.title.trim().length > 0) {
          // Translate if forceRetranslate is true, or if titleEn is missing/empty/same as title
          const needsTitleTranslation = forceRetranslate || 
            !item.titleEn || 
            item.titleEn.trim().length === 0 || 
            item.titleEn === item.title;
            
          if (needsTitleTranslation) {
            console.log(`\n📝 [${item.key}] Translating title: "${item.title}"`);
            updates.titleEn = await translateText(item.title, 'en');
            needsUpdate = true;
            console.log(`   → "${updates.titleEn}"`);
          } else {
            console.log(`⏭️  [${item.key}] Title already translated: "${item.title}" → "${item.titleEn}"`);
          }
        } else {
          console.log(`⚠️  [${item.key}] No Arabic title found`);
        }

        // Always translate description if Arabic description exists
        if (item.description && item.description.trim().length > 0) {
          // Translate if forceRetranslate is true, or if descriptionEn is missing/empty/same as description
          const needsDescTranslation = forceRetranslate || 
            !item.descriptionEn || 
            item.descriptionEn.trim().length === 0 || 
            item.descriptionEn === item.description;
            
          if (needsDescTranslation) {
            const descPreview = item.description.length > 50 ? item.description.substring(0, 50) + '...' : item.description;
            console.log(`📝 [${item.key}] Translating description: "${descPreview}"`);
            updates.descriptionEn = await translateText(item.description, 'en');
            needsUpdate = true;
            const transPreview = updates.descriptionEn.length > 50 ? updates.descriptionEn.substring(0, 50) + '...' : updates.descriptionEn;
            console.log(`   → "${transPreview}"`);
          } else {
            console.log(`⏭️  [${item.key}] Description already translated`);
          }
        } else {
          console.log(`⚠️  [${item.key}] No Arabic description found`);
        }

        // Update item if there are changes
        if (needsUpdate) {
          await Item.updateOne(
            { _id: item._id },
            { $set: updates }
          );
          translated++;
          console.log(`✅ Updated item: ${item.key}`);
        } else {
          skipped++;
          console.log(`⏭️  Skipped item: ${item.key} (already has all translations)`);
        }

        // Add a delay to avoid rate limiting (longer delay for free APIs)
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        errors++;
        console.error(`❌ Error translating item ${item.key}:`, error.message);
      }
    }

    console.log('\n📊 Translation Summary:');
    console.log(`   ✅ Translated: ${translated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📦 Total: ${items.length}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the script
// Set to true to retranslate all items, even if they already have English translations
const FORCE_RETRANSLATE = process.argv.includes('--force') || process.argv.includes('-f');
translateItems(FORCE_RETRANSLATE).catch(console.error);

