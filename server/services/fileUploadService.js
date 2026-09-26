const cloudinary = require('cloudinary').v2;
const { createClient } = require('@supabase/supabase-js');
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'mock_cloud',
  api_key: process.env.CLOUDINARY_API_KEY || 'mock_key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'mock_secret'
});

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://mock.supabase.co',
  process.env.SUPABASE_KEY || 'mock_key'
);

const uploadToCloudinary = (fileBuffer, resourceType) => {
  return new Promise((resolve, reject) => {
    // If mocking without real keys, just return a fake URL
    if (process.env.CLOUDINARY_API_KEY === 'mock_key') {
      return resolve({ secure_url: 'https://mock-cloudinary.com/fake-image.jpg' });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

const uploadToSupabase = async (file, fileName) => {
  if (process.env.SUPABASE_KEY === 'mock_key') {
    return { publicUrl: 'https://mock-supabase.com/storage/v1/object/public/fake-doc.pdf' };
  }

  const { data, error } = await supabase.storage
    .from('csehub-docs')
    .upload(`announcements/${Date.now()}_${fileName}`, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('csehub-docs')
    .getPublicUrl(data.path);
    
  return { publicUrl };
};

const uploadFile = async (file) => {
  if (!file) return null;

  const mimeType = file.mimetype;

  if (mimeType.startsWith('image/') || mimeType.startsWith('video/')) {
    const resourceType = mimeType.startsWith('video/') ? 'video' : 'image';
    const result = await uploadToCloudinary(file.buffer, resourceType);
    return result.secure_url;
  } else {
    // Treat everything else (PDFs, docs) as Supabase upload
    const result = await uploadToSupabase(file, file.originalname);
    return result.publicUrl;
  }
};

const deleteFile = async (fileUrl) => {
  if (!fileUrl) return;
  
  // Mock deletion
  if (process.env.CLOUDINARY_API_KEY === 'mock_key' || process.env.SUPABASE_KEY === 'mock_key') {
    console.log(`[MOCK DELETE] Removed file from storage: ${fileUrl}`);
    return;
  }
  
  console.log(`[STORAGE DELETE] Would delete real file: ${fileUrl}`);
  // In a real implementation, parse the public ID from the URL and call cloudinary.uploader.destroy or supabase.storage.remove
};

module.exports = { uploadFile, deleteFile };
