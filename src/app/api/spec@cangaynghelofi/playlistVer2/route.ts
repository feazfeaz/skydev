import { createUniqueDirectory, moveFile } from "@/services/folderService";
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
  getPlaylistVer2ExtraFill,
  mergeVideoWithAudio,
  standardizeAudio,
} from "@/services/ffmpegService";
import { createPlayListTimeFile } from "@/services/songService";
import { getFilesNameByFolderPath } from "@/services/playlistService";
import {
  createDescriptionFile,
  getRandomNumber,
  insertAdsIntoPlaylist,
} from "@/services/util";

//init
const rootFolder = "E:\\hyu\\@CảNgàyNgheLofi";
const renderFolderPath = `${rootFolder}\\rendering`;
const audioFolderPath = `${rootFolder}\\instruVer2`;
const videoFolderPath = `${rootFolder}\\screen`;
const rssFolderPath = `${rootFolder}\\rss`;

const buiduycongFolderPath = `${rootFolder}\\lofi\\nhạc trẻ lofi\\Bùi Duy Công`;
const huonglyFolderPath = `${rootFolder}\\lofi\\nhạc trẻ lofi\\Hương Giang - Hương Ly`;
const baotranFolderPath = `${rootFolder}\\lofi\\nhạc trẻ lofi\\Bảo Trân`;
const nguyenthaoFolderPath = `${rootFolder}\\lofi\\nhạc trẻ lofi\\Nguyen Thao`;
const yetminFolderPath = `${rootFolder}\\lofi\\nhạc trẻ lofi\\yetmin`;

const urgentFillFolderPathFull = [
  {
    indexFolder: `${buiduycongFolderPath}\\highlight`,
    useFolder: `${buiduycongFolderPath}\\pick_up`,
  },
  {
    indexFolder: `${huonglyFolderPath}\\highlight`,
    useFolder: `${huonglyFolderPath}\\pick_up`,
  },
  {
    indexFolder: `${nguyenthaoFolderPath}`,
    useFolder: `${nguyenthaoFolderPath}\\pick_up`,
  },
  {
    indexFolder: `${yetminFolderPath}\\highlight`,
    useFolder: `${yetminFolderPath}\\pick_up`,
  },
];

export async function GET() {
  // const baotranFirstFolderPath = (
  //   await createUniqueDirectory(path.join(baotranFolderPath, "first"), "used")
  // ).folderPath;
  // await baotranRender(baotranFirstFolderPath);

  // const buiduycongFirstFolderPath = (
  //   await createUniqueDirectory(
  //     path.join(buiduycongFolderPath, "first"),
  //     "used"
  //   )
  // ).folderPath;
  // await buiduycongRender(buiduycongFirstFolderPath);

  // const huonglyFirstFolderPath = (
  //   await createUniqueDirectory(path.join(huonglyFolderPath, "first"), "used")
  // ).folderPath;
  // await huonglyRender(huonglyFirstFolderPath);

  const yetminFirstFolderPath = (
    await createUniqueDirectory(path.join(yetminFolderPath, "first"), "used")
  ).folderPath;
  await yetminRender(yetminFirstFolderPath);

  // await standardizeAudioRoute();

  return Response.json({ rep: "run" });
}

async function standardizeAudioRoute() {
  const folderRead = path.join(nguyenthaoFolderPath, "");
  const as = await getFilesNameByFolderPath(folderRead, [".mp3", ".wav"]);
  for (const a of as) {
    await standardizeAudio(
      path.join(folderRead, a + ""),
      path.join(nguyenthaoFolderPath, "pick_up", a + "")
    );
  }
}

