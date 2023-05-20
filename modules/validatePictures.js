// Here is a types of files that we accept
const goodPicturesFormats = ["image/jpeg", "image/png", "image/jpg"];

// Validates the uploaded pictures
const isAnArrayOfPictures = (pictures) => {
  // if pictures is not an array of at least 2 files we return false
  if (!Array.isArray(pictures) || pictures.length === 0) {
    return false;
  }
  return true;
};

// Validates the picture formats
const validatePictureFormats = (pictures) => {
  //if we have got a file that isn't an image we return false
  if (
    !pictures.every((picture) => goodPicturesFormats.includes(picture.mimetype))
  ) {
    return false;
  }
  return true;
};

module.exports = { isAnArrayOfPictures, validatePictureFormats };
