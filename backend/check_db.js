const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const dash = await prisma.dashboard.findFirst({ where: { name: 'default' } });
  console.log('Dashboard found:', dash ? 'YES' : 'NO');
  if (dash) {
    console.log('Layout Length:', JSON.parse(dash.layout).length);
    console.log('Widgets Length:', JSON.parse(dash.widgets).length);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
