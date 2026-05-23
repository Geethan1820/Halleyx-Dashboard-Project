const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const orders = [
  { firstName: "James", lastName: "Wilson", email: "james.w@example.com", phone: "555-0101", street: "123 Oak St", city: "Seattle", state: "WA", postalCode: "98101", country: "USA", product: "Laptop", quantity: 2, unitPrice: 1200.00, totalAmount: 2400.00, status: "Delivered", createdBy: "Admin" },
  { firstName: "Emma", lastName: "Thompson", email: "emma.t@example.com", phone: "555-0102", street: "456 Maple Ave", city: "Toronto", state: "ON", postalCode: "M5H 2N2", country: "Canada", product: "Phone", quantity: 1, unitPrice: 800.00, totalAmount: 800.00, status: "Shipped", createdBy: "Admin" },
  { firstName: "Liam", lastName: "Davies", email: "liam.d@example.com", phone: "555-0103", street: "789 Pine Rd", city: "London", state: "London", postalCode: "EC1A 1BB", country: "UK", product: "Tablet", quantity: 3, unitPrice: 400.00, totalAmount: 1200.00, status: "Pending", createdBy: "Admin" },
  { firstName: "Sophia", lastName: "Müller", email: "sophia.m@example.de", phone: "555-0104", street: "Hauptstrasse 12", city: "Berlin", state: "Berlin", postalCode: "10115", country: "Germany", product: "Monitor", quantity: 1, unitPrice: 300.00, totalAmount: 300.00, status: "Delivered", createdBy: "Admin" },
  { firstName: "Aarav", lastName: "Sharma", email: "aarav.s@example.in", phone: "555-0105", street: "MG Road 45", city: "Mumbai", state: "MH", postalCode: "400001", country: "India", product: "Keyboard", quantity: 5, unitPrice: 50.00, totalAmount: 250.00, status: "Cancelled", createdBy: "Admin" },
  { firstName: "Olivia", lastName: "Brown", email: "olivia.b@example.com", phone: "555-0106", street: "321 Birch Ln", city: "Austin", state: "TX", postalCode: "73301", country: "USA", product: "Laptop", quantity: 1, unitPrice: 1500.00, totalAmount: 1500.00, status: "Pending", createdBy: "Admin" },
  { firstName: "Noah", lastName: "Taylor", email: "noah.t@example.com", phone: "555-0107", street: "654 Cedar Ct", city: "Vancouver", state: "BC", postalCode: "V6B 3K9", country: "Canada", product: "Phone", quantity: 2, unitPrice: 900.00, totalAmount: 1800.00, status: "Delivered", createdBy: "Admin" },
  { firstName: "Ava", lastName: "Smith", email: "ava.s@example.com", phone: "555-0108", street: "987 Elm St", city: "Manchester", state: "Lancs", postalCode: "M1 1AE", country: "UK", product: "Monitor", quantity: 4, unitPrice: 250.00, totalAmount: 1000.00, status: "Shipped", createdBy: "Admin" },
  { firstName: "Lucas", lastName: "Schmidt", email: "lucas.s@example.de", phone: "555-0109", street: "Berliner Str 88", city: "Munich", state: "Bavaria", postalCode: "80331", country: "Germany", product: "Tablet", quantity: 1, unitPrice: 600.00, totalAmount: 600.00, status: "Pending", createdBy: "Admin" },
  { firstName: "Ananya", lastName: "Patel", email: "ananya.p@example.in", phone: "555-0110", street: "Indiranagar 12", city: "Bangalore", state: "KA", postalCode: "560038", country: "India", product: "Laptop", quantity: 1, unitPrice: 1100.00, totalAmount: 1100.00, status: "Delivered", createdBy: "Admin" },
  { firstName: "Isabella", lastName: "Garcia", email: "isabella.g@example.com", phone: "555-0111", street: "555 Palm Dr", city: "Miami", state: "FL", postalCode: "33101", country: "USA", product: "Phone", quantity: 3, unitPrice: 750.00, totalAmount: 2250.00, status: "Shipped", createdBy: "Admin" },
  { firstName: "William", lastName: "Clark", email: "william.c@example.com", phone: "555-0112", street: "222 Spruce Way", city: "Calgary", state: "AB", postalCode: "T2P 2M1", country: "Canada", product: "Keyboard", quantity: 10, unitPrice: 45.00, totalAmount: 450.00, status: "Delivered", createdBy: "Admin" },
  { firstName: "Mia", lastName: "Jones", email: "mia.j@example.com", phone: "555-0113", street: "444 Willow Ln", city: "Birmingham", state: "W Mids", postalCode: "B1 1BB", country: "UK", product: "Laptop", quantity: 1, unitPrice: 1300.00, totalAmount: 1300.00, status: "Pending", createdBy: "Admin" },
  { firstName: "Alexander", lastName: "Wagner", email: "alex.w@example.de", phone: "555-0114", street: "Kaiserstr 5", city: "Frankfurt", state: "Hesse", postalCode: "60311", country: "Germany", product: "Monitor", quantity: 2, unitPrice: 350.00, totalAmount: 700.00, status: "Shipped", createdBy: "Admin" },
  { firstName: "Ishaan", lastName: "Gupta", email: "ishaan.g@example.in", phone: "555-0115", street: "Janpath 100", city: "Delhi", state: "DL", postalCode: "110001", country: "India", product: "Tablet", quantity: 2, unitPrice: 450.00, totalAmount: 900.00, status: "Delivered", createdBy: "Admin" },
  { firstName: "Charlotte", lastName: "Evans", email: "charlotte.e@example.com", phone: "555-0116", street: "777 Aspen Dr", city: "Denver", state: "CO", postalCode: "80201", country: "USA", product: "Phone", quantity: 1, unitPrice: 950.00, totalAmount: 950.00, status: "Cancelled", createdBy: "Admin" },
  { firstName: "Henry", lastName: "Moore", email: "henry.m@example.com", phone: "555-0117", street: "888 Poplar Pl", city: "Ottawa", state: "ON", postalCode: "K1P 1A1", country: "Canada", product: "Monitor", quantity: 3, unitPrice: 280.00, totalAmount: 840.00, status: "Pending", createdBy: "Admin" },
  { firstName: "Grace", lastName: "White", email: "grace.w@example.com", phone: "555-0118", street: "111 Beech Rd", city: "Leeds", state: "Yorks", postalCode: "LS1 1BA", country: "UK", product: "Laptop", quantity: 2, unitPrice: 1400.00, totalAmount: 2800.00, status: "Delivered", createdBy: "Admin" },
  { firstName: "Thomas", lastName: "Fischer", email: "thomas.f@example.de", phone: "555-0119", street: "Schillerstr 20", city: "Hamburg", state: "Hamburg", postalCode: "20095", country: "Germany", product: "Phone", quantity: 1, unitPrice: 850.00, totalAmount: 850.00, status: "Shipped", createdBy: "Admin" },
  { firstName: "Diya", lastName: "Reddy", email: "diya.r@example.in", phone: "555-0120", street: "Banjara Hills 5", city: "Hyderabad", state: "TS", postalCode: "500034", country: "India", product: "Monitor", quantity: 2, unitPrice: 320.00, totalAmount: 640.00, status: "Delivered", createdBy: "Admin" }
];

async function main() {
  console.log("Seeding 20 customer orders...");
  for (const order of orders) {
    await prisma.order.create({ data: order });
  }
  console.log("Seed successful.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
