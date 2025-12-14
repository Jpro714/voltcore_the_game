import 'dotenv/config';
import prisma from '../lib/prisma.js';

async function primeActivations() {
  const readyAt = new Date(Date.now() - 1000);

  const { count } = await prisma.characterState.updateMany({
    where: {
      lastActivationAt: null,
      character: {
        isActive: true,
      },
    },
    data: {
      nextActivationAt: readyAt,
    },
  });

  console.log(`Primed ${count} character(s) to activate immediately.`);
}

primeActivations()
  .catch((error) => {
    console.error('Failed to prime character activations', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