//
async function baotranRender(firstUsedFolderPath: string | undefined) {
  const { folderPath, uniqueDirName } = await createUniqueDirectory(
    renderFolderPath,
    "@CảNgàyNgheLofi-baotran"
  );
  // getting playlist
  let playlist = await getPlaylistVer2ExtraFill(
    baotranFolderPath,
    15,
    3,
    urgentFillFolderPathFull,
    firstUsedFolderPath
  );

  // create time line playlist
  console.info("Bắt đầu tạo time line docs.");
  const playlistFilePath = await createPlayListTimeFile(
    playlist,
    path.join(folderPath, "playlist.txt")
  );
  console.info("\tTime line docs hoàn thành ");

  // // create Ads file
  // console.info("Bắt đầu tạo ads file.");
  // await insertAdsIntoPlaylist(playlistFilePath);
  // console.info("\tads file docs hoàn thành ");

  // create temporaty audio file
  console.info("Bắt đầu tạo audio file.");
  await createTmpAudioFile(
    folderPath,
    playlist,
    path.join(folderPath, "tmp_audio.wav")
  );
  console.info("\tAudio file hoàn thành.");

  // // create screen for screen file
  // console.info("Bắt đầu tạo screen file.");
  // await createTmpScreenFile(
  //   folderPath, //in-hand
  //   path.join(videoFolderPath, "backgrouded"), // đầu vào
  //   path.join(folderPath, "tmp_screen.mp4"), // đầu ra
  //   (
  //     await getMetadata(path.join(folderPath, "tmp_audio.mp3"))
  //   ).duration //thời lượng audio để sreen dc tạo ra fix với nó
  // );
  // console.info("\tScreen file hoàn thành.");

  // //make final video
  // console.info("Bắt đầu tạo final video.");
  // await mergeVideoWithAudio(
  //   path.join(folderPath, "tmp_screen.mp4"),
  //   path.join(folderPath, "tmp_audio.mp3"),
  //   path.join(folderPath, `${uniqueDirName}.mp4`)
  // );
  // console.info("\tFinal video hoàn thành.");

  // await fs.unlink(path.join(folderPath, "tmp_screen.mp4"));
  // await fs.unlink(path.join(folderPath, "tmp_audio.wav"));

  //move first file to out of list
  await moveFile(
    path.join(firstUsedFolderPath + "", "..", playlist[0].fullname),
    path.join(firstUsedFolderPath + "", playlist[0].fullname)
  );
  console.info("Dọn dẹp xong\n");
}
//
async function buiduycongRender(firstUsedFolderPath: string | undefined) {
  const { folderPath, uniqueDirName } = await createUniqueDirectory(
    renderFolderPath,
    "@CảNgàyNgheLofi-buiduycong"
  );
  // getting playlist
  let playlist = await getPlaylistVer2ExtraFill(
    buiduycongFolderPath,
    15,
    3,
    urgentFillFolderPathFull,
    firstUsedFolderPath
  );

  // create time line playlist
  console.info("Bắt đầu tạo time line docs.");
  const playlistFilePath = await createPlayListTimeFile(
    playlist,
    path.join(folderPath, "playlist.txt")
  );
  console.info("\tTime line docs hoàn thành ");

  // // create Ads file
  // console.info("Bắt đầu tạo ads file.");
  // await insertAdsIntoPlaylist(playlistFilePath);
  // console.info("\tads file docs hoàn thành ");

  // create temporaty audio file
  console.info("Bắt đầu tạo audio file.");
  await createTmpAudioFile(
    folderPath,
    playlist,
    path.join(folderPath, "tmp_audio.wav")
  );
  console.info("\tAudio file hoàn thành.");

  //move first file to out of list
  await moveFile(
    path.join(firstUsedFolderPath + "", "..", playlist[0].fullname),
    path.join(firstUsedFolderPath + "", playlist[0].fullname)
  );
}
//
async function huonglyRender(firstUsedFolderPath: string | undefined) {
  const { folderPath, uniqueDirName } = await createUniqueDirectory(
    renderFolderPath,
    "@CảNgàyNgheLofi-huongly"
  );
  // getting playlist
  let playlist = await getPlaylistVer2ExtraFill(
    huonglyFolderPath,
    15,
    3,
    urgentFillFolderPathFull,
    firstUsedFolderPath
  );

  // create time line playlist
  console.info("Bắt đầu tạo time line docs.");
  const playlistFilePath = await createPlayListTimeFile(
    playlist,
    path.join(folderPath, "playlist.txt")
  );
  console.info("\tTime line docs hoàn thành ");

  // // create Ads file
  // console.info("Bắt đầu tạo ads file.");
  // await insertAdsIntoPlaylist(playlistFilePath);
  // console.info("\tads file docs hoàn thành ");

  // create temporaty audio file
  console.info("Bắt đầu tạo audio file.");
  await createTmpAudioFile(
    folderPath,
    playlist,
    path.join(folderPath, "tmp_audio.wav")
  );
  console.info("\tAudio file hoàn thành.");

  //move first file to out of list
  await moveFile(
    path.join(firstUsedFolderPath + "", "..", playlist[0].fullname),
    path.join(firstUsedFolderPath + "", playlist[0].fullname)
  );
}
//
async function yetminRender(firstUsedFolderPath: string | undefined) {
  const { folderPath, uniqueDirName } = await createUniqueDirectory(
    renderFolderPath,
    "@CảNgàyNgheLofi-yetmin"
  );
  // getting playlist
  let playlist = await getPlaylistVer2ExtraFill(
    yetminFolderPath,
    15,
    4,
    urgentFillFolderPathFull,
    firstUsedFolderPath
  );

  // create time line playlist
  console.info("Bắt đầu tạo time line docs.");
  const playlistFilePath = await createPlayListTimeFile(
    playlist,
    path.join(folderPath, "playlist.txt")
  );
  console.info("\tTime line docs hoàn thành ");

  // // create Ads file
  // console.info("Bắt đầu tạo ads file.");
  // await insertAdsIntoPlaylist(playlistFilePath);
  // console.info("\tads file docs hoàn thành ");

  // create temporaty audio file
  console.info("Bắt đầu tạo audio file.");
  await createTmpAudioFile(
    folderPath,
    playlist,
    path.join(folderPath, "tmp_audio.wav")
  );
  console.info("\tAudio file hoàn thành.");

  //move first file to out of list
  await moveFile(
    path.join(firstUsedFolderPath + "", "..", playlist[0].fullname),
    path.join(firstUsedFolderPath + "", playlist[0].fullname)
  );
}
