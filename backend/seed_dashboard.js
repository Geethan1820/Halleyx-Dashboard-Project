const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to generate IDs
const gid = () => Math.random().toString(36).substring(2, 10);

const widgets = [
  { id: gid(), type: 'kpi', title: 'Total Revenue', color: '#6366f1', metric: 'totalAmount', aggregation: 'sum', format: 'currency', decimals: 0 },
  { id: gid(), type: 'kpi', title: 'Total Orders', color: '#10b981', metric: 'quantity', aggregation: 'count', format: 'number', decimals: 0 },
  { id: gid(), type: 'kpi', title: 'Avg Order Value', color: '#f59e0b', metric: 'totalAmount', aggregation: 'avg', format: 'currency', decimals: 2 },
  { id: gid(), type: 'bar-chart', title: 'Revenue by Product', color: '#6366f1', xAxis: 'product', yAxis: 'totalAmount', showLabels: true },
  { id: gid(), type: 'pie-chart', title: 'Orders by Country', color: '#8b5cf6', xAxis: 'country', yAxis: 'totalAmount', aggregation: 'count', showLegend: true },
  { id: gid(), type: 'table', title: 'Recent Orders', color: '#64748b', columns: ['firstName', 'product', 'totalAmount', 'status'], pageSize: 5 }
];

const layout = [
  { i: widgets[0].id, x: 0, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
  { i: widgets[1].id, x: 4, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
  { i: widgets[2].id, x: 8, y: 0, w: 4, h: 2, minW: 2, minH: 2 },
  { i: widgets[3].id, x: 0, y: 2, w: 8, h: 4, minW: 4, minH: 3 },
  { i: widgets[4].id, x: 8, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
  { i: widgets[5].id, x: 0, y: 6, w: 12, h: 4, minW: 6, minH: 3 }
];

async function main() {
  console.log("Creating default dashboard...");
  
  // Clean up existing default dashboard if any
  await prisma.dashboard.deleteMany({ where: { name: 'default' } });

  const dashboard = await prisma.dashboard.create({
    data: {
      name: 'default',
      widgets: JSON.stringify(widgets),
      layout: JSON.stringify(layout)
    }
  });

  console.log("Dashboard created successfully with 6 widgets!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
