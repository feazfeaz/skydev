import ffmpeg from "fluent-ffmpeg";
import { promises as fs } from "fs";
import path from "path";
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
const __dirname = `E:\\hyu\\storage\\rendering`;
export async function GET() {
  //get screen folder
  const screenFolder = "E:\\hyu\\@nkltg - storage\\rendering";
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

  for (const file of formattedFileNeedToBackground) {
    console.log("file: ", file);
    //create file tmp background file
    await backgroundHandle(
      path.join(formattedPath, file),
      backgroundFile,
      backgroundedPath
    );
    break;
  }

  // const landscapeVideoPath = path.join(__dirname, "Trộm Nhìn Nhau.mp4");
  // const musicWaveVideoPath = path.join(__dirname, "background.mp4");
  // const outputVideoPath = path.join(__dirname, "output.mp4");
  // await screenHandle(landscapeVideoPath, musicWaveVideoPath, outputVideoPath);

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
