//@ts-nocheck
import { promises as fs, PathLike } from "fs";
import path from "path";

export async function createUniqueDirectory(basePath: string, prefix?: string) {
  // Lấy thời gian hiện tại
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Tháng từ 0-11, nên cộng 1 và định dạng 2 chữ số
  const date = String(now.getDate()).padStart(2, "0"); // Ngày định dạng 2 chữ số
  const hours = String(now.getHours()).padStart(2, "0"); // Giờ định dạng 2 chữ số
  const minutes = String(now.getMinutes()).padStart(2, "0"); // Phút định dạng 2 chữ số
  const seconds = String(now.getSeconds()).padStart(2, "0");

  // Tạo tên thư mục
  const uniqueDirName = `${
    prefix || ""
  }_${year}${month}${date}_${hours}h${minutes}m${seconds}s`;

  // Tạo đường dẫn đầy đủ cho thư mục
  const newDirPath_ = path.join(basePath, uniqueDirName);

  // Tạo thư mục
  await mkdir(newDirPath_);

  // Trả về đường dẫn của thư mục mới tạo
  return { folderPath: newDirPath_, uniqueDirName };
}

async function mkdir(folderName: any) {
  try {
    await fs.mkdir(folderName, { recursive: true });
  } catch (err) {
    console.error(err);
  }
}

export async function isExist(pathPar: String, isFast: boolean = true) {
  if (isFast) {
    try {
      //@ts-ignore
      await fs.stat(pathPar, {}, () => {});
      return true;
    } catch (error) {
      return false;
    }
    return true;
  } else {
    return false;
  }
}

export async function getFileNameRawMarks(
  filename: string,
  folderPath: string
): Promise<string> {
  const files = await fs.readdir(folderPath);
  const baseName = getFileNameRemoveMarks(filename);

  for (const file of files) {
    const fileBaseName = getFileNameRemoveMarks(file);
    if (fileBaseName === baseName) {
      return file;
      // keep it for extend in need
      //   const match = file.match(/\[.*?\]/);
      //   if (match) {
      //     return `${baseName} ${match[0]}.mp3`;
      //   }
    }
  }

  return filename; // Nếu không tìm thấy file có mark, trả về tên file gốc
}

export async function getFileByEitherFolder(
  filename: string,
  folderPath: string,
  rootFolderPath: string
): Promise<{ fullname: string; absPath: string }> {
  const files = await fs.readdir(folderPath);
  const baseName = getFileNameRemoveMarks(filename);

  for (const file of files) {
    const fileBaseName = getFileNameRemoveMarks(file);
    if (fileBaseName === baseName) {
      // console.dir(file);

      return {
        fullname: file,
        absPath: path.join(folderPath, file),
      };
      // keep it for extend in need
      //   const match = file.match(/\[.*?\]/);
      //   if (match) {
      //     return `${baseName} ${match[0]}.mp3`;
      //   }
    }
  }
  return {
    fullname: filename,
    absPath: path.join(rootFolderPath, filename),
  };
  // Nếu không tìm thấy file có mark, trả về tên file gốc
}

export function getFileNameRemoveMarks(filename: string): string {
  return filename.replace(/\s*\[.*?\]/g, "").trim();
}

export function changeExtension(filePath: string, newExtension: any) {
  // Lấy thư mục, tên file gốc và extension gốc từ filePath
  const dir = path.dirname(filePath);
  const baseName = path.basename(filePath, path.extname(filePath));

  // Tạo đường dẫn mới với extension mới
  const newFilePath = path.join(dir, `${baseName}${newExtension}`);

  return newFilePath;
}

/**
 * Di chuyển (cut) file từ vị trí hiện tại tới vị trí mới.
 * @param {string} currentPath - Đường dẫn hiện tại của file.
 * @param {string} newPath - Đường dẫn mới của file.
 */
export async function moveFile(currentPath: string, newPath: string) {
  try {
    // Đảm bảo thư mục đích tồn tại
    await fs.mkdir(path.dirname(newPath), { recursive: true });
    // Di chuyển file
    await fs.rename(currentPath, newPath);
  } catch (error) {
    console.error(
      `Error moving file from ${currentPath} to ${newPath}:`,
      error
    );
  }
}

// Hàm phân tích tên thư mục để lấy thời gian tạo
function parseDirectoryName(directoryName) {
  const regex = /_(\d{4})(\d{2})(\d{2})_(\d{2})h(\d{2})m(\d{2})s$/;
  const match = directoryName.match(regex);
  if (match) {
    const [, year, month, day, hours, minutes, seconds] = match;
    return new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`);
  }
  return null;
}

// Hàm để tìm hai thư mục được tạo gần đây nhất
export async function getTwoLatestDirectories(parentDirectoryPath) {
  try {
    // Đọc nội dung của thư mục cha
    const files = await fs.readdir(parentDirectoryPath);

    // Lọc để chỉ lấy các thư mục có tên khớp với định dạng của hàm createUniqueDirectory
    const directories = files.filter((file) =>
      /_\d{4}\d{2}\d{2}_\d{2}h\d{2}m\d{2}s$/.test(file)
    );

    // Lấy thông tin ngày tạo của các thư mục
    const directoryInfos = directories
      .map((dir) => {
        const creationTime = parseDirectoryName(dir);
        return { path: path.join(parentDirectoryPath, dir), creationTime };
      })
      .filter((info) => info.creationTime); // Lọc các thư mục có ngày tạo hợp lệ

    // Sắp xếp các thư mục theo ngày tạo giảm dần
    directoryInfos.sort((a, b) => b.creationTime - a.creationTime);

    // Trả về hai thư mục được tạo gần đây nhất
    return directoryInfos.slice(0, 2).map((info) => info.path);
  } catch (error) {
    console.error("Error:", error);
  }
}

export async function copyFiles(
  input: { folderPath: any; fileNames: any },
  output: { folderPath: any }
) {
  return new Promise((resolve, reject) => {
    const { folderPath: inputFolderPath, fileNames } = input;
    const { folderPath: outputFolderPath } = output;

    const copyPromises = fileNames.map((fileName: string) => {
      return new Promise((fileResolve, fileReject) => {
        const sourceFilePath = path.join(inputFolderPath, fileName);
        const destinationFilePath = path.join(outputFolderPath, fileName);

        // @ts-ignore
        fs.copyFile(sourceFilePath, destinationFilePath);
        fileResolve(true);
      });
    });

    Promise.all(copyPromises)
      .then((results) => resolve(results))
      .catch((err) => reject(err));
  });
}
