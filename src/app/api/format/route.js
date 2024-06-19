import ffmpeg from "fluent-ffmpeg";
import path from "path";
import { promises as fs } from "fs";
import { parseFile } from "music-metadata";
import {
  removeFileExtension,
  shuffleArray,
  formatDuration,
  myMkdir,
} from "@/services/util";

ffmpeg.setFfmpegPath(
  process
    .cwd()
    .concat("\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe")
);

ffmpeg.setFfprobePath(
  process
    .cwd()
    .concat("\\node_modules\\ffprobe-static\\bin\\win32\\x64\\ffprobe.exe")
);

export async function GET() {
  const __dirname = `E:\\hyu\\storage\\rendering`;

  // Đường dẫn đến video đầu vào và video nền
  const landscapeVideoPath = path.join(__dirname, "Trộm Nhìn Nhau.mp4");
  const musicWaveVideoPath = path.join(__dirname, "background.mp4");
  const outputVideoPath = path.join(__dirname, "output.mp4");
  const audioOutputPath = path.join(__dirname, "audio-from-landscape.wav");
  const finalVideoPath = path.join(__dirname, "final_output.mp4");

  ffmpeg()
    .input(landscapeVideoPath)
    .output(audioOutputPath)
    .audioCodec("pcm_s16le") // Chọn codec âm thanh (PCM 16-bit Little Endian)
    .on("end", () => {
      console.log("Audio extraction finished!");
      // Sau khi tách audio xong, tiếp tục sang Bước 2
      mergeVideos();
    })
    .on("error", (err) => {
      console.error("Error extracting audio:", err);
    })
    .run();

  function mergeVideos() {
    ffmpeg()
      .input(landscapeVideoPath)
      .input(musicWaveVideoPath)
      .complexFilter([
        // Tách nền đen từ video sóng nhạc
        "[1:v]colorkey=black:0.1:0.1[ckout]",
        // Overlay sóng nhạc lên video phong cảnh
        "[0:v][ckout]overlay[out]",
      ])
      .outputOptions("-map", "[out]")
      .output(outputVideoPath)
      .on("end", () => {
        console.log("Video merging finished!");
        // Sau khi ghép video xong, tiếp tục sang Bước 3
        mergeAudioWithVideo();
      })
      .on("error", (err) => {
        console.error("Error merging videos:", err);
      })
      .run();
  }

  function mergeAudioWithVideo() {
    // const outputVideoPath = "output/path/output-video.mp4";
    // const finalAudioPath = "output/path/audio-from-landscape.wav"; // Đường dẫn audio từ Bước 1

    ffmpeg(outputVideoPath)
      .input(audioOutputPath)
      .outputOptions("-c:v", "copy", "-map", "0:v:0", "-map", "1:a:0")
      .audioCodec("aac")
      .on("start", (cmd) => {
        console.error("End product started!");
      })
      .on("error", (err) => {
        console.error("An error occurred: " + err.message);
      })
      .on("end", () => {
        console.log("End product finish!");
      })
      .save(finalVideoPath);

    // ffmpeg()
    //   .input(outputVideoPath)
    //   .input(audioOutputPath)
    //   .outputOptions("-shortest") // Đảm bảo độ dài của output video bằng video ngắn nhất
    //   .videoCodec("copy") // Sử dụng cùng codec video như video output từ Bước 2
    //   .audioCodec("aac") // Sử dụng AAC cho âm thanh
    //   .output(finalVideoPath)
    //   .on("end", () => {
    //     console.log("Final video processing finished!");
    //   })
    //   .on("error", (err) => {
    //     console.error("Error merging audio with video:", err);
    //   })
    //   .run();
  }

  // // Lệnh ffmpeg để tách nền đen từ video sóng nhạc và overlay lên video phong cảnh
  // ffmpeg()
  //   .input(landscapeVideoPath)
  //   .input(musicWaveVideoPath)
  //   .complexFilter([
  //     "[1:v]colorkey=black:0.3:0.1[ckout]", // Tách nền đen từ video sóng nhạc
  //     "[0:v][ckout]overlay[out]", // Overlay sóng nhạc lên video phong cảnh
  //   ])
  //   .outputOptions("-map", "[out]")
  //   .output(outputVideoPath)
  //   .on("end", () => {
  //     console.log("Processing finished!");
  //   })
  //   .on("error", (err) => {
  //     console.error("Error:", err);
  //   })
  //   .run();

  // ffmpeg()
  //   .input(landscapeVideoPath)
  //   .input(musicWaveVideoPath)
  //   .complexFilter([
  //     "[1:v]chromakey=black:0.1:0.2[waveform]", // Tách nền đen của video sóng nhạc
  //     "[0:v][waveform]overlay=W-w-10:H-h-10", // Ghép sóng nhạc vào góc dưới bên phải của video phong cảnh
  //   ])
  //   .outputOptions("-map", "0:a") // Giữ lại âm thanh từ video phong cảnh
  //   .on("start", function (commandLine) {
  //     console.log("Spawned Ffmpeg with command: " + commandLine);
  //   })
  //   .on("error", function (err, stdout, stderr) {
  //     console.error("Error: " + err.message);
  //     console.error("ffmpeg stderr: " + stderr);
  //   })
  //   .on("end", function () {
  //     console.log("Merging finished !");
  //   })
  //   .save(outputVideo);

  // ffmpeg()
  //   .input(landscapeVideoPath)
  //   .input(musicWaveVideoPath)
  //   .complexFilter([
  //     "[1:v]colorkey=black:0.3:0.1[ckout]", // Tách nền đen từ video sóng nhạc
  //     {
  //       filter: "loop",
  //       options: {
  //         loop: -1, // Lặp vô hạn
  //         size: 1, // Lặp lại mỗi frame
  //       },
  //       inputs: "ckout",
  //       outputs: "ckout_loop",
  //     },
  //     "[0:v][ckout_loop]overlay=shortest=1[out]", // Overlay sóng nhạc lên video phong cảnh, dừng khi video phong cảnh kết thúc
  //   ])
  //   .outputOptions("-map", "[out]")
  //   .output(outputVideoPath)
  //   .on("end", () => {
  //     console.log("Processing finished!");
  //   })
  //   .on("error", (err) => {
  //     console.error("Error:", err);
  //   })
  //   .run();

  // // Hàm lấy thông tin duration của video
  // const getVideoDuration = (videoPath) => {
  //   return new Promise((resolve, reject) => {
  //     ffmpeg.ffprobe(videoPath, (err, metadata) => {
  //       if (err) return reject(err);
  //       resolve(metadata.format.duration);
  //     });
  //   });
  // };

  // // Xử lý video
  // const processVideos = async () => {
  //   try {
  //     const landscapeDuration = await getVideoDuration(landscapeVideoPath);
  //     const musicWaveDuration = await getVideoDuration(musicWaveVideoPath);

  //     let ffmpegCommand = ffmpeg()
  //       .input(landscapeVideoPath)
  //       .input(musicWaveVideoPath);

  //     if (landscapeDuration >= musicWaveDuration) {
  //       // Lặp lại video sóng nhạc để khớp với video phong cảnh
  //       ffmpegCommand = ffmpegCommand.complexFilter([
  //         "[1:v]colorkey=black:0.3:0.1,loop=-1:size=0:start=0,setpts=N/FRAME_RATE/TB[ckout]", // Tách nền đen và lặp video sóng nhạc
  //         `[0:v][ckout]overlay=shortest=1[out]`, // Overlay sóng nhạc lên video phong cảnh, dừng khi video phong cảnh kết thúc
  //       ]);
  //     } else {
  //       // Cắt video sóng nhạc để khớp với video phong cảnh
  //       ffmpegCommand = ffmpegCommand.complexFilter([
  //         `[1:v]colorkey=black:0.3:0.1,trim=duration=${landscapeDuration},setpts=PTS-STARTPTS[ckout]`, // Tách nền đen và cắt video sóng nhạc
  //         `[0:v][ckout]overlay=shortest=1[out]`, // Overlay sóng nhạc lên video phong cảnh
  //       ]);
  //     }

  //     ffmpegCommand
  //       .outputOptions("-map", "[out]")
  //       .output(outputVideoPath)
  //       .on("end", () => {
  //         console.log("Processing finished!");
  //       })
  //       .on("error", (err) => {
  //         console.error("Error:", err);
  //       })
  //       .run();
  //   } catch (err) {
  //     console.error("Error:", err);
  //   }
  // };

  // processVideos();

  return Response.json({ rep: "run" });
}

