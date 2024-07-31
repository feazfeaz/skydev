import {
  createUniqueDirectory,
  getTwoLatestDirectories,
  moveFile,
} from "@/services/folderService";
import { promises as fs } from "fs";
import path from "path";

// import { createTmpAudioFile } from "@/services/ffmpegService";
import {
  audioFirstFolderName,
  audioHighlightFolderName,
  createTmpAudioFile,
  createTmpScreenFile,
  getMetadata,
  getPlaylist,
  getPlaylistV2,
  mergeVideoWithAudio,
} from "@/services/ffmpegService";
import {
  createPlayListTimeFile,
  setFirstForWeak,
} from "@/services/songService";
import { getFilesNameByFolderPath } from "@/services/playlistService";
import {
  createDescriptionFile,
  getRandomNumber,
  insertAdsIntoPlaylist,
  shuffleArray,
} from "@/services/util";

//init
const rootFolder = "E:\\hyu\\@nkltg - storage";
const renderFolderPath = `${rootFolder}\\rendering`;
const audioFolderPath = `${rootFolder}\\instruVer2`;
const videoFolderPath = `${rootFolder}\\screen`;
const rssFolderPath = `${rootFolder}\\rss`;

const time = 7;
let playlistLength = 0;
// const minPlaylistLength = 20;
const minPlaylistLength = 22;
const maxPlaylistLength = 24;
let highlightPickup = 0;
const minHighlightPickup = 4;
// const maxHighlightPickup = 7;
const maxHighlightPickup = 4;

export async function GET() {
  //set 7 first for a week
  await setFirstForWeak(audioFolderPath);

  const { folderPath, uniqueDirName } = await createUniqueDirectory(
    path.join(audioFolderPath, "first"),
    "used"
  );

  for (let index = 0; index < time; index++) {
    console.info(`\n${index + 1}/${time}_________________`);
    playlistLength = getRandomNumber(minPlaylistLength, maxPlaylistLength);
    highlightPickup = getRandomNumber(minHighlightPickup, maxHighlightPickup);
    await renderator(folderPath);
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

  // create en-description file
  console.info("Bắt đầu tạo ads file.");
  await insertAdsIntoPlaylist(playlistFilePath);
  console.info("\tads file docs hoàn thành ");

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
    path.join(firstUsedFolderPath + "", "..", playlist[0].name + ".mp3"),
    path.join(firstUsedFolderPath + "", playlist[0].name + ".mp3")
  );
  console.info("Dọn dẹp xong\n");
}
