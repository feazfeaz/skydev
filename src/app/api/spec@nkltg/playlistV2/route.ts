import {
  createUniqueDirectory,
  isExist,
  moveFile,
} from "@/services/folderService";
import { promises as fs } from "fs";
import path from "path";

// import { createTmpAudioFile } from "@/services/ffmpegService";
import {
  audioFirstFolderName,
  createTmpAudioFile,
  createTmpScreenFile,
  getMetadata,
  getPlaylist,
  getPlaylistV2,
  mergeVideoWithAudio,
} from "@/services/ffmpegService";
import { createPlayListTimeFile } from "@/services/songService";
import { getFilesNameByFolderPath } from "@/services/playlistService";
import { createDescriptionFile } from "@/services/util";

//init
const rootFolder = "E:\\hyu\\@nkltg - storage";
const renderFolderPath = `${rootFolder}\\rendering`;
const audioFolderPath = `${rootFolder}\\instruVer2`;
const videoFolderPath = `${rootFolder}\\screen`;
const rssFolderPath = `${rootFolder}\\rss`;

const time = 1;
const playlistLength = 22;
const highlightPickup = 5; // từ 5-7 là lý tưởng
const fillPickup = playlistLength - highlightPickup;

export async function GET() {
  const firstfile: object[] = await getFilesNameByFolderPath(
    path.join(audioFolderPath, "first")
  );

  if (firstfile.length == 0) {
    console.info("first file trống");
    for (let index = 0; index < time; index++) {
      await renderator();
    }
  } else {
    const { folderPath, uniqueDirName } = await createUniqueDirectory(
      path.join(audioFolderPath, "first"),
      "used"
    );
    for (let index = 0; index < time; index++) {
      await renderator(folderPath);
    }
  }

  return Response.json({ rep: "run" });
}

async function renderator(firstUsedFolderPath?: string | undefined) {
  const { folderPath, uniqueDirName } = await createUniqueDirectory(
    renderFolderPath,
    "@nkltg"
  );

  // getting playlist
  let playlist = await getPlaylistV2(
    audioFolderPath,
    playlistLength,
    highlightPickup,
    firstUsedFolderPath
  );

  // create time line playlist
  console.info("Bắt đầu tạo time line docs.");
  const playlistFilePath = await createPlayListTimeFile(
    playlist,
    path.join(folderPath, "playlist.txt")
  );
  console.info("\tTime line docs hoàn thành ");

  // create en-description file
  console.info("Bắt đầu tạo en-description docs.");
  await createDescriptionFile(
    playlistFilePath,
    path.join(rssFolderPath, "en-description-template.txt")
  );
  console.info("\ten-description docs hoàn thành ");

  // create temporaty audio file
  console.info("Bắt đầu tạo audio file.");
  await createTmpAudioFile(
    folderPath,
    playlist,
    path.join(folderPath, "tmp_audio.mp3")
  );
  console.info("\tAudio file hoàn thành.");

  // create screen for screen file
  console.info("Bắt đầu tạo screen file.");
  await createTmpScreenFile(
    folderPath, //in-hand
    path.join(videoFolderPath, "backgrouded"), // đầu vào
    path.join(folderPath, "tmp_screen.mp4"), // đầu ra
    (
      await getMetadata(path.join(folderPath, "tmp_audio.mp3"))
    ).duration //thời lượng audio để sreen dc tạo ra fix với nó
  );
  console.info("\tScreen file hoàn thành.");

  //make final video
  console.info("Bắt đầu tạo final video.");
  await mergeVideoWithAudio(
    path.join(folderPath, "tmp_screen.mp4"),
    path.join(folderPath, "tmp_audio.mp3"),
    path.join(folderPath, `${uniqueDirName}.mp4`)
  );
  console.info("\tFinal video hoàn thành.");

  await fs.unlink(path.join(folderPath, "tmp_screen.mp4"));
  await fs.unlink(path.join(folderPath, "tmp_audio.mp3"));
  //move first file to out of list
  await moveFile(
    path.join(audioFolderPath, audioFirstFolderName, playlist[0].name + ".mp3"),
    // playlist[0].absPath,
    path.join(firstUsedFolderPath + "", playlist[0].name + ".mp3")
  );
  console.info("Dọn dẹp xong");
}
