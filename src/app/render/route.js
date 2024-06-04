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
const instruPath = `${dirPath_}\\instru`;
const popPath = `${dirPath_}\\pop`;
const screenPath = `${dirPath_}\\screen`;
const newDirPath = `${dirPath_}\\020624-hyu`;
const btsPath = `${newDirPath}\\bts`;

export async function GET() {
  await oneClick();

  return Response.json({ rep: "hello" });
}

async function oneClick() {
  const playlist = await getPlayList();

  await createPlayListTimeFile(playlist);

  await createTmpAudioFile(playlist);

  // await createEndProduct(playlist);
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
    console.error("Found not file");
    return;
  }

  //get screen file - duration, path, name
  const files = await fs.readdir(screenPath);
  const mp4Files = files.filter((file) =>
    [".mp4"].includes(path.extname(file).toLowerCase())
  );

  //shuffle list
  const mp4FilesShuffled = shuffleArray(mp4Files);
  const mp4FilesShuffledPath = mp4FilesShuffled.map(
    (fileName) => `${screenPath}\\${fileName}`
  );

  // Path to the output audio file
  const outputScreen = `${newDirPath}\\tmp_screen.mp4`;

  // Create a temporary file list
  const tempFileList = `${newDirPath}\\tmp_screen_files.txt`;
  const fileListContent = mp4FilesShuffledPath
    .map((filePath) => `file '${filePath}'`)
    .join("\n");

  fs.writeFile(tempFileList, fileListContent);

  // return;
  // Merge screen files using the concat filter
  ffmpeg()
    .input(tempFileList)
    .inputOptions(["-f", "concat", "-safe", "0"])
    .outputOptions("-c", "copy")
    .duration(audioDuration)
    .on("start", (cmd) => {
      // console.log("Screen ffmpeg with command: " + commandLine);
      console.log("Screen starting...");
    })
    .on("progress", (progress) => {
      // console.log("Processing : " + progress.percent + "% done");
    })
    .on("end", async () => {
      console.log("Screen finished successfully");
      fs.unlink(tempFileList); // Clean up the temporary file
      await createEndProduct();
    })
    .on("error", (err) => {
      console.error("An error occurred: " + err.message);
      fs.unlink(tempFileList); // Clean up the temporary file in case of error
    })
    .save(outputScreen);
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
async function getPlayList() {
  const files = await fs.readdir(instruPath);

  const isShuffle = true;
  if (isShuffle) {
    shuffleArray(files);
  }

  const mp3Files = await files
    .filter((file) =>
      [
        ".mp3",
        // , ".mp4"
      ].includes(path.extname(file).toLowerCase())
    )
    .map((file) => {
      return {
        name: removeFileExtension(file),
        fullName: file,
        absPath: `${instruPath}\\${file}`,
      };
    });

  //time config
  let initStartTime = 0.0;
  let currentStartTime = 0.0;
  for (const file of mp3Files) {
    file.durationSecond = (
      await parseFile(`${instruPath}\\${file.fullName}`)
    ).format.duration;
    file.startTimeSecond = initStartTime + currentStartTime;
    file.startTimeFormat = formatDuration(file.startTimeSecond);
    currentStartTime += file.durationSecond;
  }

  return mp3Files;
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
