import {
  createExsoundFile,
  extractAudio,
  getMetadata,
  mergeAudioFiles,
} from "@/services/ffmpegService";
import path from "path";

//init
const renderFolderPath = "E:\\hyu\\@nhạctrữtình-bolero\\rendering";
const audioFolderPath = "E:\\hyu\\@nhạctrữtình-bolero\\instru";
const videoFolderPath = "E:\\hyu\\@nhạctrữtình-bolero\\screen";
const exsoundFolderPath = "E:\\hyu\\@nhạctrữtình-bolero\\exsound";

export async function GET() {
  const folderPath = "E:\\hyu\\@nhạctrữtình-bolero\\rendering\\asd";
  // create exsound sound
  // need fix

  const musicAudioFilePath = await extractAudio(
    path.join("E:\\hyu\\@nhạctrữtình-bolero\\rendering\\asd", "1.mp3")
  );

  console.log("audioWavFilePath: ", musicAudioFilePath);
  const { duration } = await getMetadata(musicAudioFilePath);
  console.log("duration: ", duration);

  console.info("Bắt đầu tạo exsound file.");
  const audioWavFilePath = await createExsoundFile(
    folderPath, //in-hand
    path.join(exsoundFolderPath), // đầu vào
    path.join(folderPath, "tmp_exsound.wav"), // đầu ra
    duration //thời lượng audio để sreen dc tạo ra fix với nó
  );
  console.info("\tExsound file hoàn thành.");

  await mergeAudioFiles(
    musicAudioFilePath,
    audioWavFilePath,
    path.join(folderPath, "idk.wav")
  );

  return Response.json({ rep: "run" });
}
