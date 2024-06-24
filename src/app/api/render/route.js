import ffmpeg from "fluent-ffmpeg";
import path from "path";
import { promises as fs } from "fs";
import { parseFile } from "music-metadata";
import {
  removeFileExtension,
  shuffleArray,
  formatDuration,
  myMkdir,
} from "@/services/util";

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

const dirPath_ = process.env.DIR_PATH;
let newDirPath = "";
const btsPath = `${newDirPath}\\bts`;

const instruPath = `${dirPath_}\\instru - slowed`;
const instruSelectedPath = `${instruPath}\\selected`;
const instruPriorityPath = `${instruPath}\\priority`;
// const instruFormatedPath = `${instruPath}\\formated`;

const popPath = `${dirPath_}\\pop`;
const popFormattedPath = `${popPath}\\formated`;

const screenPath = `${dirPath_}\\screen`;
const screenFormattedPath = `${screenPath}\\formated`;
// const screenFormattedPath = `E:\\hyu\\storage\\night screen\\formatted`;

export async function GET() {
  // await oneClick();
  // createUniqueDirectory(dirPath_);

  return Response.json({ rep: "hello" });
}

export async function POST(request) {
  newDirPath = await createUniqueDirectory(path.join(dirPath_, "rendering"));
  const order = await request.json();
  const playlist = await getPlayList(order);
  // console.log(playlist);
  await createPlayListTimeFile(playlist);
  await createTmpAudioFile(playlist);

  return Response.json({ rep: "run" });
}

async function oneClick() {
  const playlist = await getPlayList();
  await createPlayListTimeFile(playlist);
  await createTmpAudioFile(playlist);

  // await createTmpScreenFile();
}
async function getPlayList(order) {
  if (order) {
    return getPlayListOnOrder(order);
  }

  const files = await fs.readdir(instruSelectedPath);

  const isShuffle = true;
  if (isShuffle) {
    shuffleArray(files);
  }

  const mp3Files = await files
    .filter((file) => [".mp3"].includes(path.extname(file).toLowerCase()))
    .map((file) => {
      return {
        name: removeFileExtension(file),
        fullname: file,
        absPath: `${instruSelectedPath}\\${file}`,
      };
    });

  await durationExpand(mp3Files, instruSelectedPath);

  return mp3Files;
}
async function getPlayListOnOrder(order) {
  let audioFiles = [];

  if (order.priorityPicked > 0) {
    let priorityFiles = (await fs.readdir(instruPriorityPath))
      .filter((file) => [".mp3"].includes(path.extname(file).toLowerCase()))
      .map((fileFullName) => ({
        name: removeFileExtension(fileFullName),
        fullname: fileFullName,
        absPath: `${instruPriorityPath}\\${fileFullName}`,
      }));

    if (!priorityFiles || priorityFiles.length < order.priorityPicked) {
      return [];
    }
    priorityFiles = shuffleArray(priorityFiles);
    const priorityFilesSelected = priorityFiles.slice(0, order.priorityPicked);
    audioFiles.unshift(...priorityFilesSelected);

    if (order.totalPlaylistBySongNumbers) {
      order.totalPlaylistBySongNumbers -= priorityFilesSelected.length;
    }
  }

  if (order.isSelect) {
    let fillFilesSelect = (await fs.readdir(instruSelectedPath))
      .filter((file) => [".mp3"].includes(path.extname(file).toLowerCase()))
      .map((fileFullName) => ({
        name: removeFileExtension(fileFullName),
        fullname: fileFullName,
        absPath: `${instruSelectedPath}\\${fileFullName}`,
      })); // thiếu filter
    fillFilesSelect = shuffleArray(fillFilesSelect);

    const fillFilesSelected = fillFilesSelect.slice(
      0,
      order.totalPlaylistBySongNumbers
    );
    audioFiles.push(...fillFilesSelected);
  }
  const cloneAudio = JSON.parse(JSON.stringify(audioFiles));
  audioFiles.push(...cloneAudio);
  audioFiles.push(...cloneAudio);
  await durationExpand(audioFiles);
  return audioFiles;
}
async function setMetadataFile() {}
async function metadataExpand(files, path) {}
async function durationExpand(files) {
  //time config
  let initStartTime = 0.0;
  let currentStartTime = 0.0;
  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    file.durationSecond = (await parseFile(file.absPath)).format.duration;
    file.startTimeSecond = initStartTime + currentStartTime;
    file.startTimeFormat = formatDuration(file.startTimeSecond);
    currentStartTime += file.durationSecond;
  }
}

