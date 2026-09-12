import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create branches
  const mainBranch = await prisma.branch.create({
    data: {
      locationName: 'Main Branch',
      address: '123 Main Street, Manila',
      phone: '+63 2 8123 4567',
    },
  });

  const branch2 = await prisma.branch.create({
    data: {
      locationName: 'North Branch',
      address: '456 North Avenue, Quezon City',
      phone: '+63 2 8987 6543',
    },
  });

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const cashierPassword = await bcrypt.hash('cashier123', 10);

  await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@smartbiz.com',
      passwordHash: adminPassword,
      role: 'ADMIN',
      branchId: mainBranch.id,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Juan Cashier',
      email: 'cashier@smartbiz.com',
      passwordHash: cashierPassword,
      role: 'CASHIER',
      branchId: mainBranch.id,
    },
  });

  // Create categories
  const beverages = await prisma.category.create({
    data: { name: 'Beverages', description: 'Drinks and beverages' },
  });

  const snacks = await prisma.category.create({
    data: { name: 'Snacks', description: 'Snack items' },
  });

  const groceries = await prisma.category.create({
    data: { name: 'Groceries', description: 'Grocery items' },
  });

  // Create products
  const product1 = await prisma.product.create({
    data: {
      barcode: '4901234567890',
      name: 'Coca-Cola 500ml',
      description: 'Classic Coca-Cola soft drink',
      categoryId: beverages.id,
      costPrice: 25.00,
      sellingPrice: 40.00,
      reorderLevel: 20,
      images: { create: { url: 'https://via.placeholder.com/300x300?text=Coca-Cola', isPrimary: true } },
      inventory: { create: { branchId: mainBranch.id, quantity: 100 } },
    },
  });

  const product2 = await prisma.product.create({
    data: {
      barcode: '4901234567891',
      name: 'Lay\'s Classic 50g',
      description: 'Classic potato chips',
      categoryId: snacks.id,
      costPrice: 18.00,
      sellingPrice: 30.00,
      reorderLevel: 15,
      images: { create: { url: 'https://via.placeholder.com/300x300?text=Lays', isPrimary: true } },
      inventory: { create: { branchId: mainBranch.id, quantity: 80 } },
    },
  });

  const product3 = await prisma.product.create({
    data: {
      barcode: '4901234567892',
      name: 'Nestle Milk 1L',
      description: 'Fresh whole milk',
      categoryId: groceries.id,
      costPrice: 65.00,
      sellingPrice: 85.00,
      reorderLevel: 10,
      images: { create: { url: 'https://via.placeholder.com/300x300?text=Milk', isPrimary: true } },
      inventory: { create: { branchId: mainBranch.id, quantity: 50 } },
    },
  });

  // Create variants for a product
  await prisma.productVariant.createMany({
    data: [
      { productId: product1.id, sku: 'COKE-500-S', size: '500ml', color: null, material: null, additionalCost: 0, stockQuantity: 50 },
      { productId: product1.id, sku: 'COKE-1L-M', size: '1L', color: null, material: null, additionalCost: 15, stockQuantity: 30 },
    ],
  });

  console.log('Seed completed successfully!');
  console.log('Branches:', { mainBranch: mainBranch.id, branch2: branch2.id });
  console.log('Products:', { product1: product1.id, product2: product2.id, product3: product3.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
