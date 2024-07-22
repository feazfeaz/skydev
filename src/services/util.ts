//@ts-nocheck
import { promises as fs } from "fs";
import path from "path";

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
/**
 * lấy data trong 2 file và ép thành 1 file docs mới
 * @param {string} playlistFilePath - Đường dẫn hiện tại của file playlist.
 * @param {string} descriptionTemplateFilePath - Đường dẫn mới của file template.
 * @param {string} outputFilePath - Đường dẫn mới của đầu ra(option).
 */
export async function createDescriptionFile(
  playlistFilePath,
  descriptionTemplateFilePath,
  outputFilePath?
) {
  try {
    // Đọc nội dung file 1
    const data1 = await fs.readFile(playlistFilePath, { encoding: "utf8" });
    // Đọc nội dung file 2
    const data2 = await fs.readFile(descriptionTemplateFilePath, {
      encoding: "utf8",
    });

    // Thay thế <replace> trong file 2 bằng nội dung của file 1
    const newData = data2.toString().replace("<replace>", data1.toString());

    // Kiểm tra nếu outputFilePath không có giá trị
    if (!outputFilePath) {
      // Lấy thư mục của playlistFilePath và đặt tên file là en-description.txt
      const playlistDir = path.dirname(playlistFilePath);
      outputFilePath = path.join(playlistDir, "en-description.txt");
    }

    // Ghi kết quả vào file mới
    await fs.writeFile(outputFilePath, newData, "utf8");
  } catch (error) {
    console.error("Error:", error);
  }
}

// Hàm chuyển đổi thời gian từ định dạng 'mm:ss' hoặc 'hh:mm:ss' sang giây
function timeToSeconds(time) {
  const parts = time.split(":").map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

// Hàm chuyển đổi thời gian từ giây sang định dạng 'hh:mm:ss:ms'
function secondsToTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}:00`;
}

export async function insertAdsIntoPlaylist(playlistFilePath, outputFilePath?) {
  try {
    // Đọc nội dung của playlist
    const data = await fs.readFile(playlistFilePath, { encoding: "utf8" });

    // Chia tách các dòng và lọc ra những dòng có chứa thời gian và tiêu đề bài hát
    const lines = data.split("\n").filter((line) => line.trim() !== "");

    // Xác định các vị trí chèn quảng cáo
    const adPoints = [
      2, // Kết thúc bản nhạc thứ 3 (0-based index)
      Math.floor(lines.length / 2) - 1, // Kết thúc bản nhạc giữa clip
      lines.length - 2, // Kết thúc bản nhạc kế cuối
    ];

    // Tính toán thời gian chèn quảng cáo
    const adTimes = adPoints.map((point) => {
      const nextSongTime = lines[point + 1].split(" ")[0];
      const adTimeSeconds = timeToSeconds(nextSongTime) - 1;
      return secondsToTime(adTimeSeconds);
    });

    // Chuyển đổi các điểm quảng cáo thành chuỗi
    const adContent = adTimes.join("\n");

    // Kiểm tra nếu outputFilePath không có giá trị
    if (!outputFilePath) {
      // Lấy thư mục của playlistFilePath và đặt tên file là ad_times.txt
      const playlistDir = path.dirname(playlistFilePath);
      outputFilePath = path.join(playlistDir, "ad_times.txt");
    }

    // Ghi kết quả vào file mới
    await fs.writeFile(outputFilePath, adContent, "utf8");
  } catch (error) {
    console.error("Error:", error);
  }
}
