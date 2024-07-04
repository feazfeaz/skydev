//@ts-nocheck
import { promises as fs } from "fs";

export async function myMkdir(folderName) {
  try {
    await fs.mkdir(folderName, { recursive: true });
  } catch (err) {
    console.error(err);
  }
}

export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function removeFileExtension(filename) {
  // Sử dụng phương thức lastIndexOf để tìm vị trí của dấu chấm cuối cùng
  const lastDotIndex = filename.lastIndexOf(".");

  // Nếu không tìm thấy dấu chấm hoặc dấu chấm ở đầu tên tệp, trả về tên tệp gốc
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    return filename;
  }

  // Trả về phần tên tệp trước dấu chấm cuối cùng
  return filename.substring(0, lastDotIndex);
}

export function formatDuration(duration) {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = Math.floor(duration % 60);

  const formattedTime =
    (String(hours).padStart(2, "0") == "00"
      ? ""
      : String(hours).padStart(2, "0") + ":") +
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0");
  return formattedTime;
}

export function getRandomNumber(min: number, max: number): number {
  // Kiểm tra để chắc chắn rằng min <= max
  if (min > max) {
    [min, max] = [max, min]; // Hoán đổi giá trị nếu min > max
  }
  // Tính toán và trả về một số ngẫu nhiên trong khoảng từ min đến max (bao gồm cả hai số)
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
