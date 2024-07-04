import {
  createUniqueDirectory,
  isExist,
  getFileNameRemoveMarks,
  getFileNameRawMarks,
} from "@/services/folderService";
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
import { removeFileExtension } from "@/services/util";

//init
const renderFolderPath = "E:\\hyu\\@nkltg - storage\\rendering";
const audioFolderPath = "E:\\hyu\\@nkltg - storage\\instru";
const videoFolderPath = "E:\\hyu\\@nkltg - storage\\screen";

export async function GET() {
  const soloFolderPath = path.join(audioFolderPath, "solo");
  const firstoffFolderPath = path.join(audioFolderPath, "firstoff");
  //check solo folder
  if (!(await isExist(soloFolderPath))) {
    return Response.json({ msg: "Không tồn tại thư mục solo!" });
  }
  //get solo list need to make video
  const solofile = (await fs.readdir(soloFolderPath)).filter((file) =>
    [".mp3"].includes(path.extname(file).toLowerCase())
  );
  //get music version firstoff list
  let firstoffFilesNoMark: any[] = [];
  if (await isExist(firstoffFolderPath)) {
    firstoffFilesNoMark = (await fs.readdir(firstoffFolderPath))
      .filter((file) => [".mp3"].includes(path.extname(file).toLowerCase()))
      .map(getFileNameRemoveMarks);
  }

  //check null
  if (!solofile.length) {
    return Response.json({
      msg: "Thư mực solo rỗng, pls bỏ bài nhạc mày muốn vào!",
    });
  }
  let index = 1;
  for (const file of solofile) {
    console.info(`${index++}/${solofile.length} ${file}`);

    //make rendered folder
    const { folderPath, uniqueDirName } = await createUniqueDirectory(
      renderFolderPath, //render root path
      "@nkltg-solo" // prefix
    );

    //is this music have version?
    let inuseFilePath = firstoffFilesNoMark.includes(file)
      ? path.join(
          // if yes
          firstoffFolderPath,
          await getFileNameRawMarks(file, firstoffFolderPath) // get file with full mark
        )
      : path.join(soloFolderPath, file); // if not, we take raw solo file

    // audio already cuz by it was solo, so we jump to make screen
    await createTmpScreenFile(
      folderPath, //in-hand
      path.join(videoFolderPath, "backgrouded"), // đầu vào
      path.join(folderPath, "tmp_screen.mp4"), // đầu ra
      (
        await getMetadata(inuseFilePath)
      ).duration //thời lượng audio để sreen dc tạo ra fix với nó
    );
    //merge video and audio together
    await mergeVideoWithAudio(
      path.join(folderPath, "tmp_screen.mp4"), //input video
      inuseFilePath, // input audio
      path.join(folderPath, `${removeFileExtension(file)}.mp4`) // output
    );

    //clean folder
    await fs.unlink(path.join(folderPath, "tmp_screen.mp4"));
  }

  return Response.json({ rep: "run" });
}
