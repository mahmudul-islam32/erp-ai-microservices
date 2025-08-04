import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InventoryService } from './inventory.service';
import { InventoryResolver } from './inventory.resolver';
import { InventoryController } from './inventory.controller';
import { 
  Inventory, 
  InventorySchema, 
  InventoryTransaction, 
  InventoryTransactionSchema 
} from './schemas/inventory.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { Warehouse, WarehouseSchema } from '../warehouses/schemas/warehouse.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Inventory.name, schema: InventorySchema },
      { name: InventoryTransaction.name, schema: InventoryTransactionSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Warehouse.name, schema: WarehouseSchema },
    ]),
    AuthModule,
  ],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryResolver],
  exports: [InventoryService],
})
export class InventoryModule {}
