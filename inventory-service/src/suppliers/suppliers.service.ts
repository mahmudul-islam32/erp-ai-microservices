import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Supplier, SupplierDocument } from './schemas/supplier.schema';
import { CreateSupplierInput, UpdateSupplierInput, SupplierFilterInput } from './dto/supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    @InjectModel(Supplier.name) private supplierModel: Model<SupplierDocument>,
  ) {}

  async createSupplier(createSupplierInput: CreateSupplierInput): Promise<Supplier> {
    try {
      // Check if supplier name already exists
      const existingSupplier = await this.supplierModel.findOne({ name: createSupplierInput.name });
      if (existingSupplier) {
        throw new ConflictException(`Supplier with name '${createSupplierInput.name}' already exists`);
      }

      // Check if supplier code already exists (if provided)
      if (createSupplierInput.code) {
        const existingCode = await this.supplierModel.findOne({ code: createSupplierInput.code });
        if (existingCode) {
          throw new ConflictException(`Supplier with code '${createSupplierInput.code}' already exists`);
        }
      }

      // Check if email already exists (if provided)
      if (createSupplierInput.email) {
        const existingEmail = await this.supplierModel.findOne({ email: createSupplierInput.email });
        if (existingEmail) {
          throw new ConflictException(`Supplier with email '${createSupplierInput.email}' already exists`);
        }
      }

      const newSupplier = new this.supplierModel(createSupplierInput);
      return await newSupplier.save();
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create supplier: ' + error.message);
    }
  }

  async findAllSuppliers(
    filter?: SupplierFilterInput,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'name',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<{ suppliers: Supplier[], total: number, page: number, totalPages: number }> {
    const query: any = {};

    // Apply filters
    if (filter) {
      if (filter.isActive !== undefined) {
        query.isActive = filter.isActive;
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
          { email: { $regex: filter.search, $options: 'i' } },
          { phone: { $regex: filter.search, $options: 'i' } },
          { 'contactPerson.name': { $regex: filter.search, $options: 'i' } },
        ];
      }
    }

    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [suppliers, total] = await Promise.all([
      this.supplierModel
        .find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.supplierModel.countDocuments(query),
    ]);

    return {
      suppliers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findSupplierById(id: string): Promise<Supplier> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid supplier ID format');
    }

    const supplier = await this.supplierModel.findById(id).exec();

    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return supplier;
  }

  async findSupplierByCode(code: string): Promise<Supplier> {
    const supplier = await this.supplierModel.findOne({ code }).exec();

    if (!supplier) {
      throw new NotFoundException(`Supplier with code ${code} not found`);
    }

    return supplier;
  }

  async updateSupplier(id: string, updateSupplierInput: UpdateSupplierInput): Promise<Supplier> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid supplier ID format');
    }

    // Check if name already exists (excluding current supplier)
    if (updateSupplierInput.name) {
      const existingSupplier = await this.supplierModel.findOne({
        name: updateSupplierInput.name,
        _id: { $ne: id },
      });
      if (existingSupplier) {
        throw new ConflictException(`Supplier with name '${updateSupplierInput.name}' already exists`);
      }
    }

    // Check if code already exists (excluding current supplier)
    if (updateSupplierInput.code) {
      const existingCode = await this.supplierModel.findOne({
        code: updateSupplierInput.code,
        _id: { $ne: id },
      });
      if (existingCode) {
        throw new ConflictException(`Supplier with code '${updateSupplierInput.code}' already exists`);
      }
    }

    // Check if email already exists (excluding current supplier)
    if (updateSupplierInput.email) {
      const existingEmail = await this.supplierModel.findOne({
        email: updateSupplierInput.email,
        _id: { $ne: id },
      });
      if (existingEmail) {
        throw new ConflictException(`Supplier with email '${updateSupplierInput.email}' already exists`);
      }
    }

    const updatedSupplier = await this.supplierModel
      .findByIdAndUpdate(id, updateSupplierInput, { new: true, runValidators: true })
      .exec();

    if (!updatedSupplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return updatedSupplier;
  }

  async deleteSupplier(id: string): Promise<{ success: boolean; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid supplier ID format');
    }

    // Check if supplier is being used by products (you'll need to implement this check)
    // For now, we'll just delete the supplier

    const result = await this.supplierModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'Supplier deleted successfully',
    };
  }

  async getSupplierStats(): Promise<{
    totalSuppliers: number;
    activeSuppliers: number;
    inactiveSuppliers: number;
    suppliersByCountry: Array<{ country: string; count: number }>;
  }> {
    const [stats] = await this.supplierModel.aggregate([
      {
        $group: {
          _id: null,
          totalSuppliers: { $sum: 1 },
          activeSuppliers: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          inactiveSuppliers: {
            $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
          }
        }
      }
    ]);

    const suppliersByCountry = await this.supplierModel.aggregate([
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
      totalSuppliers: stats?.totalSuppliers || 0,
      activeSuppliers: stats?.activeSuppliers || 0,
      inactiveSuppliers: stats?.inactiveSuppliers || 0,
      suppliersByCountry: suppliersByCountry || [],
    };
  }

  async findSuppliersByLocation(city?: string, country?: string): Promise<Supplier[]> {
    const query: any = {};
    
    if (city) {
      query['address.city'] = { $regex: city, $options: 'i' };
    }
    
    if (country) {
      query['address.country'] = { $regex: country, $options: 'i' };
    }

    return await this.supplierModel.find(query).exec();
  }

  async searchSuppliers(searchTerm: string): Promise<Supplier[]> {
    const query = {
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { code: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } },
        { 'contactPerson.name': { $regex: searchTerm, $options: 'i' } },
        { 'address.city': { $regex: searchTerm, $options: 'i' } },
        { 'address.country': { $regex: searchTerm, $options: 'i' } },
      ]
    };

    return await this.supplierModel.find(query).limit(20).exec();
  }
}
