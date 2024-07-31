import { createUniqueDirectory, moveFile } from "@/services/folderService";
import { promises as fs } from "fs";
import path from "path";

// import { createTmpAudioFile } from "@/services/ffmpegService";
import {
  audioFirstFolderName,
  createTmpAudioFile,
  createTmpAudioWavFile,
  createTmpScreenFile,
  getMetadata,
  getPlaylist,
  getPlaylistV2,
  getPlaylistVer2ExtraFill,
  mergeVideoWithAudio,
  standardizeAudio,
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
} from "@/services/util";

//init
const rootFolder = "E:\\hyu\\@CảNgàyNgheLofi";
const renderFolderPath = `${rootFolder}\\rendering`;
const audioFolderPath = `${rootFolder}\\lofi\\lofi trẻ - tổng hợp`;
// const videoFolderPath = `${rootFolder}\\screen`;
// const rssFolderPath = `${rootFolder}\\rss`;

const time = 7;
let playlistLength = 0;
const minPlaylistLength = 14;
const maxPlaylistLength = 17;
let highlightPickup = 0;
const minHighlightPickup = 4;
const maxHighlightPickup = 7;

export async function GET() {
  //set 7 first for a week
  await setFirstForWeak(audioFolderPath);

  const { folderPath, uniqueDirName } = await createUniqueDirectory(
    path.join(audioFolderPath, "first"),
    "used"
  );

  for (let index = 0; index < time; index++) {
    console.info(`${index + 1}/${time}_________________`);
    playlistLength = getRandomNumber(minPlaylistLength, maxPlaylistLength);
    highlightPickup = getRandomNumber(minHighlightPickup, maxHighlightPickup);
    await renderator(folderPath);
  }

  return Response.json({ rep: "run" });
}
async function renderator(firstUsedFolderPath?: string | undefined) {
  const { folderPath, uniqueDirName } = await createUniqueDirectory(
    renderFolderPath,
    "@cangaynghelofi"
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

  // // create en-description file
  // console.info("Bắt đầu tạo en-description docs.");
  // await createDescriptionFile(
  //   playlistFilePath,
  //   path.join(rssFolderPath, "en-description-template.txt")
  // );
  // console.info("\ten-description docs hoàn thành");

  // // create ads file
  // console.info("Bắt đầu tạo ads file.");
  // await insertAdsIntoPlaylist(playlistFilePath);
  // console.info("\tads file docs hoàn thành ");

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

  // // create screen for screen file
  // console.info("Bắt đầu tạo screen file.");
  // finalVideoFilePath =
  //   (await createTmpScreenFile(
  //     folderPath, //in-hand
  //     path.join(videoFolderPath, "formatted"), // đầu vào
  //     path.join(folderPath, "tmp_screen.mp4"), // đầu ra
  //     (
  //       await getMetadata(finalAudioFilePath)
  //     ).duration //thời lượng audio để sreen dc tạo ra fix với nó
  //   )) + "";
  // console.info("\tScreen file hoàn thành.");

  // //make final video
  // console.info("Bắt đầu tạo final video.");
  // await mergeVideoWithAudio(
  //   finalVideoFilePath,
  //   finalAudioFilePath,
  //   path.join(folderPath, `${uniqueDirName}.mp4`)
  // );
  // console.info("\tFinal video hoàn thành.\n");

  // await fs.unlink(path.join(folderPath, "tmp_screen.mp4"));
  // await fs.unlink(path.join(folderPath, "tmp_audio.wav"));

  //move first file to out of list
  await moveFile(
    path.join(firstUsedFolderPath + "", "..", playlist[0].name + ".wav"),
    path.join(firstUsedFolderPath + "", playlist[0].name + ".wav")
  );
  console.info("Dọn dẹp xong\n");

  // console.info("playlist: ", playlist);
}
