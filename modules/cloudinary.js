// cloudinary.js
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const uniqid = require("uniqid");
require("dotenv").config();

//cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

//How to upload a file to cloudinary, see cloudinary documentation
const uploadFile = async (file) => {
  try {
    const image = await cloudinary.uploader.upload(file, {
      resource_type: "image",
      quality: "auto",
      fetch_format: "auto",
      folder: "Serenade",
    });
    return image;
  } catch (error) {
    return { message: "Error when uploading image" };
  }
};

// our custom function to upload pictures of our users to cloudinary
const uploadUserPictures = async (pictures) => {
  let userPicturesURLs = [];
  try {
    //We loop through the pictures array and move each to cloudinary
    // Because it's a loop and all those operations are asynchronous we use **await Promise.all** to wait until all the operations are complete
    await Promise.all(
      pictures.map(async (picture) => {
        //we move the picture to a tmp folder and give it a unique name
        // because this operation is also asynchonous we use async await here again
        const photoPath = `./tmp/${uniqid()}.jpg`;
        await picture.mv(photoPath);

        //we upload the picture to cloudinary through the uploadFile function declared above
        const cloudFiles = await uploadFile(photoPath);

        //we delete the photo from the tmp folder
        fs.unlinkSync(photoPath);

        //We push the cloudinary url to the pictures array every time we upload a picture
        userPicturesURLs.push(cloudFiles.secure_url);
      })
    );

    //if we have successfuly uploaded pictures, we return the array of cloudinary urls
    // otherwise we return false
    if (userPicturesURLs.length > 0) {
      return userPicturesURLs;
    } else {
      return false;
    }
  } catch (error) {
    console.log(error.message);
    return false;
  }
};

module.exports = { uploadUserPictures };
