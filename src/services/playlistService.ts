//@ts-nocheck
import ffmpeg from "fluent-ffmpeg";
import { PathLike, promises as fs } from "fs";
import path from "path";
import { myMkdir, removeFileExtension, shuffleArray } from "./util";
import { getFileByEitherFolder, getFileNameRawMarks } from "./folderService";
import { pickUp } from "./ffmpegService";

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
    )
      .map((fileFullName: any) => ({
        name: removeFileExtension(fileFullName),
        fullname: fileFullName,
      }))
      //is not exists on playlist
      .filter((audioFile: any) => {
        return !playlist.some(
          (playlistItem: any) => playlistItem.name === audioFile.name
        );
      });

    if (!audioFilesName.length) {
      resolve({ numberAudioAdded: 0 });
    }

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

    resolve({ numberAudioAdded: audioFilesName.length });
  });
}
//
export async function addPlaylistLofiVer2(
  playlist,
  audioFolderPaths, // Chuyển đổi thành string | string[]
  numberSongNeedToAdd,
  replaceAudioFolderPath = "",
  isOrder = false
) {
  return new Promise(async (resolve, reject) => {
    try {
      let audioFilesName = [];

      if (typeof audioFolderPaths === "string") {
        audioFolderPaths = [audioFolderPaths];
      }

      for (let audioFolderPath of audioFolderPaths) {
        const files = await getFilesNameByFolderPath(audioFolderPath, [
          ".mp3",
          ".wav",
        ]);
        audioFilesName.push(
          ...files.map((fileFullName) => ({
            name: removeFileExtension(fileFullName),
            fullname: fileFullName,
          }))
        );
      }

      // Lọc các bài hát không có trong playlist
      audioFilesName = audioFilesName.filter((audioFile) => {
        return !playlist.some(
          (playlistItem) => playlistItem.name === audioFile.name
        );
      });

      if (!audioFilesName.length) {
        resolve({ numberAudioAdded: 0 });
        return;
      }

      // Shuffle nếu không theo thứ tự
      if (!isOrder) {
        shuffleArray(audioFilesName);
      }

      // Lấy số lượng bài hát cần thêm
      if (audioFilesName.length > numberSongNeedToAdd) {
        audioFilesName = audioFilesName.slice(0, numberSongNeedToAdd);
      }

      // Thay thế đường dẫn tệp nếu cần
      if (replaceAudioFolderPath) {
        for (const file of audioFilesName) {
          const { fullname, absPath } = await getFileByEitherFolder(
            file.fullname,
            replaceAudioFolderPath, // replace source
            audioFolderPaths // root source
          );
          file.fullname = fullname;
          file.absPath = absPath;
        }
      } else {
        audioFilesName = audioFilesName.map((file) => ({
          ...file,
          absPath: path.join(audioFolderPaths[0], file.fullname),
        }));
      }

      if (playlist) {
        playlist.push(...audioFilesName);
      } else {
        playlist = audioFilesName;
      }

      resolve({ numberAudioAdded: audioFilesName.length });
    } catch (error) {
      reject(error);
    }
  });
}
//
export async function getFilesNameByFolderPath(
  folderPath: PathLike,
  filterIn?: string | string[]
): Promise<object[]> {
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
