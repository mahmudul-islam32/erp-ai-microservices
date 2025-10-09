import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductInput, UpdateProductInput, ProductFilterInput } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async createProduct(createProductInput: CreateProductInput): Promise<Product> {
    try {
      // Check if SKU already exists
      const existingProduct = await this.productModel.findOne({ sku: createProductInput.sku });
      if (existingProduct) {
        throw new ConflictException(`Product with SKU '${createProductInput.sku}' already exists`);
      }

      // Convert categoryId string to ObjectId and set defaults for optional fields
      const productData = {
        ...createProductInput,
        categoryId: new Types.ObjectId(createProductInput.categoryId),
        supplierIds: createProductInput.supplierIds?.map(id => new Types.ObjectId(id)) || [],
        // Set defaults for optional stock-related fields
        currentStock: createProductInput.currentStock ?? 0,
        minStockLevel: createProductInput.minStockLevel ?? 0,
        maxStockLevel: createProductInput.maxStockLevel ?? 0,
        reorderPoint: createProductInput.reorderPoint ?? 0,
        reorderQuantity: createProductInput.reorderQuantity ?? 0,
      };

      const newProduct = new this.productModel(productData);
      return await newProduct.save();
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create product: ' + error.message);
    }
  }

  async findAllProducts(
    filter?: ProductFilterInput,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ products: Product[], total: number, page: number, totalPages: number }> {
    const query: any = {};

    // Apply filters
    if (filter) {
      if (filter.categoryId) {
        query.categoryId = new Types.ObjectId(filter.categoryId);
      }
      if (filter.isActive !== undefined) {
        query.isActive = filter.isActive;
      }
      if (filter.search) {
        query.$or = [
          { name: { $regex: filter.search, $options: 'i' } },
          { sku: { $regex: filter.search, $options: 'i' } },
          { description: { $regex: filter.search, $options: 'i' } },
        ];
      }
      if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
        query.price = {};
        if (filter.minPrice !== undefined) query.price.$gte = filter.minPrice;
        if (filter.maxPrice !== undefined) query.price.$lte = filter.maxPrice;
      }
      if (filter.lowStock) {
        query.$expr = { $lt: ['$currentStock', '$reorderPoint'] };
      }
    }

    const skip = (page - 1) * limit;
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      this.productModel
        .find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate('categoryId')
        .populate('supplierIds')
        .exec(),
      this.productModel.countDocuments(query),
    ]);

    return {
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findProductById(id: string): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID format');
    }

    const product = await this.productModel
      .findById(id)
      .populate('categoryId')
      .populate('supplierIds')
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async findProductBySku(sku: string): Promise<Product> {
    const product = await this.productModel
      .findOne({ sku })
      .populate('categoryId')
      .populate('supplierIds')
      .exec();

    if (!product) {
      throw new NotFoundException(`Product with SKU ${sku} not found`);
    }

    return product;
  }

  async updateProduct(id: string, updateProductInput: UpdateProductInput): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID format');
    }

    // Check if SKU already exists (excluding current product)
    if (updateProductInput.sku) {
      const existingProduct = await this.productModel.findOne({
        sku: updateProductInput.sku,
        _id: { $ne: id },
      });
      if (existingProduct) {
        throw new ConflictException(`Product with SKU '${updateProductInput.sku}' already exists`);
      }
    }

    // Convert string IDs to ObjectIds
    const updateData: any = { ...updateProductInput };
    if (updateProductInput.categoryId) {
      updateData.categoryId = new Types.ObjectId(updateProductInput.categoryId);
    }
    if (updateProductInput.supplierIds) {
      updateData.supplierIds = updateProductInput.supplierIds.map(id => new Types.ObjectId(id));
    }

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('categoryId')
      .populate('supplierIds')
      .exec();

    if (!updatedProduct) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<{ success: boolean; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID format');
    }

    const result = await this.productModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'Product deleted successfully',
    };
  }

  async updateStock(id: string, quantity: number, operation: 'add' | 'subtract' | 'set'): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid product ID format');
    }

    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Note: Stock management should be handled by the inventory service
    // This method should ideally call the inventory service's stock movement methods
    // For now, we'll just return the product without modifying stock
    // as stock is managed in the inventory collection, not on products

    return product;
  }

  async getLowStockProducts(threshold?: number): Promise<Product[]> {
    // Note: Low stock should be determined by checking inventory records
    // For now, return empty array since stock is managed in inventory collection
    return [];
  }

  async getProductStats(): Promise<{
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    lowStockProducts: number;
    totalValue: number;
  }> {
    const [stats] = await this.productModel.aggregate([
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          activeProducts: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          inactiveProducts: {
            $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
          },
          // Note: lowStockProducts and totalValue should be calculated from inventory records
          lowStockProducts: { $sum: 0 }, // Placeholder
          totalValue: { $sum: 0 } // Placeholder
        }
      }
    ]);

    return stats || {
      totalProducts: 0,
      activeProducts: 0,
      inactiveProducts: 0,
      lowStockProducts: 0,
      totalValue: 0,
    };
  }
}
