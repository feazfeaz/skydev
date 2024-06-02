import { promises as fs } from "fs";
import path from "path";
import ffmpegStatic from "ffmpeg-static";
import ffmpeg from "fluent-ffmpeg";
import ffprobeStatic from "ffprobe-static";
import { parseFile } from "music-metadata";

const filePath_ = process.env.FILE_PATH;
const dirPath_ = process.env.DIR_PATH;
export async function GET() {
  // funcA();
  funcB();
  return Response.json({ rep: "hello" });
}

async function funcA() {
  if (!filePath_) {
    console.error("Missing filepath!");
    return Response.json({});
  }

  if (!dirPath_) {
    console.error("Missing dirpath!");
    return Response.json({});
  }

  // Cấu hình đường dẫn tới ffmpeg và ffprobe
  ffmpeg.setFfmpegPath(ffmpegStatic || "");
  ffmpeg.setFfprobePath(ffprobeStatic.path);

  const files = await fs.readdir(dirPath_);

  // Lọc các tệp .mp4
  const mp4Files = files.filter(
    (file) =>
      path.extname(file).toLowerCase() === ".mp4" ||
      path.extname(file).toLowerCase() === ".mp3"
  );

  // Hàm lấy thời lượng của tệp video
  const getVideoDuration = (filePath) => {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          resolve(metadata.format.duration);
        }
      });
    });
  };
  // Lấy thời lượng của các tệp .mp4
  const mp4FilesWithDuration = await Promise.all(
    mp4Files.map(async (file) => {
      const filePath = path.join(dirPath_, file);
      const duration = await getVideoDuration(filePath);
      return { file, duration };
    })
  );
  // Đọc file JSON
  const fileContents = await fs.readFile(filePath_, "utf8");
  // Parse nội dung của file JSON
  const data = JSON.parse(fileContents);
  // Trả về dữ liệu dưới dạng JSON
}
async function funcB() {
  const newDirName = "\\020624-hyu";

  async function handleListingMusic(mpnFiles) {
    const getMetadata = async (filePath_) => {
      const metadata = await parseFile(filePath_);
      return metadata.format.duration;
    };

    const files = await Promise.all(
      mpnFiles.map(async (file) => {
        const filePath = path.join(dirPath_, file);
        const duration = await getMetadata(filePath);
        return { name: file, duration, filePath };
      })
    );
    // console.log("filesWithDuration: ", filesWithDuration);
    let initStartTime = 0.0;
    let currentStartTime = 0.0;
    for (const fileObj of files) {
      fileObj.startTimeSecond = initStartTime + currentStartTime;
      currentStartTime += fileObj.duration;
      fileObj.startTimeFormat = formatDuration(fileObj.startTimeSecond);
    }
    // console.log("filesWithDuration: ", files);

    await myMkdir(dirPath_ + newDirName);

    const listingMusicDocs = files
      .map((file) => {
        return file.startTimeFormat.concat(" ", removeFileExtension(file.name));
      })
      .join("\n");
    // console.log("listingMusicDocs : ", listingMusicDocs);

    // Ghi nội dung vào tệp
    await fs.writeFile(
      dirPath_.concat(newDirName, "\\listing.txt"),
      listingMusicDocs,
      { flag: "w" }
    );
  }

  if (!filePath_) {
    console.error("Missing filepath!");
    return Response.json({});
  }

  if (!dirPath_) {
    console.error("Missing dirpath!");
    return Response.json({});
  }

  const files = await fs.readdir(dirPath_);
  // console.log("files: ", files);
  const mpnFiles = files.filter((file) =>
    [".mp3", ".mp4"].includes(path.extname(file).toLowerCase())
  );

  const mpnFilesShuffled = shuffleArray(mpnFiles);

  // listing file
  await handleListingMusic(mpnFilesShuffled);

  // support copy
  let copyFileIndex = 1;
  for (const file of mpnFiles) {
    const sourceFilePath = dirPath_.concat("\\", file);
    console.log("sourceFilePath: ", sourceFilePath);
    const targetFilePath = dirPath_.concat(
      newDirName,
      "\\",
      copyFileIndex++,
      ".mp3"
    );
    console.log("targetFilePath: ", targetFilePath);
    await fs.copyFile(sourceFilePath, targetFilePath);
  }
}

function shuffleArray(array) {
  // Duyệt qua các phần tử từ cuối mảng về đầu mảng
  for (let i = array.length - 1; i > 0; i--) {
    // Chọn một chỉ số ngẫu nhiên từ 0 đến i
    const j = Math.floor(Math.random() * (i + 1));
    // Hoán đổi phần tử tại chỉ số i với phần tử tại chỉ số ngẫu nhiên j
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
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

async function myMkdir(folderName) {
  try {
    await fs.mkdir(folderName, { recursive: true });
  } catch (err) {
    console.error(err);
  }
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
