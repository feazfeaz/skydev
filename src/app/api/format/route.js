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

export async function GET() {
  return Response.json({ rep: "run" });
}

function getMetadata(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) =>
      err ? reject(err) : resolve(metadata.format)
    );
  });
}

export async function POST(request) {
  const { folder } = await request.json();

  if (!folder) {
    return Response.json({ rep: -1 });
  }
  const formattedPath = path.join(folder, "formatted");
  await myMkdir(formattedPath);
  const formattedFiles = await fs.readdir(formattedPath);

  const trashPath = path.join(folder, "trash");
  await myMkdir(trashPath);
  const trashFiles = await fs.readdir(trashPath);

  const files = await fs.readdir(folder);
  const filesNotFormatedMp4 = await files
    .filter((file) => [".mp4"].includes(path.extname(file).toLowerCase()))
    .filter((file) => !formattedFiles.includes(file))
    .filter((file) => !trashFiles.includes(file))
    .map((file) => {
      return {
        name: removeFileExtension(file),
        fullName: file,
        absPath: path.join(folder, file),
      };
    });
  if (filesNotFormatedMp4.length) {
    recursiveffmpeg(folder, filesNotFormatedMp4);
  } else {
    console.dir("Không có file cần format!");
  }

  return Response.json({ rep: "run" });
}

function recursiveffmpeg(folder, filesNotFormatedMp4) {
  subRecursiveffmpeg(
    folder,
    filesNotFormatedMp4,
    1,
    filesNotFormatedMp4.length
  );

  function subRecursiveffmpeg(
    folder,
    filesNotFormatedMp4,
    currentIndex,
    lengthFile
  ) {
    const curFile = filesNotFormatedMp4.shift();
    const inputFile = path.join(folder, curFile.fullName);
    const outputFile = path.join(folder, "formatted", curFile.fullName);
    ffmpeg(inputFile)
      .outputOptions(
        "-safe",
        "1",
        "-r",
        "30",
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
        console.dir(
          `${currentIndex}/${lengthFile} - Format on '${curFile.name}'`
        );
      })
      .on("error", (err) => {
        console.error(`Error happend on ${curFile.name}. We move it to trash!`);
        fs.copyFile(
          curFile.absPath,
          path.join(folder, "trash", curFile.fullName)
        );
        if (currentIndex < lengthFile) {
          subRecursiveffmpeg(
            folder,
            filesNotFormatedMp4,
            ++currentIndex,
            lengthFile
          );
        } else {
          console.dir("kết thúc format");
        }
      })
      .on("end", () => {
        if (currentIndex < lengthFile) {
          subRecursiveffmpeg(
            folder,
            filesNotFormatedMp4,
            ++currentIndex,
            lengthFile
          );
        } else {
          console.dir("kết thúc format");
        }
      })
      .save(outputFile);
  }
}
