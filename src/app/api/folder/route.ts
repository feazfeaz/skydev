import { NextApiRequest, NextApiResponse } from "next";
import dbc from "@/services/dbc";
export async function GET(req: NextApiResponse) {
  const result = await dbc((db) => {
    return db.folderPath.findMany({ where: {} });
  });

  return Response.json({ folders: result });
}

export async function POST(req: Request, res: NextApiResponse) {
  let { folders } = await req.json();
  folders = filterDuplicatePaths(folders);
  console.log("body: ", folders);

  //   console.log("req: ", req);
  const result = await dbc(async (db) => {
    await db.folderPath.deleteMany({});

    const newFolders = folders.map((folder: any) => ({
      path: folder.path,
    }));

    return await db.folderPath.createManyAndReturn({
      data: newFolders,
    });
  });
  return Response.json({ data: result });
}

function filterDuplicatePaths(folders: any) {
  const seenPaths = new Set();
  return folders.filter((folder: any) => {
    if (seenPaths.has(folder.path)) {
      return false;
    } else {
      seenPaths.add(folder.path);
      return true;
    }
  });
}
