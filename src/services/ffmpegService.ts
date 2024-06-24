//@ts-nocheck
import ffmpeg from "fluent-ffmpeg";
import { promises as fs } from "fs";
import path from "path";
import { shuffleArray } from "./util";

// import { createTmpAudioFile } from "@/services/ffmpegService";
import { durationExpand } from "@/services/songService";
import { removeFileExtension } from "@/services/util";

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

export const fffmpeg = ffmpeg;

// ! input .mp4
// ! output .wav
export async function extractAudio(inputFilePath, outputAudioFilePath) {
  return new Promise((resolve, reject) => {
    try {
      ffmpeg()
        .input(inputFilePath)
        .output(outputAudioFilePath)
        .audioCodec("pcm_s16le")
        .on("error", () => {
          resolve(false);
        })
        .on("end", () => {
          resolve(true);
        })
        .run();
    } catch (error) {
      resolve();
    }
  });
}
// ! output will lost audio, extract audio before use this function
export async function overlayVideo(
  inputVideoFilePath,
  inputVideoOverlayFilePath,
  outputVideoFilePath
) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(inputVideoFilePath)
      .input(inputVideoOverlayFilePath)
      .complexFilter([
        // Tách nền đen từ video sóng nhạc
        "[1:v]colorkey=black:1:0.1[ckout]",
        // Overlay sóng nhạc lên video phong cảnh
        "[0:v][ckout]overlay[out]",
      ])
      .outputOptions("-map", "[out]")
      .output(outputVideoFilePath)
      .on("end", () => {
        // console.log("Video merging finished!");
        resolve();
      })
      .on("error", (err) => {
        // console.error("Error merging videos:", err);
        reject();
      })
      .run();
  });
}
//
export async function mergeVideoWithAudio(
  inputVideoFilePath,
  inputAudioFilePath,
  outputFilePath
) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputVideoFilePath)
      .input(inputAudioFilePath)
      .outputOptions("-c:v", "copy", "-map", "0:v:0", "-map", "1:a:0")
      .audioCodec("aac")
      .on("start", (cmd) => {})
      .on("error", (err) => {
        reject();
      })
      .on("end", () => {
        resolve();
      })
      .save(outputFilePath);
  });
}
//
export function getMetadata(filePath): FfprobeData {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) =>
      err ? reject(err) : resolve(metadata.format)
    );
  });
}
// ! input mp3
// playlist format is follow service
export async function createTmpAudioFile(
  inhandFolderPath,
  playlist,
  outputAudioFilePath
) {
  return new Promise((resolve, reject) => {
    // Create a temporary file list
    const tempFileList = `${inhandFolderPath}\\tmp_audio_files.txt`;
    const fileListContent = playlist
      .map(({ absPath }) => `file '${absPath}'`)
      .join("\n");

    fs.writeFile(tempFileList, fileListContent);

    // Merge audio files using the concat filter
    ffmpeg()
      .input(tempFileList)
      .inputOptions(["-f", "concat", "-safe", "0"])
      .outputOptions("-c", "copy")
      .on("start", (cmd) => {})
      .on("progress", (progress) => {})
      .on("end", async () => {
        await fs.unlink(tempFileList);
        resolve();
      })
      .on("error", (err) => {
        reject();
      })
      .save(outputAudioFilePath);
  });
}
//
export async function createTmpScreenFile(
  inhandFolderPath,
  inputScreenFolderPath,
  outputScreenFilePath,
  audioDuration
) {
  return new Promise(async (resolve, reject) => {
    //get screen file - duration, path, name
    const files = await fs.readdir(inputScreenFolderPath);
    const mp4Files = files.filter((file) =>
      [".mp4"].includes(path.extname(file).toLowerCase())
    );

    //shuffle list
    const mp4FilesShuffled = shuffleArray(mp4Files);
    const mp4FilesShuffledPath = mp4FilesShuffled.map(
      (fileName) => `${inputScreenFolderPath}\\${fileName}`
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
    // Create a temporary file list
    const tempFileList = `${inhandFolderPath}\\tmp_screen_files.txt`;
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
        // console.dir("Screen starting...");
      })
      .on("progress", (progress) => {
        // console.dir("Processing : " + progress.percent + "% done");
      })
      .on("end", async () => {
        // console.dir("Screen finished successfully");
        fs.unlink(tempFileList); // Clean up the temporary file
        resolve();
      })
      .on("error", (err) => {
        // console.error("An error occurred: " + err.message);
        fs.unlink(tempFileList); // Clean up the temporary file in case of error
        reject();
      })
      .save(outputScreenFilePath);
  });
}
// * this folder follow thoery 4 level audio pickup
export async function getPlaylist(
  audioFolderPath: string,
  playlistLength: number,
  highlightPickup: number
) {
  let audioFiles = [];
  // check folder - we skip it now

  // get first off
  const priorityPath = path.join(audioFolderPath, "priority");
  let priorityFiles = (await fs.readdir(priorityPath))
    .filter((file) => [".mp3"].includes(path.extname(file).toLowerCase()))
    .map((fileFullName) => ({
      name: removeFileExtension(fileFullName),
      fullname: fileFullName,
    }));

  const fileMap = new Map();
  for (const file of priorityFiles) {
    const baseName = file.name.replace(/ firstoff$/, "");
    if (file.name.endsWith("firstoff")) {
      // Nếu tên file có "firstoff", thì luôn giữ file này
      fileMap.set(baseName, {
        ...file,
        name: baseName, // Cập nhật lại tên không có "firstoff"
      });
    } else {
      // Nếu chưa có file "firstoff", thì giữ file này
      if (!fileMap.has(baseName)) {
        fileMap.set(baseName, file);
      }
    }
  }

  // Chuyển fileMap trở lại thành mảng
  priorityFiles = shuffleArray(Array.from(fileMap.values()));
  // console.log("priorityFiles: ", priorityFiles);
  const firstoffPickup = priorityFiles.pop();
  //@ts-ignore
  firstoffPickup.absPath = path.join(priorityPath, firstoffPickup?.fullname);
  audioFiles.unshift(firstoffPickup);
  playlistLength -= 1;
  //get highlight
  const highlightFolderPath = path.join(audioFolderPath, "highlight");
  let highlightFiles = (await fs.readdir(highlightFolderPath))
    .filter((file) => [".mp3"].includes(path.extname(file).toLowerCase()))
    .map((fileFullName) => ({
      name: removeFileExtension(fileFullName),
      fullname: fileFullName,
      absPath: path.join(highlightFolderPath, fileFullName),
    }))
    .filter((file) => {
      return !(audioFiles[0]?.name).includes(file.name);
    });

  if (highlightPickup > highlightFiles.length) {
    console.error(
      "Danh sách high light không đủ để làm playlist theo yêu cầu!"
    );
    return null;
  } else {
    //suffle highlight file
    //slice to number of highlight that user want to have
    const result = shuffleArray(highlightFiles).slice(0, highlightPickup);
    //add to playlist
    audioFiles.push(...result);
  }

  //get fill
  if (!(playlistLength == highlightPickup)) {
    const avoidList = audioFiles.map((file) => file.fullname);
    const fillFolderPath = path.join(audioFolderPath, "fill");
    const fillFiles = (await fs.readdir(fillFolderPath))
      // just take mp3
      .filter((file) => [".mp3"].includes(path.extname(file).toLowerCase()))
      //not in audio files
      .filter((file) => !avoidList.includes(file))
      //add on attribute
      .map((fileFullName) => ({
        name: removeFileExtension(fileFullName),
        fullname: fileFullName,
        absPath: path.join(fillFolderPath, fileFullName),
      }));
    //suffle highlight file
    //slice to number of highlight that user want to have
    const result = shuffleArray(fillFiles).slice(
      0,
      playlistLength - highlightPickup
    );
    //add to playlist
    audioFiles.push(...result);
  }
  await durationExpand(audioFiles);
  // console.dir(audioFiles);
  return audioFiles;
}
// dont in-use or export
async function form(inputfile, outputAudioFile) {
  return new Promise((resolve, reject) => {});
}
