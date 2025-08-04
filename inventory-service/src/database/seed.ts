import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ProductsService } from '../products/products.service';
import { CategoriesService } from '../categories/categories.service';
import { SuppliersService } from '../suppliers/suppliers.service';
import { WarehousesService } from '../warehouses/warehouses.service';
import { InventoryService } from '../inventory/inventory.service';
import { InventoryTransactionType, InventoryTransactionReason } from '../inventory/schemas/inventory.schema';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const categoriesService = app.get(CategoriesService);
  const suppliersService = app.get(SuppliersService);
  const warehousesService = app.get(WarehousesService);
  const productsService = app.get(ProductsService);
  const inventoryService = app.get(InventoryService);

  try {
    console.log('🌱 Starting inventory service seed...');

    // Create categories
    console.log('📁 Creating categories...');
    const electronicsCategory = await categoriesService.createCategory({
      name: 'Electronics',
      description: 'Electronic devices and components',
      code: 'ELEC',
      isActive: true,
      sortOrder: 1,
    });

    const furnitureCategory = await categoriesService.createCategory({
      name: 'Furniture',
      description: 'Office and home furniture',
      code: 'FURN',
      isActive: true,
      sortOrder: 2,
    });

    const stationeryCategory = await categoriesService.createCategory({
      name: 'Stationery',
      description: 'Office supplies and stationery',
      code: 'STAT',
      isActive: true,
      sortOrder: 3,
    });

    // Create suppliers
    console.log('🏭 Creating suppliers...');
    const techSupplier = await suppliersService.createSupplier({
      name: 'TechCorp Electronics',
      code: 'TECH001',
      description: 'Leading electronics supplier',
      contactPerson: 'John Smith',
      email: 'orders@techcorp.com',
      phone: '+1-555-0123',
      address: '123 Tech Street',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      postalCode: '94105',
      website: 'https://techcorp.com',
      isActive: true,
    });

    const furnitureSupplier = await suppliersService.createSupplier({
      name: 'Modern Furniture Co.',
      code: 'FURN001',
      description: 'Quality furniture manufacturer',
      contactPerson: 'Sarah Johnson',
      email: 'sales@modernfurniture.com',
      phone: '+1-555-0124',
      address: '456 Furniture Ave',
      city: 'Chicago',
      state: 'IL',
      country: 'USA',
      postalCode: '60611',
      website: 'https://modernfurniture.com',
      isActive: true,
    });

    // Create warehouses
    console.log('🏢 Creating warehouses...');
    const mainWarehouse = await warehousesService.createWarehouse({
      name: 'Main Warehouse',
      code: 'WH001',
      description: 'Primary storage facility',
      address: '789 Storage Blvd',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      postalCode: '90210',
      contactPerson: 'Mike Wilson',
      phone: '+1-555-0125',
      email: 'warehouse@company.com',
      isActive: true,
      isMainWarehouse: true,
    });

    const secondaryWarehouse = await warehousesService.createWarehouse({
      name: 'East Coast Warehouse',
      code: 'WH002',
      description: 'East coast distribution center',
      address: '321 Distribution Way',
      city: 'New York',
      state: 'NY',
      country: 'USA',
      postalCode: '10001',
      contactPerson: 'Lisa Brown',
      phone: '+1-555-0126',
      email: 'eastcoast@company.com',
      isActive: true,
      isMainWarehouse: false,
    });

    // Create products
    console.log('📦 Creating products...');
    const laptop = await productsService.createProduct({
      sku: 'LAPTOP001',
      name: 'Business Laptop Pro',
      description: 'High-performance laptop for business use',
      categoryId: electronicsCategory._id.toString(),
      price: 1299.99,
      cost: 899.99,
      unit: 'piece',
      currentStock: 0, // Will be set through inventory
      minStockLevel: 5,
      maxStockLevel: 50,
      reorderPoint: 10,
      reorderQuantity: 20,
      isActive: true,
      isTrackable: true,
      supplierIds: [techSupplier._id.toString()],
      weight: 2.5,
      dimensions: '35x25x2 cm',
    });

    const deskChair = await productsService.createProduct({
      sku: 'CHAIR001',
      name: 'Ergonomic Office Chair',
      description: 'Comfortable ergonomic office chair with lumbar support',
      categoryId: furnitureCategory._id.toString(),
      price: 299.99,
      cost: 179.99,
      unit: 'piece',
      currentStock: 0,
      minStockLevel: 3,
      maxStockLevel: 25,
      reorderPoint: 5,
      reorderQuantity: 10,
      isActive: true,
      isTrackable: true,
      supplierIds: [furnitureSupplier._id.toString()],
      weight: 15.0,
      dimensions: '60x60x110 cm',
    });

    const notebook = await productsService.createProduct({
      sku: 'NOTE001',
      name: 'Professional Notebook',
      description: 'A4 ruled notebook for professional use',
      categoryId: stationeryCategory._id.toString(),
      price: 12.99,
      cost: 5.99,
      unit: 'piece',
      currentStock: 0,
      minStockLevel: 20,
      maxStockLevel: 200,
      reorderPoint: 50,
      reorderQuantity: 100,
      isActive: true,
      isTrackable: false,
    });

    // Add initial inventory
    console.log('📊 Adding initial inventory...');
    
    // Add laptops to main warehouse
    await inventoryService.recordStockMovement({
      productId: laptop._id.toString(),
      warehouseId: mainWarehouse._id.toString(),
      quantity: 25,
      type: InventoryTransactionType.IN,
      reason: InventoryTransactionReason.PURCHASE,
      unitCost: 899.99,
      notes: 'Initial stock purchase',
      performedBy: 'system-seed',
      reference: 'SEED-001',
    });

    // Add laptops to secondary warehouse
    await inventoryService.recordStockMovement({
      productId: laptop._id.toString(),
      warehouseId: secondaryWarehouse._id.toString(),
      quantity: 15,
      type: InventoryTransactionType.IN,
      reason: InventoryTransactionReason.PURCHASE,
      unitCost: 899.99,
      notes: 'Initial stock purchase',
      performedBy: 'system-seed',
      reference: 'SEED-002',
    });

    // Add chairs to main warehouse
    await inventoryService.recordStockMovement({
      productId: deskChair._id.toString(),
      warehouseId: mainWarehouse._id.toString(),
      quantity: 12,
      type: InventoryTransactionType.IN,
      reason: InventoryTransactionReason.PURCHASE,
      unitCost: 179.99,
      notes: 'Initial stock purchase',
      performedBy: 'system-seed',
      reference: 'SEED-003',
    });

    // Add notebooks to main warehouse
    await inventoryService.recordStockMovement({
      productId: notebook._id.toString(),
      warehouseId: mainWarehouse._id.toString(),
      quantity: 150,
      type: InventoryTransactionType.IN,
      reason: InventoryTransactionReason.PURCHASE,
      unitCost: 5.99,
      notes: 'Initial stock purchase',
      performedBy: 'system-seed',
      reference: 'SEED-004',
    });

    // Create some sample transactions
    console.log('📋 Creating sample transactions...');
    
    // Simulate some sales
    await inventoryService.recordStockMovement({
      productId: laptop._id.toString(),
      warehouseId: mainWarehouse._id.toString(),
      quantity: 3,
      type: InventoryTransactionType.OUT,
      reason: InventoryTransactionReason.SALE,
      unitCost: 899.99,
      notes: 'Sale to customer ABC Corp',
      performedBy: 'system-seed',
      reference: 'SO-001',
    });

    await inventoryService.recordStockMovement({
      productId: deskChair._id.toString(),
      warehouseId: mainWarehouse._id.toString(),
      quantity: 2,
      type: InventoryTransactionType.OUT,
      reason: InventoryTransactionReason.SALE,
      unitCost: 179.99,
      notes: 'Sale to customer XYZ Ltd',
      performedBy: 'system-seed',
      reference: 'SO-002',
    });

    console.log('✅ Inventory service seeding completed successfully!');
    console.log('📈 Created:');
    console.log('  - 3 Categories');
    console.log('  - 2 Suppliers');
    console.log('  - 2 Warehouses');
    console.log('  - 3 Products');
    console.log('  - Multiple inventory records and transactions');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  seed()
    .then(() => {
      console.log('🎉 Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding process failed:', error);
      process.exit(1);
    });
}

export { seed };
