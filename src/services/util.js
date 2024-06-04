import { promises as fs } from "fs";
module.exports = {
  myMkdir,
  removeFileExtension,
  shuffleArray,
  formatDuration,
};

async function myMkdir(folderName) {
  try {
    await fs.mkdir(folderName, { recursive: true });
  } catch (err) {
    console.error(err);
  }
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function removeFileExtension(filename) {
  // Sử dụng phương thức lastIndexOf để tìm vị trí của dấu chấm cuối cùng
  const lastDotIndex = filename.lastIndexOf(".");

  // Nếu không tìm thấy dấu chấm hoặc dấu chấm ở đầu tên tệp, trả về tên tệp gốc
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return filename;
  }

  // Trả về phần tên tệp trước dấu chấm cuối cùng
  return filename.substring(0, lastDotIndex);
}

function formatDuration(duration) {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);

  const formattedTime =
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0");
  return formattedTime;
}