async function createPlayListTimeFile(playlist) {
  const playlistFilePath = `${newDirPath}\\playlist.txt`;
  // await myMkdir(newDirPath);

  const listingMusicDocs = playlist
    .map((player) => {
      return player.startTimeFormat.concat(
        " ",
        removeFileExtension(player.name)
      );
    })
    .join("\n");

  // Ghi nội dung vào tệp
  await fs.writeFile(playlistFilePath, listingMusicDocs, {
    flag: "w",
  });
}
async function createTmpAudioFile(playlist) {
  // Path to the output audio file
  const outputAudio = `${newDirPath}\\tmp_audio.mp3`;

  // Create a temporary file list
  const tempFileList = `${newDirPath}\\tmp_audio_files.txt`;
  const fileListContent = playlist
    .map(({ absPath }) => `file '${absPath}'`)
    .join("\n");

  fs.writeFile(tempFileList, fileListContent);

  // Merge audio files using the concat filter
  ffmpeg()
    .input(tempFileList)
    .inputOptions(["-f", "concat", "-safe", "0"])
    .outputOptions("-c", "copy")
    .on("start", (cmd) => {
      // console.log("Audio with command: " + cmd);
      console.log("Audio starting...");
    })
    .on("progress", (progress) => {
      // console.log("Processing Audio: " + progress.percent + "% done");
    })
    .on("end", async () => {
      console.log("Audio finished successfully");
      fs.unlink(tempFileList); // Clean up the temporary file
      await createTmpScreenFile(playlist);
    })
    .on("error", (err) => {
      console.error("An error occurred: " + err.message);
      fs.unlink(tempFileList); // Clean up the temporary file in case of error
    })
    .save(outputAudio);
}
async function createTmpScreenFile(playlist) {
  //get audio duration
  const audioPath = `${newDirPath}\\tmp_audio.mp3`;
  const audioDuration = (await parseFile(audioPath)).format.duration;
  if (!audioDuration) {
    console.error("File not found ");
    return;
  }

  const videoFilePath = screenFormattedPath;
  //get screen file - duration, path, name
  const files = await fs.readdir(videoFilePath);
  const mp4Files = files.filter((file) =>
    [".mp4"].includes(path.extname(file).toLowerCase())
  );

  //shuffle list
  const mp4FilesShuffled = shuffleArray(mp4Files);
  const mp4FilesShuffledPath = mp4FilesShuffled.map(
    (fileName) => `${videoFilePath}\\${fileName}`
  );

  const cloneVideo = JSON.parse(JSON.stringify(mp4FilesShuffledPath));
  let cloneVideoDuration = 0,
    videoDuration = 0;
  for (const file of mp4FilesShuffledPath) {
    cloneVideoDuration += (await getMetadata(file)).duration;
  }
  videoDuration = cloneVideoDuration;
  while (videoDuration < audioDuration) {
    mp4FilesShuffledPath.push(...cloneVideo);
    videoDuration += cloneVideoDuration;
  }

  // Path to the output audio file
  const outputScreen = `${newDirPath}\\tmp_screen.mp4`;
  // Create a temporary file list
  const tempFileList = `${newDirPath}\\tmp_screen_files.txt`;
  const fileListContent = mp4FilesShuffledPath
    .map((filePath) => `file '${filePath}'`)
    .join("\n");
  fs.writeFile(tempFileList, fileListContent);

  // Merge screen files using the concat filter
  ffmpeg()
    .input(tempFileList)
    .inputOptions(["-f", "concat", "-safe", "0"])
    .outputOptions("-c", "copy")
    .duration(audioDuration)
    .on("start", (cmd) => {
      // console.dir("Screen ffmpeg with command: " + commandLine);
      console.dir("Screen starting...");
    })
    .on("progress", (progress) => {
      // console.dir("Processing : " + progress.percent + "% done");
    })
    .on("end", async () => {
      console.dir("Screen finished successfully");
      fs.unlink(tempFileList); // Clean up the temporary file
      createEndProduct();
    })
    .on("error", (err) => {
      console.error("An error occurred: " + err.message);
      fs.unlink(tempFileList); // Clean up the temporary file in case of error
    })
    .save(outputScreen);
}
async function createEndProduct() {
  const inputVideo = `${newDirPath}\\tmp_screen.mp4`;
  const newAudio = `${newDirPath}\\tmp_audio.mp3`;
  const outputVideo = `${newDirPath}\\endprod.mp4`;

  ffmpeg(inputVideo)
    .input(newAudio)
    .outputOptions("-c:v", "copy", "-map", "0:v:0", "-map", "1:a:0")
    .audioCodec("aac")
    .on("start", (cmd) => {
      console.error("End product started!");
    })
    .on("error", (err) => {
      console.error("An error occurred: " + err.message);
    })
    .on("end", () => {
      console.log("End product finish!");
      cleanUp();
    })
    .save(outputVideo);
}
async function cleanUp() {
  const filesClean = [
    `${newDirPath}\\tmp_audio.mp3`,
    `${newDirPath}\\tmp_screen.mp4`,
  ];

  for (const file of filesClean) {
    fs.unlink(file);
  }

  console.log("Clean!");
}

async function createUniqueDirectory(basePath) {
  // Lấy thời gian hiện tại
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Tháng từ 0-11, nên cộng 1 và định dạng 2 chữ số
  const date = String(now.getDate()).padStart(2, "0"); // Ngày định dạng 2 chữ số
  const hours = String(now.getHours()).padStart(2, "0"); // Giờ định dạng 2 chữ số
  const minutes = String(now.getMinutes()).padStart(2, "0"); // Phút định dạng 2 chữ số
  const seconds = String(now.getSeconds()).padStart(2, "0");

  // Tạo tên thư mục
  const uniqueDirName = `_${hours}h${minutes}m${seconds}s_${date}${month}${year}`;

  // Tạo đường dẫn đầy đủ cho thư mục
  const newDirPath_ = path.join(basePath, uniqueDirName);
  console.log("newDirPath_: ", newDirPath_);

  // Tạo thư mục
  await myMkdir(newDirPath_);

  // Trả về đường dẫn của thư mục mới tạo
  return newDirPath_;
}

export async function getMetadata(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) =>
      err ? reject(err) : resolve(metadata.format)
    );
  });
}
