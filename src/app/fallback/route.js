// import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import { promises as fs } from "fs";
import { parseFile } from "music-metadata";
import ffprobeStatic from "ffprobe-static";
import path from "path";

const filePath_ = process.env.FILE_PATH;
const dirPath_ = process.env.DIR_PATH;
const newDirPath = "\\020624-hyu";
const btsPath = "\\bts";
export async function GET() {
  // await funcA(); // audio out put
  // funcB();
  await funcC();
  return Response.json({ rep: "hello" });
}

async function funcB() {
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
    console.log("filesWithDuration: ", files);

    await myMkdir(dirPath_ + newDirPath);

    const listingMusicDocs = files
      .map((file) => {
        return file.startTimeFormat.concat(" ", removeFileExtension(file.name));
      })
      .join("\n");
    // console.log("listingMusicDocs : ", listingMusicDocs);

    // Ghi nội dung vào tệp
    await fs.writeFile(
      dirPath_.concat(newDirPath, "\\listing.txt"),
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
      newDirPath,
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

async function funcA() {
  if (!filePath_) {
    console.error("Missing filepath!");
    return Response.json({});
  }

  if (!dirPath_) {
    console.error("Missing dirpath!");
    return Response.json({});
  }

  // ffmpeg.setFfmpegPath(
  //   process.cwd().concat("\\node_modules\\ffmpeg-static\\ffmpeg.exe")
  // );
  ffmpeg.setFfmpegPath(
    process
      .cwd()
      .concat("\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe")
  );
  ffmpeg.setFfprobePath(
    process
      .cwd()
      .concat("\\node_modules\\ffprobe-static\\bin\\win32\\x64\\ffprobe.exe")
  );

  console.log("started");

  const files = await fs.readdir(dirPath_.concat("\\020624-hyu"));
  // console.log("files: ", files);
  const mpnFiles = files
    .filter((file) =>
      [
        ".mp3",
        // , ".mp4"
      ].includes(path.extname(file).toLowerCase())
    )
    .map((file) => {
      return dirPath_.concat("\\020624-hyu", "\\", file);
    });

  console.log("mpnFiles: ", mpnFiles);

  // Path to the output audio file
  const outputAudio = dirPath_.concat(newDirPath, btsPath, "\\render.mp3");

  // Create a temporary file list
  const tempFileList = dirPath_.concat(newDirPath, btsPath, "\\files.txt");
  const fileListContent = mpnFiles
    .map((filePath) => `file '${filePath}'`)
    .join("\n");

  fs.writeFile(tempFileList, fileListContent);

  // Merge audio files using the concat filter
  ffmpeg()
    .input(tempFileList)
    .inputOptions(["-f", "concat", "-safe", "0"])
    .outputOptions("-c", "copy")
    .on("start", (commandLine) => {
      console.log("Spawned ffmpeg with command: " + commandLine);
    })
    .on("progress", (progress) => {
      console.log("progress: ", progress);
      console.log("Processing: " + progress.percent + "% done");
    })
    .on("end", () => {
      console.log("Merging finished successfully");
      fs.unlink(tempFileList); // Clean up the temporary file
    })
    .on("error", (err) => {
      console.error("An error occurred: " + err.message);
      fs.unlink(tempFileList); // Clean up the temporary file in case of error
    })
    .save(outputAudio);

  // const commands = mpnFiles.map((audioPath) => {
  //   return ffmpeg().input(audioPath).audioCodec("copy").format("mp3");
  // });

  // Ghép các video lại với nhau bằng cách sử dụng phương thức mergeToFile
  // ffmpeg()
  //   .mergeToFile(commands, "output.mp3", dirPath_.concat("\\020624-hyu"))
  //   .on("error", (err) => {
  //     console.error("Error merging videos:", err);
  //   })
  //   .on("end", () => {
  //     console.log("Videos merged successfully");
  //   })
  //   .run();

  // return;
  // const inputPath = path.join(process.cwd(), "public", "input.mp4");
  // console.log("inputPath: ", inputPath);
  // const outputPath = path.join(process.cwd(), "public", "output.mp4");
  // console.log("outputPath: ", outputPath);

  // ffmpeg(inputPath)
  //   .setStartTime(startTime)
  //   .duration(duration)
  //   .output(outputPath)
  //   .on("start", (commandLine) => {
  //     console.log("Spawned ffmpeg with command: " + commandLine);
  //   })
  //   .on("progress", (progress) => {
  //     console.log("Processing: " + progress.percent + "% done");
  //   })
  //   .on("end", () => {
  //     console.log("Processing finished successfully");
  //     res
  //       .status(200)
  //       .json({ message: "Video cut successfully", output: "output.mp4" });
  //   })
  //   .on("error", (err) => {
  //     console.error("An error occurred: " + err.message);
  //     res.status(500).json({ error: err.message });
  //   })
  //   .run();

  // Thời gian bắt đầu và độ dài của đoạn cần cắt
  // const startTime = "00:00:00"; // Giây thứ 30
  // const duration = "30"; // Đoạn dài 30 giây
  // // Đường dẫn tuyệt đối tới tệp đầu vào và đầu ra
  // const inputPath = dirPath_.concat("\\020624-hyu\\1.mp3");
  // const outputPath = dirPath_.concat("\\020624-hyu\\output.mp3");

  // ffmpeg(inputPath)
  //   .setStartTime(startTime)
  //   .duration(duration)
  //   .output(outputPath)
  //   .on("start", (commandLine) => {
  //     console.log("Spawned ffmpeg with command: " + commandLine);
  //   })
  //   .on("progress", (progress) => {
  //     console.log("progress: ", progress);
  //     // console.log("Processing: " + progress.percent + "% done");
  //   })
  //   .on("end", () => {
  //     console.log("Processing finished successfully");
  //   })
  //   .on("error", (err) => {
  //     console.error("An error occurred: " + err.message);
  //   })
  //   .run();
}

async function funcC() {
  if (!filePath_) {
    console.error("Missing filepath!");
    return Response.json({});
  }

  if (!dirPath_) {
    console.error("Missing dirpath!");
    return Response.json({});
  }

  // ffmpeg.setFfmpegPath(
  //   process.cwd().concat("\\node_modules\\ffmpeg-static\\ffmpeg.exe")
  // );
  ffmpeg.setFfmpegPath(
    process
      .cwd()
      .concat("\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe")
  );
  ffmpeg.setFfprobePath(
    process
      .cwd()
      .concat("\\node_modules\\ffprobe-static\\bin\\win32\\x64\\ffprobe.exe")
  );

  console.log("started");

  const inputVideo = dirPath_.concat(newDirPath, btsPath, "\\video.mp4");
  const newAudio = dirPath_.concat(newDirPath, btsPath, "\\render.mp3");
  const outputVideo = dirPath_.concat(
    newDirPath,
    btsPath,
    "\\output_video.mp4"
  );

  ffmpeg(inputVideo)
    .input(newAudio)
    .outputOptions("-c:v", "copy", "-map", "0:v:0", "-map", "1:a:0")
    .audioCodec("aac")
    .on("error", (err) => {
      console.error("An error occurred: " + err.message);
    })
    .on("end", () => {
      console.log("Conversion finished");
    })
    .save(outputVideo);
}
