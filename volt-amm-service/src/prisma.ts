import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

process.once('beforeExit', async () => {
  await prisma.$disconnect();
});
