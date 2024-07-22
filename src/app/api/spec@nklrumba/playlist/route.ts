// import { createTmpAudioFile } from "@/services/ffmpegService";
import {
  audioFirstFolderName,
  createExsoundFile,
  createTmpAudioFile,
  createTmpScreenFile,
  extractAudio,
  getMetadata,
  getPlaylistV2,
  mergeAudioFiles,
  mergeVideoWithAudio,
} from "@/services/ffmpegService";
import { createUniqueDirectory, moveFile } from "@/services/folderService";
import { createPlayListTimeFile } from "@/services/songService";
import path from "path";
import { promises as fs } from "fs";
import { getFilesNameByFolderPath } from "@/services/playlistService";
import {
  createDescriptionFile,
  getRandomNumber,
  removeFileExtension,
} from "@/services/util";

//init
const rootFolder = "E:\\hyu\\@nklrumba";
const renderFolderPath = `${rootFolder}\\rendering`;
const audioFolderPath = `${rootFolder}\\instru - slowed`;
const videoFolderPath = `${rootFolder}\\screen`;
const rssFolderPath = `${rootFolder}\\rss`;

const time = 14;
let playlistLength = 0;
const minPlaylistLength = 20;
const maxPlaylistLength = 25;
let highlightPickup = 0;
const minHighlightPickup = 4;
const maxHighlightPickup = 7;

export async function GET() {
  const firstfile: object[] = await getFilesNameByFolderPath(
    path.join(audioFolderPath, "first")
  );

  if (firstfile.length == 0) {
    console.info("first file trống");
    for (let index = 0; index < time; index++) {
      playlistLength = getRandomNumber(minPlaylistLength, maxPlaylistLength);
      highlightPickup = getRandomNumber(minHighlightPickup, maxHighlightPickup);
      await renderator();
    }
  } else {
    const { folderPath, uniqueDirName } = await createUniqueDirectory(
      path.join(audioFolderPath, "first"),
      "used"
    );

    for (let index = 0; index < time; index++) {
      playlistLength = getRandomNumber(minPlaylistLength, maxPlaylistLength);
      highlightPickup = getRandomNumber(minHighlightPickup, maxHighlightPickup);
      await renderator(folderPath);
    }
  }

  return Response.json({ rep: "run" });
}

async function renderator(firstUsedFolderPath?: string | undefined) {
  const { folderPath, uniqueDirName } = await createUniqueDirectory(
    renderFolderPath,
    "@nklrumba-list"
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
    path.join(videoFolderPath, "formatted"), // đầu vào
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
  console.info("\tCleared!\t");

  // console.info("playlist: ", playlist);
}

// const exsoundNeedExtractAudio = await getFilesNameByFolderPath(
//   exsoundFolderPath,
//   ".mp4"
// );
// //@ts-ignore
// for (const mp4 of exsoundNeedExtractAudio) {
//   await extractAudio(
//     path.join(exsoundFolderPath, mp4),
//     path.join(exsoundFolderPath, `${removeFileExtension(mp4)}.wav`),
//     0.75
//   );
// }

// await mergeAudioFiles(
//   path.join(renderFolderPath, "1.wav"),
//   path.join(renderFolderPath, "bird.wav"),
//   path.join(renderFolderPath, "test.wav")
// );
