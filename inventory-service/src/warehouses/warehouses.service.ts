import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Warehouse, WarehouseDocument } from './schemas/warehouse.schema';
import { CreateWarehouseInput, UpdateWarehouseInput, WarehouseFilterInput } from './dto/warehouse.dto';

@Injectable()
export class WarehousesService {
  constructor(
    @InjectModel(Warehouse.name) private warehouseModel: Model<WarehouseDocument>,
  ) {}

  async createWarehouse(createWarehouseInput: CreateWarehouseInput): Promise<Warehouse> {
    try {
      // Check if warehouse name already exists
      const existingWarehouse = await this.warehouseModel.findOne({ name: createWarehouseInput.name });
      if (existingWarehouse) {
        throw new ConflictException(`Warehouse with name '${createWarehouseInput.name}' already exists`);
      }

      // Check if warehouse code already exists (if provided)
      if (createWarehouseInput.code) {
        const existingCode = await this.warehouseModel.findOne({ code: createWarehouseInput.code });
        if (existingCode) {
          throw new ConflictException(`Warehouse with code '${createWarehouseInput.code}' already exists`);
        }
      }

      const newWarehouse = new this.warehouseModel(createWarehouseInput);
      return await newWarehouse.save();
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create warehouse: ' + error.message);
    }
  }

  async findAllWarehouses(
    filter?: WarehouseFilterInput,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'name',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<{ warehouses: Warehouse[], total: number, page: number, totalPages: number }> {
    const query: any = {};

    // Apply filters
    if (filter) {
      if (filter.isActive !== undefined) {
        query.isActive = filter.isActive;
      }
      if (filter.type) {
        query.type = filter.type;
      }
      if (filter.city) {
        query['address.city'] = { $regex: filter.city, $options: 'i' };
      }
      if (filter.country) {
        query['address.country'] = { $regex: filter.country, $options: 'i' };
      }
      if (filter.search) {
        query.$or = [
          { name: { $regex: filter.search, $options: 'i' } },
          { code: { $regex: filter.search, $options: 'i' } },
          { description: { $regex: filter.search, $options: 'i' } },
          { 'address.city': { $regex: filter.search, $options: 'i' } },
          { 'address.country': { $regex: filter.search, $options: 'i' } },
        ];
      }
    }

    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [warehouses, total] = await Promise.all([
      this.warehouseModel
        .find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.warehouseModel.countDocuments(query),
    ]);

    return {
      warehouses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findWarehouseById(id: string): Promise<Warehouse> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid warehouse ID format');
    }

    const warehouse = await this.warehouseModel.findById(id).exec();

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    return warehouse;
  }

  async findWarehouseByCode(code: string): Promise<Warehouse> {
    const warehouse = await this.warehouseModel.findOne({ code }).exec();

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with code ${code} not found`);
    }

    return warehouse;
  }

  async updateWarehouse(id: string, updateWarehouseInput: UpdateWarehouseInput): Promise<Warehouse> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid warehouse ID format');
    }

    // Check if name already exists (excluding current warehouse)
    if (updateWarehouseInput.name) {
      const existingWarehouse = await this.warehouseModel.findOne({
        name: updateWarehouseInput.name,
        _id: { $ne: id },
      });
      if (existingWarehouse) {
        throw new ConflictException(`Warehouse with name '${updateWarehouseInput.name}' already exists`);
      }
    }

    // Check if code already exists (excluding current warehouse)
    if (updateWarehouseInput.code) {
      const existingCode = await this.warehouseModel.findOne({
        code: updateWarehouseInput.code,
        _id: { $ne: id },
      });
      if (existingCode) {
        throw new ConflictException(`Warehouse with code '${updateWarehouseInput.code}' already exists`);
      }
    }

    const updatedWarehouse = await this.warehouseModel
      .findByIdAndUpdate(id, updateWarehouseInput, { new: true, runValidators: true })
      .exec();

    if (!updatedWarehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    return updatedWarehouse;
  }

  async deleteWarehouse(id: string): Promise<{ success: boolean; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid warehouse ID format');
    }

    // Check if warehouse is being used by inventory (you'll need to implement this check)
    // For now, we'll just delete the warehouse

    const result = await this.warehouseModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'Warehouse deleted successfully',
    };
  }

  async getWarehouseStats(): Promise<{
    totalWarehouses: number;
    activeWarehouses: number;
    inactiveWarehouses: number;
    warehousesByType: Array<{ type: string; count: number }>;
    warehousesByCountry: Array<{ country: string; count: number }>;
  }> {
    const [stats] = await this.warehouseModel.aggregate([
      {
        $group: {
          _id: null,
          totalWarehouses: { $sum: 1 },
          activeWarehouses: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          inactiveWarehouses: {
            $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
          }
        }
      }
    ]);

    const warehousesByType = await this.warehouseModel.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          type: '$_id',
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const warehousesByCountry = await this.warehouseModel.aggregate([
      {
        $group: {
          _id: '$address.country',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          country: '$_id',
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    return {
      totalWarehouses: stats?.totalWarehouses || 0,
      activeWarehouses: stats?.activeWarehouses || 0,
      inactiveWarehouses: stats?.inactiveWarehouses || 0,
      warehousesByType: warehousesByType || [],
      warehousesByCountry: warehousesByCountry || [],
    };
  }

  async findWarehousesByLocation(city?: string, country?: string): Promise<Warehouse[]> {
    const query: any = {};
    
    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' };
    }
    
    if (country) {
      query['address.country'] = { $regex: country, $options: 'i' };
    }

    return await this.warehouseModel.find(query).exec();
  }

  async findWarehousesByType(type: string): Promise<Warehouse[]> {
    return await this.warehouseModel.find({ type }).exec();
  }

  async searchWarehouses(searchTerm: string): Promise<Warehouse[]> {
    const query = {
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { code: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
        { 'address.city': { $regex: searchTerm, $options: 'i' } },
        { 'address.country': { $regex: searchTerm, $options: 'i' } },
      ]
    };

    return await this.warehouseModel.find(query).limit(20).exec();
  }

  async getActiveWarehouses(): Promise<Warehouse[]> {
    return await this.warehouseModel.find({ isActive: true }).exec();
  }
}
