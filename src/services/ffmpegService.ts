//@ts-nocheck
import ffmpeg from "fluent-ffmpeg";
import { promises as fs } from "fs";
import path from "path";
import { myMkdir, shuffleArray } from "./util";

// import { createTmpAudioFile } from "@/services/ffmpegService";
import { durationExpand } from "@/services/songService";
import { removeFileExtension } from "@/services/util";
import {
  addPlaylist,
  addPlaylistLofiVer2,
  getFilesNameByFolderPath,
} from "./playlistService";
import { changeExtension } from "./folderService";

export const audioFirstFolderName = "first";
export const audioHighlightFolderName = "highlight";
export const audioOutFolderName = "out";
export const pickUp = "pick_up";

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
// 1 for 100%
export async function extractAudio(
  inputFilePath,
  outputAudioFilePath?,
  volumeDecreasePercent = 1
) {
  return new Promise((resolve, reject) => {
    const outputFilePath = outputAudioFilePath
      ? outputAudioFilePath
      : changeExtension(inputFilePath, ".wav");

    try {
      ffmpeg()
        .input(inputFilePath)
        .output(outputFilePath)
        .audioCodec("pcm_s16le")
        .audioFilters(`volume=${volumeDecreasePercent}`)
        .on("error", () => {
          resolve(false);
        })
        .on("end", () => {
          resolve(outputFilePath);
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
        // await fs.unlink(tempFileList);
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
        resolve(outputScreenFilePath);
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
// còn rất nhiều bug liên quan thoery
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
// still follow thoery 4 level audio pickup
// but safer
export async function getPlaylistV2(
  audioFolderPath: string,
  playlistLength: number,
  highlightPickup: number = 0,
  firstUsedFolderPath?: string
) {
  let audioFiles = [];
  // check folder - we skip it now
  await initAudioFolder(audioFolderPath);

  //get first
  if (firstUsedFolderPath) {
    await addPlaylist(
      audioFiles,
      path.join(audioFolderPath, audioFirstFolderName),
      1,
      path.join(audioFolderPath, pickUp),
      true
    );
    playlistLength -= 1;
  }

  //get high light
  if (highlightPickup) {
    const { numberAudioAdded } = await addPlaylist(
      audioFiles,
      path.join(audioFolderPath, audioHighlightFolderName),
      highlightPickup,
      path.join(audioFolderPath, pickUp)
    );
    playlistLength -= numberAudioAdded;
  }

  //add fill
  await addPlaylist(
    audioFiles,
    path.join(audioFolderPath), // default folder is know for fill folder
    playlistLength
  );

  await durationExpand(audioFiles);

  return audioFiles;
}

export async function getPlaylistVer2ExtraFill(
  audioFolderPath: string,
  playlistLength: number,
  highlightPickup: number = 0,
  extraFillFolderPaths: object[],
  firstUsedFolderPath?: string
) {
  let audioFiles = [];
  // check folder - we skip it now
  await initAudioFolder(audioFolderPath);

  //get first
  if (firstUsedFolderPath) {
    await addPlaylist(
      audioFiles,
      path.join(audioFolderPath, audioFirstFolderName),
      1,
      path.join(audioFolderPath, pickUp),
      true
    );
    playlistLength -= 1;
  }

  //get high light
  if (highlightPickup) {
    const { numberAudioAdded } = await addPlaylist(
      audioFiles,
      path.join(audioFolderPath, audioHighlightFolderName),
      highlightPickup,
      path.join(audioFolderPath, pickUp)
    );
    playlistLength -= numberAudioAdded;
  }

  //add fill
  const { numberAudioAdded } = await addPlaylist(
    audioFiles,
    path.join(audioFolderPath), // default folder is know for fill folder
    playlistLength,
    path.join(audioFolderPath, pickUp)
  );
  playlistLength -= numberAudioAdded;

  if (extraFillFolderPaths) {
    extraFillFolderPaths = shuffleArray(extraFillFolderPaths);
    for (let folderPath of extraFillFolderPaths) {
      //add extra fill
      const { numberAudioAdded } = await addPlaylist(
        audioFiles,
        folderPath.indexFolder, // default folder is know for fill folder
        playlistLength,
        path.join(folderPath.useFolder)
      );
      playlistLength -= numberAudioAdded;
      if (playlistLength <= 0) {
        break;
      }
    }
  }

  await durationExpand(audioFiles);

  return audioFiles;
}
//
async function initAudioFolder(audioFolderPath) {
  return new Promise(async (resolve, reject) => {
    //create all in-need folder
    await myMkdir(path.join(audioFolderPath, audioFirstFolderName));

    await myMkdir(path.join(audioFolderPath, audioHighlightFolderName));

    // use default folder path for fill

    await myMkdir(path.join(audioFolderPath, audioOutFolderName));

    await myMkdir(path.join(audioFolderPath, pickUp));

    resolve();
  });
}
// dont in-use or export
export async function mergeAudioFiles(
  inputAudio1stFilePath, //music
  inputAudio2ndFilePath, //ex
  outputAudioFileFilePath //out
) {
  return new Promise(async (resolve, reject) => {
    ffmpeg()
      .input(inputAudio2ndFilePath)
      .input(inputAudio1stFilePath)
      .complexFilter(["[0:a][1:a]amix=inputs=2:dropout_transition=2[a]"])
      .outputOptions(["-map [a]", "-ac 2", "-ar 44100"])
      .output(outputAudioFileFilePath)
      .on("end", () => {
        resolve(outputAudioFileFilePath);
      })
      .on("error", (err) => {
        console.error("Error:", err);
        reject(err);
      })
      .run();
  });
}
//???
export async function createExsoundFile(
  inhandFolderPath,
  inputExsoundFolderPath,
  outputExsoundFilePath,
  audioDuration
) {
  return new Promise(async (resolve, reject) => {
    let exsoundFileNames = (
      await getFilesNameByFolderPath(inputExsoundFolderPath, ".wav")
    ).map((fileName) => `${inputExsoundFolderPath}\\${fileName}`);

    //shuffle ex-sound list
    exsoundFileNames = shuffleArray(exsoundFileNames);

    //repeat ex-sound
    const cloneExsound = JSON.parse(JSON.stringify(exsoundFileNames));
    let cloneExsoundDuration = 0;
    for (const file of cloneExsound) {
      cloneExsoundDuration += (await getMetadata(file)).duration;
    }

    //how many time we need to repeat exsound
    const repeatTime = Math.round(audioDuration / cloneExsoundDuration);
    for (let index = 0; index < repeatTime; index++) {
      exsoundFileNames.push(...cloneExsound);
    }

    await mergeWavFiles(exsoundFileNames, outputExsoundFilePath, audioDuration);

    resolve(outputExsoundFilePath);
  });
}
// only for wav
// mp3 idk, not test yet
export async function createTmpAudioWavFile(
  inhandFolderPath,
  playlist,
  outputAudioFilePath
) {
  return new Promise(async (resolve, reject) => {
    const fileListContent = playlist.map(({ absPath }) => absPath);

    await mergeWavFiles(fileListContent, outputAudioFilePath);

    resolve(outputAudioFilePath);
  });
}
// private function
// not rdy for mp3
async function mergeWavFiles(wavFiles, outputWavFile, duration?) {
  return new Promise((resolve, reject) => {
    const ffmpegCommand = ffmpeg();

    // Thêm từng file âm thanh vào input của ffmpeg
    wavFiles.forEach((file) => ffmpegCommand.input(file));

    // Cấu hình complex filter để hợp nhất các file âm thanh
    const inputCount = wavFiles.length;
    const filterString =
      Array.from({ length: inputCount }, (_, i) => `[${i}:0]`).join("") +
      `concat=n=${inputCount}:v=0:a=1[out]`;

    if (duration) {
      ffmpegCommand
        .complexFilter([filterString])
        .outputOptions(["-map", "[out]", "-c:a", "pcm_s16le"]) // Chuyển âm thanh sang định dạng PCM 16-bit
        .duration(duration)
        .on("start", (cmd) => {
          // console.info("Started merging WAV files with command:", cmd);
        })
        .on("end", () => {
          resolve();
        })
        .on("error", (err) => {
          reject(err);
        })
        .save(outputWavFile);
    } else {
      ffmpegCommand
        .complexFilter([filterString])
        .outputOptions(["-map", "[out]", "-c:a", "pcm_s16le"]) // Chuyển âm thanh sang định dạng PCM 16-bit
        .on("start", (cmd) => {})
        .on("end", () => {
          resolve();
        })
        .on("error", (err) => {
          reject(err);
        })
        .save(outputWavFile);
    }
  });
}

export async function standardizeAudio(inputFile, outputFile) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputFile)
      .outputOptions([
        "-ar 44100", // Sampling rate: 44100 Hz
        "-ac 2", // Number of channels: 2 (stereo)
        "-sample_fmt s16", // Bit depth: 16-bit
      ])
      .output(outputFile)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run();
  });
}

// dont in-use or export
async function form(inputfile, outputAudioFile) {
  return new Promise(async (resolve, reject) => {});
}
async function exform(inputfile, outputAudioFile) {
  return new Promise((resolve, reject) => {});
}
