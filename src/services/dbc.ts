import { PrismaClient } from "@prisma/client";

export default async function dbc<
  T extends (prisma: PrismaClient) => Promise<any>
>(callback: T) {
  const prisma = new PrismaClient();
  let result;

  try {
    result = await callback(prisma);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }

  return result;
}
