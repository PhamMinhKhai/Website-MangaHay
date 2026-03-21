const { deleteFromCloudinary } = require("../middleware/upload");

async function deleteFile(url) {
  try {
    return await deleteFromCloudinary(url);
  } catch (err) {
    console.error("Delete file error:", err);
    return false;
  }
}

module.exports = { deleteFile };
