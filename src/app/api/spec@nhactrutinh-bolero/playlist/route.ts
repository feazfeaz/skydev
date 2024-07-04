// import { createTmpAudioFile } from "@/services/ffmpegService";
import {
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
import { createUniqueDirectory } from "@/services/folderService";
import { createPlayListTimeFile } from "@/services/songService";
import path from "path";
import { promises as fs } from "fs";
import { getFilesNameByFolderPath } from "@/services/playlistService";
import { removeFileExtension } from "@/services/util";
//init
const renderFolderPath = "E:\\hyu\\@nhạctrữtình-bolero\\rendering";
const audioFolderPath = "E:\\hyu\\@nhạctrữtình-bolero\\instru";
const videoFolderPath = "E:\\hyu\\@nhạctrữtình-bolero\\screen";
const exsoundFolderPath = "E:\\hyu\\@nhạctrữtình-bolero\\exsound";

const time = 0;
const playlistLength = 15;
// const highlightPickup = 5;

export async function GET() {
  // await createSeoDescriptionFile();

  for (let i = 0; i < time; i++) {
    await renderator();
  }

  return Response.json({ rep: "run" });
}

async function renderator() {
  const { folderPath, uniqueDirName } = await createUniqueDirectory(
    renderFolderPath,
    "@nhactrutinh-bolero"
  );

  let finalAudioFilePath = "";
  let finalVideoFilePath = "";
  // getting playlist
  let playlist = await getPlaylistV2(audioFolderPath, playlistLength);

  // create time line playlist
  console.info("Bắt đầu tạo time line docs.");
  await createPlayListTimeFile(playlist, path.join(folderPath, "playlist.txt"));
  console.info("\tTime line docs hoàn thành ");

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
  console.info("\tFinal video hoàn thành.");

  await fs.unlink(path.join(folderPath, "tmp_screen.mp4"));
  await fs.unlink(path.join(folderPath, "tmp_audio.wav"));

  // console.info("playlist: ", playlist);
}

async function createSeoDescriptionFile() {
  const file1Path = path.join(
    "E:\\hyu\\@nhạctrữtình-bolero\\rendering\\@nhactrutinh-bolero_08h50m04s_2024-07-04",
    "playlist.txt"
  ); // Thay bằng đường dẫn thực tế của file 1
  const file2Path = path.join(
    "E:\\hyu\\@nhạctrữtình-bolero\\rendering\\@nhactrutinh-bolero_08h50m04s_2024-07-04",
    "en-seo.txt"
  ); // Thay bằng đường dẫn thực tế của file 2
  const outputFilePath = path.join(
    "E:\\hyu\\@nhạctrữtình-bolero\\rendering\\@nhactrutinh-bolero_08h50m04s_2024-07-04",
    "en-seo-result.txt"
  ); // Đường dẫn lưu file kết quả

  try {
    // Đọc nội dung file 1
    const data1 = await fs.readFile(file1Path, { encoding: "utf8" });
    // Đọc nội dung file 2
    const data2 = await fs.readFile(file2Path, { encoding: "utf8" });

    // Thay thế <replace> trong file 2 bằng nội dung của file 1
    const newData = data2.toString().replace("<replace>", data1.toString());

    // Ghi kết quả vào file mới
    await fs.writeFile(outputFilePath, newData, "utf8");
    console.log("File has been created successfully.");
  } catch (error) {
    console.error("Error:", error);
  }
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
