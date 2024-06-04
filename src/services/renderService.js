// "use server";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import { promises as fs } from "fs";
import { parseFile } from "music-metadata";
// const { parseFile } = await import("music-metadata");
// import ffprobeStatic from "ffprobe-static";

import { removeFileExtension } from "@/services/util";

const dirPath_ = process.env.DIR_PATH;
const instruPath = `${dirPath_}\\instru`;
const popPath = `${dirPath_}\\pop`;
const screenPath = `${dirPath_}\\screen`;
const newDirPath = `${dirPath_}\\020624-hyu`;
const btsPath = `${newDirPath}\\bts`;

async function oneClick() {
  const playlist = "";
  getPlayList();
}

async function getPlayList() {
  const files = await fs.readdir(instruPath);
  // console.log("files: ", files);
  const mp3Files = await files
    .filter((file) =>
      [
        ".mp3",
        // , ".mp4"
      ].includes(path.extname(file).toLowerCase())
    )
    .map((file) => {
      // console.log("file: ", file);
      const name = removeFileExtension(file);
      return {
        name,
        fullName: file,
      };
    });
  for (const file of mp3Files) {
    let durationSecond = 0;
    await ffmpeg.ffprobe(
      `${newDirPath}\\1.mp3`,
      await function (err, metadata) {
        durationSecond = metadata.format.duration;
        console.log("durationSecond: ", durationSecond);
      }
    );
    file.durationSecond = durationSecond;
  }

  console.log("mp3Files: ", mp3Files);
}

async function compressAudio() {}

// ffmpeg.ffprobe(`${newDirPath}\\1.mp3`, function (err, metadata) {
//   console.log("from ", metadata);
// });