export async function getMetadata(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) =>
      err ? reject(err) : resolve(metadata.format)
    );
  });
}

export async function POST(request) {
  const { folder } = await request.json();

  if (!folder) {
    return Response.json({ rep: -1 });
  }
  const formattedPath = path.join(folder, "formatted");
  await myMkdir(formattedPath);
  const formattedFiles = await fs.readdir(formattedPath);

  const trashPath = path.join(folder, "trash");
  await myMkdir(trashPath);
  const trashFiles = await fs.readdir(trashPath);

  const files = await fs.readdir(folder);
  const filesNotFormatedMp4 = await files
    .filter((file) => [".mp4"].includes(path.extname(file).toLowerCase()))
    .filter((file) => !formattedFiles.includes(file))
    .filter((file) => !trashFiles.includes(file))
    .map((file) => {
      return {
        name: removeFileExtension(file),
        fullName: file,
        absPath: path.join(folder, file),
      };
    });
  if (filesNotFormatedMp4.length) {
    recursiveffmpeg(folder, filesNotFormatedMp4);
  } else {
    console.dir("Không có file cần format!");
  }

  return Response.json({ rep: "run" });
}

function recursiveffmpeg(folder, filesNotFormatedMp4) {
  subRecursiveffmpeg(
    folder,
    filesNotFormatedMp4,
    1,
    filesNotFormatedMp4.length
  );

  function subRecursiveffmpeg(
    folder,
    filesNotFormatedMp4,
    currentIndex,
    lengthFile
  ) {
    const curFile = filesNotFormatedMp4.shift();
    const inputFile = path.join(folder, curFile.fullName);
    const outputFile = path.join(folder, "formatted", curFile.fullName);
    ffmpeg(inputFile)
      .outputOptions(
        "-safe",
        "1",
        "-r",
        "30",
        "-s",
        "1920x1080",
        "-c:v",
        "libx264",
        "-b:v",
        "10000k",
        "-c:a",
        "copy"
      )
      .on("start", (cmd) => {
        console.dir(
          `${currentIndex}/${lengthFile} - Format on '${curFile.name}'`
        );
      })
      .on("error", (err) => {
        console.error(`Error happend on ${curFile.name}. We move it to trash!`);
        fs.copyFile(curFile.absPath, path.join(folder, "trash"));
        if (currentIndex < lengthFile) {
          subRecursiveffmpeg(
            folder,
            filesNotFormatedMp4,
            ++currentIndex,
            lengthFile
          );
        } else {
          console.dir("kết thúc format");
        }
      })
      .on("end", () => {
        if (currentIndex < lengthFile) {
          subRecursiveffmpeg(
            folder,
            filesNotFormatedMp4,
            ++currentIndex,
            lengthFile
          );
        } else {
          console.dir("kết thúc format");
        }
      })
      .save(outputFile);
  }
}
