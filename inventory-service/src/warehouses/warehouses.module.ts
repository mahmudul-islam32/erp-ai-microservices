import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WarehousesService } from './warehouses.service';
import { WarehousesResolver } from './warehouses.resolver';
import { WarehousesController } from './warehouses.controller';
import { Warehouse, WarehouseSchema } from './schemas/warehouse.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Warehouse.name, schema: WarehouseSchema }]),
    AuthModule,
  ],
  controllers: [WarehousesController],
  providers: [WarehousesService, WarehousesResolver],
  exports: [WarehousesService],
})
export class WarehousesModule {}
