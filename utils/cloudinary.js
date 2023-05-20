// cloudinary.js
const dotenv = require("dotenv");
const cloudinary = require("cloudinary").v2;

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadPictures = async (file) => {
  const image = await cloudinary.uploader.upload(
    file,
    { folder: "Seranade" },
    (result) => result
  );
  return image;
};

module.exports = { uploadPictures };
