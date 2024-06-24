import { getMetadata } from "./ffmpegService";
import { formatDuration, removeFileExtension } from "./util";
import { PathLike, promises as fs } from "fs";
export async function durationExpand(files: any) {
  //time config
  let initStartTime = 0.0;
  let currentStartTime = 0.0;
  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    //@ts-ignore
    file.durationSecond = (await getMetadata(file.absPath)).duration;
    file.startTimeSecond = initStartTime + currentStartTime;
    file.startTimeFormat = formatDuration(file.startTimeSecond);
    currentStartTime += file.durationSecond;
  }
}

export async function createPlayListTimeFile(
  playlist: any[] | null,
  outputDocsFilePath: PathLike | fs.FileHandle
) {
  const listingMusicDocs = playlist
    ?.map((player: { startTimeFormat: string | any[]; name: any }) => {
      return player.startTimeFormat.concat(
        " ",
        removeFileExtension(player.name)
      );
    })
    .join("\n");

  // Ghi nội dung vào tệp
  await fs.writeFile(outputDocsFilePath, listingMusicDocs || [], {
    flag: "w",
  });
}
