require('dotenv').config();
const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');
const Event = require('../models/Event');
const FileResource = require('../models/FileResource');

const migrateContent = async () => {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is required');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const models = [Announcement, Event, FileResource];

    for (const Model of models) {
      console.log(`Migrating ${Model.modelName}...`);
      
      const documents = await Model.find({});
      let migratedCount = 0;

      for (const doc of documents) {
        let needsSave = false;

        // If it already has target_all set to true, it's fine.
        if (doc.target_all === undefined) {
          // Check if arrays are empty -> means "all" in old logic
          if (doc.target_year.length === 0 && doc.target_section.length === 0) {
            doc.target_all = true;
            needsSave = true;
          } else {
            doc.target_all = false;
            needsSave = true;
          }
        }

        // If target_all is true, ensure arrays are empty
        if (doc.target_all === true) {
          if (doc.target_year.length > 0 || doc.target_section.length > 0) {
            doc.target_year = [];
            doc.target_section = [];
            needsSave = true;
          }
        }

        if (needsSave) {
          await doc.save();
          migratedCount++;
        }
      }

      console.log(`Migrated ${migratedCount} documents in ${Model.modelName}.`);
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateContent();
