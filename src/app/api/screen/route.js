import ffmpeg from "fluent-ffmpeg";
import { promises as fs } from "fs";
import path from "path";
import {
  removeFileExtension,
  shuffleArray,
  formatDuration,
  myMkdir,
} from "@/services/util";

import {
  extractAudio,
  overlayVideo,
  mergeVideoWithAudio,
} from "@/services/ffmpegService";

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

export async function GET() {
  //get screen folder
  const screenFolder = "E:\\hyu\\@nkltg - storage\\screen";
  const backgroundFile = "E:\\hyu\\@nkltg - storage\\rss\\background.mp4";
  //check screen has formatted yet?
  if (!(await fs.readdir(screenFolder)).includes("formatted")) {
    const msg = "Không có thư mục formatted hay các file chưa dc format!";
    console.error(msg);
    return Response.json({ msg });
  }
  //check background file
  try {
    await fs.stat(backgroundFile);
  } catch (error) {
    const msg = "Không có file background!";
    console.error(msg);
    return Response.json({ msg });
  }
  //create backgrouded folder
  await myMkdir(path.join(screenFolder, "backgrouded"));
  const formattedPath = path.join(screenFolder, "formatted");
  const backgroundedPath = path.join(screenFolder, "backgrouded");
  //get formatted file
  //filter out file not is .mp4
  //filter out file not exists in backgrounded
  const formattedFile = await fs.readdir(formattedPath);
  const backgrounded = await fs.readdir(backgroundedPath);
  const formattedFileNeedToBackground = formattedFile
    .filter((file) => [".mp4"].includes(path.extname(file).toLowerCase()))
    .filter((file) => !backgrounded.includes(file));
  //handle background

  let index = 1;
  let size = formattedFileNeedToBackground.length;
  for (const file of formattedFileNeedToBackground) {
    console.dir(`${index++}/${size} '${file}'`);
    // create file tmp background file
    await backgroundHandle(
      path.join(formattedPath, file),
      backgroundFile,
      backgroundedPath
    );
    // extract audio
    // console.dir("extract: ");
    await extractAudio(
      path.join(formattedPath, file),
      path.join(backgroundedPath, "tmp_audio.wav")
    );
    let isHaveAudio = false;
    try {
      await fs.stat(
        path.join(backgroundedPath, "tmp_audio.wav"),
        {},
        (e, stat) => {}
      );
      isHaveAudio = true;
    } catch (error) {
      isHaveAudio = false;
    }
    // create video have backgroud
    // console.dir("create ");
    await overlayVideo(
      path.join(formattedPath, file),
      path.join(backgroundedPath, "tmp_repeat.mp4"),
      path.join(backgroundedPath, "tmp_video.mp4")
    );
    // merge audio back to video
    // console.dir("merge ");
    if (isHaveAudio) {
      await mergeVideoWithAudio(
        path.join(backgroundedPath, "tmp_video.mp4"),
        path.join(backgroundedPath, "tmp_audio.wav"),
        path.join(backgroundedPath, file)
      );
    } else {
      await fs.rename(
        path.join(backgroundedPath, "tmp_video.mp4"),
        path.join(backgroundedPath, file)
      );
    }
    // clear file
    // console.dir("clear");
    await fs.unlink(path.join(backgroundedPath, "tmp_repeat.mp4"));
    if (isHaveAudio) {
      await fs.unlink(path.join(backgroundedPath, "tmp_audio.wav"));
      await fs.unlink(path.join(backgroundedPath, "tmp_video.mp4"));
    }
  }

  return Response.json({ rep: "run" });
}

async function backgroundHandle(
  landscapeVideoPath,
  musicWaveVideoPath,
  backgroundedContainPath
) {
  const landscapeVideoDuration = (await getMetadata(landscapeVideoPath))
    .duration;
  const musicWaveVideoDuration = (await getMetadata(musicWaveVideoPath))
    .duration;
  await singleRepeat(
    backgroundedContainPath,
    musicWaveVideoPath,
    musicWaveVideoDuration,
    landscapeVideoDuration
  );

  async function singleRepeat(__dirname, filePath, duration, targetDuration) {
    return new Promise((resolve, reject) => {
      const outputTmpRepeat = `${__dirname}\\tmp_repeat.mp4`;
      const tempFileList = `${__dirname}\\tmp_reapeat_files.txt`;

      let repeatPaths = [filePath];
      let calcuDuration = duration;
      while (calcuDuration < targetDuration) {
        repeatPaths.push(filePath);
        calcuDuration += duration;
      }

      const fileListContent = repeatPaths
        .map((filePath) => `file '${filePath}'`)
        .join("\n");
      fs.writeFile(tempFileList, fileListContent);

      // Merge screen files using the concat filter
      ffmpeg()
        .input(tempFileList)
        .inputOptions(["-f", "concat", "-safe", "0"])
        .outputOptions("-c", "copy")
        .duration(targetDuration)
        // .on("start", (cmd) => {})
        // .on("progress", (progress) => {})
        // .on("error", (err) => {})
        .on("end", async () => {
          fs.unlink(path.join(__dirname, "tmp_reapeat_files.txt"));
          resolve();
        })
        .save(outputTmpRepeat);
    });
  }
}

async function getMetadata(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) =>
      err ? reject(err) : resolve(metadata.format)
    );
  });
}
