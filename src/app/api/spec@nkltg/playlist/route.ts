import { createUniqueDirectory } from "@/services/folderService";
import { promises as fs } from "fs";
import path from "path";

// import { createTmpAudioFile } from "@/services/ffmpegService";
import {
  createTmpAudioFile,
  createTmpScreenFile,
  getMetadata,
  getPlaylist,
  mergeVideoWithAudio,
} from "@/services/ffmpegService";
import { createPlayListTimeFile } from "@/services/songService";

//init
const renderFolderPath = "E:\\hyu\\@nkltg - storage\\rendering";
const audioFolderPath = "E:\\hyu\\@nkltg - storage\\instru";
const videoFolderPath = "E:\\hyu\\@nkltg - storage\\screen";

const time = 1;
const playlistLength = 22;
const highlightPickup = 5; // từ 5-7 là lý tưởng
const fillPickup = playlistLength - highlightPickup;

export async function GET() {
  for (let index = 0; index < time; index++) {
    await renderator();
  }

  return Response.json({ rep: "run" });
}

async function renderator() {
  const { folderPath, uniqueDirName } = await createUniqueDirectory(
    renderFolderPath,
    "@nkltg"
  );
  // getting playlist
  let playlist = await getPlaylist(
    audioFolderPath,
    playlistLength,
    highlightPickup
  );
  // create time line playlist
  console.dir("Bắt đầu tạo time line docs.");
  await createPlayListTimeFile(playlist, path.join(folderPath, "playlist.txt"));
  console.dir("\tTime line docs hoàn thành ");

  // create temporaty audio file
  console.dir("Bắt đầu tạo audio file.");
  await createTmpAudioFile(
    folderPath,
    playlist,
    path.join(folderPath, "tmp_audio.mp3")
  );
  console.dir("\tAudio file hoàn thành.");

  // create screen for screen file
  console.dir("Bắt đầu tạo screen file.");
  await createTmpScreenFile(
    folderPath, //in-hand
    path.join(videoFolderPath, "backgrouded"), // đầu vào
    path.join(folderPath, "tmp_screen.mp4"), // đầu ra
    (
      await getMetadata(path.join(folderPath, "tmp_audio.mp3"))
    ).duration //thời lượng audio để sreen dc tạo ra fix với nó
  );
  console.dir("\tScreen file hoàn thành.");

  //make final video
  console.dir("Bắt đầu tạo final video.");
  await mergeVideoWithAudio(
    path.join(folderPath, "tmp_screen.mp4"),
    path.join(folderPath, "tmp_audio.mp3"),
    path.join(folderPath, `${uniqueDirName}.mp4`)
  );
  console.dir("\tFinal video hoàn thành.");

  await fs.unlink(path.join(folderPath, "tmp_screen.mp4"));
  await fs.unlink(path.join(folderPath, "tmp_audio.mp3"));
  console.dir("Dọn dẹp xong");
}
