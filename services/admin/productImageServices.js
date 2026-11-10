const cloudinary = require('../../config/cloudinary');

const uploadProductImage = async (imageBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'buildapc/products',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );
    uploadStream.end(imageBuffer);
  });
};
module.exports = {
  uploadProductImage,
};
