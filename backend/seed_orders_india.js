/**
 * Seed 30 Indian customer orders for chart / KPI / table widget testing.
 * Run: node seed_orders_india.js
 * Docker: docker compose exec backend node seed_orders_india.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const STATUSES = ['Delivered', 'Shipped', 'Pending', 'Cancelled'];
const PRODUCTS = [
  { name: 'Laptop', unitPrices: [89999, 64999, 54999, 42999] },
  { name: 'Phone', unitPrices: [24999, 18999, 15999, 12999] },
  { name: 'Tablet', unitPrices: [34999, 27999, 19999] },
  { name: 'Monitor', unitPrices: [18999, 14999, 9999, 7999] },
  { name: 'Keyboard', unitPrices: [4999, 2999, 1499, 999] },
];

/** Simple Indian first/last names, cities, states — varied for charts */
const customers = [
  { firstName: 'Ravi', lastName: 'Kumar', city: 'Mumbai', state: 'Maharashtra', postalCode: '400001' },
  { firstName: 'Priya', lastName: 'Singh', city: 'Delhi', state: 'Delhi', postalCode: '110001' },
  { firstName: 'Amit', lastName: 'Shah', city: 'Ahmedabad', state: 'Gujarat', postalCode: '380001' },
  { firstName: 'Sunita', lastName: 'Devi', city: 'Patna', state: 'Bihar', postalCode: '800001' },
  { firstName: 'Rajesh', lastName: 'Nair', city: 'Kochi', state: 'Kerala', postalCode: '682001' },
  { firstName: 'Kavita', lastName: 'Rao', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001' },
  { firstName: 'Vikram', lastName: 'Mehta', city: 'Pune', state: 'Maharashtra', postalCode: '411001' },
  { firstName: 'Anjali', lastName: 'Das', city: 'Kolkata', state: 'West Bengal', postalCode: '700001' },
  { firstName: 'Suresh', lastName: 'Reddy', city: 'Hyderabad', state: 'Telangana', postalCode: '500001' },
  { firstName: 'Meera', lastName: 'Iyer', city: 'Chennai', state: 'Tamil Nadu', postalCode: '600001' },
  { firstName: 'Arun', lastName: 'Patel', city: 'Surat', state: 'Gujarat', postalCode: '395001' },
  { firstName: 'Pooja', lastName: 'Sharma', city: 'Jaipur', state: 'Rajasthan', postalCode: '302001' },
  { firstName: 'Kiran', lastName: 'Joshi', city: 'Nagpur', state: 'Maharashtra', postalCode: '440001' },
  { firstName: 'Deepak', lastName: 'Verma', city: 'Lucknow', state: 'Uttar Pradesh', postalCode: '226001' },
  { firstName: 'Lakshmi', lastName: 'Pillai', city: 'Thiruvananthapuram', state: 'Kerala', postalCode: '695001' },
  { firstName: 'Ganesh', lastName: 'Menon', city: 'Coimbatore', state: 'Tamil Nadu', postalCode: '641001' },
  { firstName: 'Neha', lastName: 'Gupta', city: 'Indore', state: 'Madhya Pradesh', postalCode: '452001' },
  { firstName: 'Rohit', lastName: 'Khanna', city: 'Chandigarh', state: 'Punjab', postalCode: '160001' },
  { firstName: 'Divya', lastName: 'Chatterjee', city: 'Bhubaneswar', state: 'Odisha', postalCode: '751001' },
  { firstName: 'Manoj', lastName: 'Yadav', city: 'Varanasi', state: 'Uttar Pradesh', postalCode: '221001' },
  { firstName: 'Rekha', lastName: 'Agarwal', city: 'Agra', state: 'Uttar Pradesh', postalCode: '282001' },
  { firstName: 'Sanjay', lastName: 'Bhat', city: 'Mysuru', state: 'Karnataka', postalCode: '570001' },
  { firstName: 'Tina', lastName: 'Malhotra', city: 'Ludhiana', state: 'Punjab', postalCode: '141001' },
  { firstName: 'Harish', lastName: 'Desai', city: 'Vadodara', state: 'Gujarat', postalCode: '390001' },
  { firstName: 'Uma', lastName: 'Krishnan', city: 'Madurai', state: 'Tamil Nadu', postalCode: '625001' },
  { firstName: 'Karan', lastName: 'Chawla', city: 'Amritsar', state: 'Punjab', postalCode: '143001' },
  { firstName: 'Swati', lastName: 'Bose', city: 'Guwahati', state: 'Assam', postalCode: '781001' },
  { firstName: 'Imran', lastName: 'Khan', city: 'Bhopal', state: 'Madhya Pradesh', postalCode: '462001' },
  { firstName: 'Fatima', lastName: 'Ali', city: 'Srinagar', state: 'Jammu and Kashmir', postalCode: '190001' },
  { firstName: 'Joseph', lastName: 'Thomas', city: 'Panaji', state: 'Goa', postalCode: '403001' },
];

const streets = [
  'MG Road', 'Station Road', 'Gandhi Nagar', 'Nehru Street', 'Ring Road',
  'Market Lane', 'Temple Street', 'Lake View Colony', 'Sector 12', 'Old City Road',
];

function pick(arr, index) {
  return arr[index % arr.length];
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10 + (n % 8), (n * 7) % 60, 0, 0);
  return d;
}

function buildOrders() {
  return customers.map((c, i) => {
    const productDef = pick(PRODUCTS, i + 2);
    const unitPrice = pick(productDef.unitPrices, i);
    const quantity = (i % 5) + 1;
    const totalAmount = Math.round(unitPrice * quantity * 100) / 100;
    const slug = `${c.firstName.toLowerCase()}.${c.lastName.toLowerCase()}`;
    return {
      firstName: c.firstName,
      lastName: c.lastName,
      email: `${slug}${i + 1}@example.in`,
      phone: `+91-9${String(800000000 + i * 1234567).slice(0, 9)}`,
      street: `${pick(streets, i)} ${(i % 40) + 1}`,
      city: c.city,
      state: c.state,
      postalCode: c.postalCode,
      country: 'India',
      product: productDef.name,
      quantity,
      unitPrice,
      totalAmount,
      status: pick(STATUSES, i),
      createdBy: 'Seed India',
      createdAt: daysAgo(59 - (i * 2)),
    };
  });
}

async function main() {
  const orders = buildOrders();
  console.log(`Seeding ${orders.length} Indian customer orders...`);

  let created = 0;
  for (const order of orders) {
    await prisma.order.create({ data: order });
    created += 1;
  }

  const byProduct = await prisma.order.groupBy({
    by: ['product'],
    _count: { id: true },
    _sum: { totalAmount: true },
    where: { country: 'India' },
  });
  const byStatus = await prisma.order.groupBy({
    by: ['status'],
    _count: { id: true },
    where: { country: 'India' },
  });

  console.log(`Done. Created ${created} orders.`);
  console.log('India orders by product:', byProduct);
  console.log('India orders by status:', byStatus);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
