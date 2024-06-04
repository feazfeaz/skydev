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
const instruFormatedPath = `${instruPath}\\formated`;
const popformatedPath = `${popPath}\\formated`;
const screenformatedPath = `${screenPath}\\formated`;

export async function GET() {
  // asd();
  await bsd();
  return Response.json({ rep: "hello" });
}

async function bsd() {
  myMkdir(screenformatedPath);

  const files = await fs.readdir(screenPath);
  const filesFormated = await fs.readdir(screenformatedPath);

  const filesNotFormatedMp4 = await files
    .filter((file) => [".mp4"].includes(path.extname(file).toLowerCase()))
    .filter((file) => !filesFormated.includes(file))
    .map((file) => {
      return {
        name: removeFileExtension(file),
        fullName: file,
        absPath: `${screenPath}\\${file}`,
      };
    });

  recursiveffmpeg(filesNotFormatedMp4);
}

function recursiveffmpeg(screenFiles) {
  subRecursiveffmpeg(screenFiles, 1, screenFiles.length);

  function subRecursiveffmpeg(files, currentIndex, lengthFile) {
    const curFile = files.shift();
    const inputFile = curFile.absPath;
    console.log("inputFile: ", inputFile);
    const outputFile = `${screenformatedPath}\\${curFile.fullName}`;
    console.log("outputFile: ", outputFile);
    ffmpeg(inputFile)
      .outputOptions(
        "-safe",
        "1",
        "-r",
        "24",
        "-s",
        "1920x1080",
        "-c:v",
        "libx264",
        "-b:v",
        "10000k",
        "-c:a",
        "copy"
      )
      .on("start", (cmd) => {
        // console.log("Audio with command: " + cmd);
        console.log(`${currentIndex}/${lengthFile} format starting...`);
      })
      .on("error", (err) => {
        console.error("An error occurred: " + err.message);
      })
      .on("end", () => {
        // console.log("Conversion finished");
        if (currentIndex < lengthFile) {
          subRecursiveffmpeg(screenFiles, ++currentIndex, lengthFile);
        } else {
          console.log("kết thúc format");
        }
      })
      .save(outputFile);
  }
}

async function asd() {
  const inputVideo = `${screenPath}\\4k.mp4`; // Đường dẫn đến video đầu vào
  const outputVideo = `${newDirPath}\\sample.mp4`; // Đường dẫn đến video đầu ra

  // const audioDuration = (await parseFile(inputVideo)).format;
  // console.log("audioDuration: ", audioDuration);

  // ffmpeg.ffprobe(inputVideo, function (err, metadata) {
  //   console.log(metadata);
  // });

  // return;
  ffmpeg(inputVideo)
    .outputOptions(
      "-safe",
      "1",
      "-r",
      "24",
      "-s",
      "1920x1080",
      "-c:v",
      "libx264",
      "-b:v",
      "10000k",
      "-c:a",
      "copy"
    )
    .on("start", (cmd) => {
      // console.log("Audio with command: " + cmd);
      console.log("Format starting...");
    })
    .on("error", (err) => {
      console.error("An error occurred: " + err.message);
    })
    .on("end", () => {
      console.log("Conversion finished");
    })
    .save(outputVideo);
}

// const xample = a.outputOptions(
//   '-safe', '1' ,
//   '-r', '24' ,
//   '-s', '1920x1080' ,
//   '-c:a', 'copy',
//   '-c:v', 'libx264',
//   '-b:v', '10000k'
// )
