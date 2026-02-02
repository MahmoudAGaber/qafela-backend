import * as fs from 'fs/promises';
import * as path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { QafalaTemplate } from '../schedule/schedule.model';

dotenv.config();

const ASSETS_DIR = path.join(process.cwd(), 'assets');
const QAFALA_DIR = path.join(ASSETS_DIR, 'Qafala');

async function connectDatabase() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/qafela';
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`🟢 MongoDB connected at ${MONGO_URI}`);
  } catch (error: any) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
}

async function seedQafalas() {
  try {
    console.log('🌱 Seeding Qafala templates...');
    
    // Get all PNG files in Qafala folder
    const files = await fs.readdir(QAFALA_DIR);
    const pngFiles = files.filter(f => f.toLowerCase().endsWith('.png')).sort();
    
    console.log(`Found ${pngFiles.length} Qafala images`);
    
    // Map files to Qafala types (4 images: morning, afternoon, night, random)
    const qafalaTypes: Array<{ type: 'morning' | 'afternoon' | 'night' | 'random', name: string, imageFile: string, startHour?: number, endHour?: number }> = [
      { type: 'morning', name: 'Morning Qafala', imageFile: pngFiles[0] || '', startHour: 8, endHour: 11 },
      { type: 'afternoon', name: 'Afternoon Qafala', imageFile: pngFiles[1] || '', startHour: 12, endHour: 15 },
      { type: 'night', name: 'Night Qafala', imageFile: pngFiles[2] || '', startHour: 19, endHour: 22 },
      { type: 'random', name: 'Random Qafala', imageFile: pngFiles[3] || '', startHour: 0, endHour: 24 },
    ];
    
    for (const qafala of qafalaTypes) {
      if (!qafala.imageFile) {
        console.warn(`⚠️  No image file for ${qafala.type}, skipping...`);
        continue;
      }
      
      const imageUrl = `/assets/Qafala/${qafala.imageFile}`;
      
      // Check if template already exists
      const existing = await QafalaTemplate.findOne({ type: qafala.type });
      
      if (existing) {
        // Update image if different
        if (existing.imageUrl !== imageUrl) {
          await QafalaTemplate.updateOne(
            { type: qafala.type },
            { $set: { imageUrl, name: qafala.name, startHour: qafala.startHour, endHour: qafala.endHour } }
          );
          console.log(`✓ Updated ${qafala.type} Qafala template (image: ${qafala.imageFile})`);
        } else {
          console.log(`○ ${qafala.type} Qafala template already exists with correct image`);
        }
      } else {
        // Create new template with empty items
        await QafalaTemplate.create({
          type: qafala.type,
          name: qafala.name,
          imageUrl,
          items: [],
          active: true,
          startHour: qafala.startHour,
          endHour: qafala.endHour,
          durationMinutes: qafala.type === 'night' ? 120 : 90,
        });
        console.log(`✓ Created ${qafala.type} Qafala template (image: ${qafala.imageFile})`);
      }
    }
    
    console.log('✅ Qafala templates seeded successfully!');
    console.log('📝 Note: Templates are created with empty items. Add items via the dashboard or API.');
  } catch (error: any) {
    console.error('❌ Error seeding Qafalas:', error);
    throw error;
  }
}

// Run if called directly
(async () => {
  try {
    await connectDatabase();
    await seedQafalas();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
})();

export { seedQafalas };

