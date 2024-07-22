// import { createTmpAudioFile } from "@/services/ffmpegService";
import {
  audioFirstFolderName,
  createExsoundFile,
  createTmpAudioFile,
  createTmpAudioWavFile,
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
  insertAdsIntoPlaylist,
  removeFileExtension,
} from "@/services/util";
//init
const rootFolder = "E:\\hyu\\@nhạctrữtình-bolero";
const renderFolderPath = `${rootFolder}\\rendering`;
const audioFolderPath = `${rootFolder}\\instru`;
const videoFolderPath = `${rootFolder}\\screen`;
const exsoundFolderPath = `${rootFolder}\\exsound`;
const rssFolderPath = `${rootFolder}\\rss`;

const time = 14;
let playlistLength = 0;
const minPlaylistLength = 14;
const maxPlaylistLength = 17;
let highlightPickup = 0;
const minHighlightPickup = 4;
const maxHighlightPickup = 7;

export async function GET() {
  // await createSeoDescriptionFile();
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
    "@nhactrutinh-bolero"
  );

  let finalAudioFilePath = "";
  let finalVideoFilePath = "";
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
  console.info("\ten-description docs hoàn thành");

  // create en-description file
  console.info("Bắt đầu tạo ads file.");
  await insertAdsIntoPlaylist(playlistFilePath);
  console.info("\tads file docs hoàn thành ");

  // create temporaty audio file
  console.info("Bắt đầu tạo audio file.");
  finalAudioFilePath =
    (await createTmpAudioWavFile(
      folderPath,
      playlist,
      path.join(folderPath, "tmp_audio.wav")
    )) + "";
  console.info("\tAudio file hoàn thành.");

  // // create exsound sound
  // // need fix
  // console.info("Bắt đầu tạo exsound file.");
  // await createExsoundFile(
  //   folderPath, //in-hand
  //   path.join(exsoundFolderPath), // đầu vào
  //   path.join(folderPath, "tmp_exsound.wav"), // đầu ra
  //   (
  //     await getMetadata(path.join(folderPath, "tmp_audio.wav"))
  //   ).duration //thời lượng audio để sreen dc tạo ra fix với nó
  // );
  // console.info("\tExsound file hoàn thành.");

  // // merge ex sound to audio
  // finalAudioFilePath =
  //   (await mergeAudioFiles(
  //     path.join(folderPath, "tmp_audio.wav"),
  //     path.join(folderPath, "tmp_exsound.wav"),
  //     path.join(folderPath, "tmp_final_audio.wav")
  //   )) + "";

  // create screen for screen file
  console.info("Bắt đầu tạo screen file.");
  finalVideoFilePath =
    (await createTmpScreenFile(
      folderPath, //in-hand
      path.join(videoFolderPath, "formatted"), // đầu vào
      path.join(folderPath, "tmp_screen.mp4"), // đầu ra
      (
        await getMetadata(finalAudioFilePath)
      ).duration //thời lượng audio để sreen dc tạo ra fix với nó
    )) + "";
  console.info("\tScreen file hoàn thành.");

  //make final video
  console.info("Bắt đầu tạo final video.");
  await mergeVideoWithAudio(
    finalVideoFilePath,
    finalAudioFilePath,
    path.join(folderPath, `${uniqueDirName}.mp4`)
  );
  console.info("\tFinal video hoàn thành.\n");

  await fs.unlink(path.join(folderPath, "tmp_screen.mp4"));
  await fs.unlink(path.join(folderPath, "tmp_audio.wav"));

  //move first file to out of list
  await moveFile(
    path.join(audioFolderPath, audioFirstFolderName, playlist[0].name + ".wav"),
    // playlist[0].absPath,
    path.join(firstUsedFolderPath + "", playlist[0].name + ".wav")
  );

  // console.info("playlist: ", playlist);
}
