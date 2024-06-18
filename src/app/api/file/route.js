import ffmpeg from "fluent-ffmpeg";
import path from "path";
import { promises as fs } from "node:fs";
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

let priorityPath = "";
let trashPath = "";
let formatPath = "";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  return Response.json({ data: await readDir(url) });
}

export async function POST(req) {
  const { url, files } = await req.json();
  // console.log("files: ", files);

  const priorityPath = path.join(url, "priority");
  const trashPath = path.join(url, "trash");

  await myMkdir(priorityPath);
  await myMkdir(path.join(url, "format"));
  await myMkdir(trashPath);

  const priorityFiles = await fs.readdir(priorityPath);
  const trashFiles = await fs.readdir(trashPath);

  files.forEach((file) => {
    if (file.isPriority) {
      fs.copyFile(
        path.join(url, file.fullname),
        path.join(url, "priority", file.fullname)
      );
    } else {
      if (priorityFiles.includes(file)) {
        try {
          fs.unlink(path.join(url, "priority", file.fullname));
        } catch (error) {}
      }
    }

    if (file.isTrash) {
      fs.copyFile(
        path.join(url, file.fullname),
        path.join(url, "trash", file.fullname)
      );
    } else {
      if (trashFiles.includes(file)) {
        try {
          fs.unlink(path.join(url, "trash", file.fullname));
        } catch (error) {}
      }
    }
  });

  return Response.json({ data: await readDir(url) });
}

export async function readDir(url) {
  const items = await fs.readdir(url);

  let priorityFile = [];
  if (items.includes("priority")) {
    priorityPath = `${url}\\priority`;
    priorityFile = await fs.readdir(priorityPath);
  }

  let trashFile = [];
  if (items.includes("trash")) {
    trashPath = `${url}\\trash`;
    trashFile = await fs.readdir(trashPath);
  }

  let formatFile = [];
  if (items.includes("format")) {
    formatPath = `${url}\\format`;
    formatFile = await fs.readdir(formatPath);
  }

  const mp3Files = await [...items]
    .filter((file) => [".mp3"].includes(path.extname(file).toLowerCase()))
    .map((file) => {
      return {
        name: removeFileExtension(file),
        fullname: file,
        type: "mp3",
        absPath: `${url}\\${file}`,
      };
    });

  const mp4Files = await [...items]
    .filter((file) => [".mp4"].includes(path.extname(file).toLowerCase()))
    .map((file) => {
      return {
        name: removeFileExtension(file),
        fullname: file,
        type: "mp3",
        absPath: `${url}\\${file}`,
      };
    });

  if (mp3Files.length && mp4Files.length) {
    console.error("Cant perform on folder where include both .mp3 and .mp4");
    return [];
  }

  if (mp4Files.length) {
    for (const file of mp4Files) {
      file.isPriority = priorityFile.includes(file.fullname);
      file.isTrash = trashFile.includes(file.fullname);
      file.format = formatFile.includes(file.fullname);
      file.durationSecond = (await parseFile(file.absPath)).format.duration;
      file.durationFormat = formatDuration(file.durationSecond);

      if (
        file.format &&
        (await parseFile(`${formatPath}\\${file.fullname}`)).format.duration
      ) {
        file.usecasePath = `${formatPath}\\${file.fullname}`;
      } else {
        file.usecasePath = null;
      }
    }
    return mp4Files;
  } else {
    for (const file of mp3Files) {
      file.isPriority = priorityFile.includes(file.fullname);
      file.isTrash = trashFile.includes(file.fullname);
      file.durationSecond = (await parseFile(file.absPath)).format.duration;
      file.durationFormat = formatDuration(file.durationSecond);
      file.usecasePath = file.absPath;
    }
    return mp3Files;
  }
}
