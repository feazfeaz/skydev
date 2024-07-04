//@ts-nocheck
import ffmpeg from "fluent-ffmpeg";
import { PathLike, promises as fs } from "fs";
import path from "path";
import { myMkdir, removeFileExtension, shuffleArray } from "./util";
import { getFileByEitherFolder, getFileNameRawMarks } from "./folderService";
import { pickUp } from "./ffmpegService";

// dont in-use or export
export async function addPlaylist(
  playlist: any,
  audioFolderPath: string,
  numberSongNeedToAdd: number,
  replaceAudioFolderPath: string = "",
  isOrder: boolean = false
) {
  return new Promise(async (resolve, reject) => {
    //get audio file name
    let audioFilesName = (
      await getFilesNameByFolderPath(audioFolderPath, [".mp3", ".wav"])
    ).map((fileFullName: any) => ({
      name: removeFileExtension(fileFullName),
      fullname: fileFullName,
    }));
    //shuffle
    if (!isOrder) {
      shuffleArray(audioFilesName);
    }
    //take
    if (audioFilesName.length > numberSongNeedToAdd) {
      audioFilesName = audioFilesName.slice(0, numberSongNeedToAdd);
    }
    //is use replace audio
    if (replaceAudioFolderPath) {
      for (const file of audioFilesName) {
        const { fullname, absPath } = await getFileByEitherFolder(
          file.fullname,
          replaceAudioFolderPath, // replace source
          audioFolderPath // root source
        );
        file.fullname = fullname;
        file.absPath = absPath;
      }
    } else {
      audioFilesName = audioFilesName.map((file) => ({
        ...file,
        absPath: path.join(audioFolderPath, file.fullname),
      }));
    }
    if (playlist) {
      playlist.push(...audioFilesName);
    } else {
      playlist = audioFilesName;
    }

    resolve();
  });
}

//
export async function getFilesNameByFolderPath(
  folderPath: PathLike,
  filterIn?: string | string[]
) {
  return new Promise(async (resolve, reject) => {
    let files: any = [];
    try {
      files = await fs.readdir(folderPath);
      if (filterIn) {
        files = files.filter((file: string) =>
          filterIn.includes(path.extname(file).toLowerCase())
        );
      }
      return resolve(files);
    } catch (error) {
      console.info("Path có vấn đề");
      return resolve(files);
    }
  });
}

// dont in-use or export
async function form(inputfile: any, outputAudioFile: any) {
  return new Promise(async (resolve, reject) => {});
}
