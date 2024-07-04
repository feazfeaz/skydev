import { promises as fs } from "fs";
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
  }_${hours}h${minutes}m${seconds}s_${year}-${month}-${date}`;

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
      console.dir(file);

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
