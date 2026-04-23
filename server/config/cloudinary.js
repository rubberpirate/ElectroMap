const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = async (filePath, folder = 'electromap') => {
  if (!filePath) {
    return null;
  }

  const result = await cloudinary.uploader.upload(filePath, {
    folder,
    resource_type: 'image',
  });

  return result.secure_url;
};

const uploadBufferToCloudinary = (buffer, folder) => {
  if (!buffer) {
    return Promise.resolve(null);
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result.secure_url);
      },
    );

    stream.end(buffer);
  });
};

const deleteImage = async (publicId) => {
  if (!publicId) {
    return null;
  }

  return cloudinary.uploader.destroy(publicId, {
    resource_type: 'image',
  });
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
  uploadBufferToCloudinary,
};
