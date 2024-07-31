import path from "path";
import {
  audioFirstFolderName,
  audioHighlightFolderName,
  getMetadata,
} from "./ffmpegService";
import { copyFiles, getTwoLatestDirectories } from "./folderService";
import { getFilesNameByFolderPath } from "./playlistService";
import {
  formatDuration,
  getRandomNumber,
  removeFileExtension,
  shuffleArray,
} from "./util";
import { PathLike, promises as fs } from "fs";
export async function durationExpand(files: any) {
  //time config
  let initStartTime = 0.0;
  let currentStartTime = 0.0;
  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    //@ts-ignore
    file.durationSecond = (await getMetadata(file.absPath)).duration;
    file.startTimeSecond = initStartTime + currentStartTime;
    file.startTimeFormat = formatDuration(file.startTimeSecond);
    currentStartTime += file.durationSecond;
  }
}

export async function createPlayListTimeFile(
  playlist: any[] | null,
  outputDocsFilePath: PathLike | fs.FileHandle
) {
  const listingMusicDocs = playlist
    ?.map((player: { startTimeFormat: string | any[]; name: any }) => {
      return player.startTimeFormat.concat(
        " ",
        removeFileExtension(player.name)
      );
    })
    .join("\n");

  // Ghi nội dung vào tệp
  await fs.writeFile(outputDocsFilePath, listingMusicDocs || [], {
    flag: "w",
  });

  return outputDocsFilePath;
}

export async function setFirstForWeak(audioFolderPath: string) {
  const firstFolderPath = path.join(audioFolderPath, audioFirstFolderName);
  const highlightFolderPath = path.join(
    audioFolderPath,
    audioHighlightFolderName
  );
  const fillFolderPath = path.join(audioFolderPath);
  const firstsSelected = [];

  // get 2 newest history-folders
  const folders = await getTwoLatestDirectories(firstFolderPath);
  //get songs from that folders
  const audiosUsed: object[] = [];
  if (folders) {
    for (const folder of folders) {
      audiosUsed.push(...(await getFilesNameByFolderPath(folder)));
    }
  }
  //first
  const firstAudio = await getFilesNameByFolderPath(firstFolderPath, [
    ".mp3",
    ".wav",
  ]);
  if (firstAudio.length >= 7) {
    console.info("First đã được chuẩn bị đầy đủ, không cần bổ xung gì thêm!");
    return;
  } else {
    firstsSelected.push(...firstAudio);
    console.info("First không đủ đang chuẩn bị");
  }

  if (firstAudio.length == 0) {
    console.info(
      "First hoàn toàn rỗng, 7 first sẽ dc chọn từ highlight lẫn fill"
    );
    //highlight
    let audioHighlight = (
      await getFilesNameByFolderPath(highlightFolderPath, [".mp3", ".wav"])
    ).filter((audioHighlightFileName: any) => {
      return !audiosUsed.some(
        (filename: any) => filename === audioHighlightFileName
      );
    });
    audioHighlight = shuffleArray(audioHighlight).slice(
      0,
      2
      // getRandomNumber(2, 3)
    );
    //fill
    let audioFill = (
      await getFilesNameByFolderPath(fillFolderPath, [".mp3", ".wav"])
    )
      .filter((audioFillFileName: any) => {
        return !audiosUsed.some(
          (filename: any) => filename === audioFillFileName
        );
      })
      .filter((audioFillFileName: any) => {
        return !audioHighlight.some(
          (filename: any) => filename === audioFillFileName
        );
      });
    audioFill = shuffleArray(audioFill).slice(0, 7 - audioHighlight.length);

    firstsSelected.push(...audioHighlight);
    firstsSelected.push(...audioFill);
  } else {
    console.info("First có, nhưng không đủ 7 bài, first sẽ dc bổ xung từ fill");

    //fill
    let audioFill = (
      await getFilesNameByFolderPath(fillFolderPath, [".mp3", ".wav"])
    ).filter((audioFillFileName: any) => {
      return !audiosUsed.some(
        (filename: any) => filename === audioFillFileName
      );
    });
    audioFill = shuffleArray(audioFill).slice(0, 7 - firstAudio.length);

    firstsSelected.push(...audioFill);
  }
  await copyFiles(
    { folderPath: audioFolderPath, fileNames: firstsSelected },
    {
      folderPath: firstFolderPath,
    }
  );
}
