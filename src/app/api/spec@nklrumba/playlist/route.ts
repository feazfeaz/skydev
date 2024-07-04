// import { createTmpAudioFile } from "@/services/ffmpegService";
import {
  createExsoundFile,
  createTmpAudioFile,
  createTmpScreenFile,
  extractAudio,
  getMetadata,
  getPlaylistV2,
  mergeAudioFiles,
  mergeVideoWithAudio,
} from "@/services/ffmpegService";
import { createUniqueDirectory } from "@/services/folderService";
import { createPlayListTimeFile } from "@/services/songService";
import path from "path";
import { promises as fs } from "fs";
import { getFilesNameByFolderPath } from "@/services/playlistService";
import { getRandomNumber, removeFileExtension } from "@/services/util";
//init
const renderFolderPath = "E:\\hyu\\@nklrumba\\rendering";
const audioFolderPath = "E:\\hyu\\@nklrumba\\instru - slowed";
const videoFolderPath = "E:\\hyu\\@nklrumba\\screen";

const time = 2;
const playlistMinLength = 20;
const playlistMaxLength = 25;
const highlightPickup = 4;

export async function GET() {
  for (let index = 0; index < time; index++) {
    await renderator(getRandomNumber(playlistMinLength, playlistMaxLength));
  }

  return Response.json({ rep: "run" });
}

async function renderator(playlistLength: number) {
  const { folderPath, uniqueDirName } = await createUniqueDirectory(
    renderFolderPath,
    "@nklrumba-list"
  );
  // getting playlist
  let playlist = await getPlaylistV2(
    audioFolderPath,
    playlistLength,
    highlightPickup
  );

  // create time line playlist
  console.info("Bắt đầu tạo time line docs.");
  await createPlayListTimeFile(playlist, path.join(folderPath, "playlist.txt"));
  console.info("\tTime line docs hoàn thành ");

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
