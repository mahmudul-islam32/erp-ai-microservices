import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryInput, UpdateCategoryInput, CategoryFilterInput } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
  ) {}

  async createCategory(createCategoryInput: CreateCategoryInput): Promise<Category> {
    try {
      // Check if category name already exists
      const existingCategory = await this.categoryModel.findOne({ name: createCategoryInput.name });
      if (existingCategory) {
        throw new ConflictException(`Category with name '${createCategoryInput.name}' already exists`);
      }

      // Check if category code already exists (if provided)
      if (createCategoryInput.code) {
        const existingCode = await this.categoryModel.findOne({ code: createCategoryInput.code });
        if (existingCode) {
          throw new ConflictException(`Category with code '${createCategoryInput.code}' already exists`);
        }
      }

      // Convert parentId string to ObjectId if provided
      const categoryData: any = { ...createCategoryInput };
      if (createCategoryInput.parentId) {
        categoryData.parentId = new Types.ObjectId(createCategoryInput.parentId);
      }

      const newCategory = new this.categoryModel(categoryData);
      return await newCategory.save();
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Failed to create category: ' + error.message);
    }
  }

  async findAllCategories(
    filter?: CategoryFilterInput,
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'sortOrder',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Promise<{ categories: Category[], total: number, page: number, totalPages: number }> {
    try {
      const query: any = {};

      // Apply filters with strict validation
      if (filter && typeof filter === 'object') {
        // Only add parentId if it's a valid ObjectId
        if (filter.parentId) {
          const parentIdStr = String(filter.parentId).trim();
          if (parentIdStr && parentIdStr !== '' && Types.ObjectId.isValid(parentIdStr)) {
            query.parentId = new Types.ObjectId(parentIdStr);
          }
        }
        
        // Handle isActive filter
        if (filter.isActive !== undefined && filter.isActive !== null) {
          query.isActive = filter.isActive;
        }
        
        // Handle search filter
        if (filter.search && String(filter.search).trim() !== '') {
          const searchStr = String(filter.search).trim();
          query.$or = [
            { name: { $regex: searchStr, $options: 'i' } },
            { description: { $regex: searchStr, $options: 'i' } },
            { code: { $regex: searchStr, $options: 'i' } },
          ];
        }
      }

      const skip = (page - 1) * limit;
      const sortOptions: any = {};
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

      const [categories, total] = await Promise.all([
        this.categoryModel
          .find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .exec(),
        this.categoryModel.countDocuments(query),
      ]);

      // Manually populate parentId only for valid ObjectIds to avoid cast errors
      const populatedCategories = await Promise.all(
        categories.map(async (category) => {
          if (category.parentId && Types.ObjectId.isValid(category.parentId.toString())) {
            try {
              await category.populate('parentId');
            } catch (err) {
              // If populate fails, just keep the ID
            }
          }
          return category;
        })
      );

      return {
        categories: populatedCategories,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      console.error('Error in findAllCategories:', error);
      // Return empty result instead of throwing
      return {
        categories: [],
        total: 0,
        page,
        totalPages: 0,
      };
    }
  }

  async findCategoryById(id: string): Promise<Category> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID format');
    }

    const category = await this.categoryModel
      .findById(id)
      .populate('parentId')
      .exec();

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async findCategoryByCode(code: string): Promise<Category> {
    const category = await this.categoryModel
      .findOne({ code })
      .populate('parentId')
      .exec();

    if (!category) {
      throw new NotFoundException(`Category with code ${code} not found`);
    }

    return category;
  }

  async updateCategory(id: string, updateCategoryInput: UpdateCategoryInput): Promise<Category> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID format');
    }

    // Check if name already exists (excluding current category)
    if (updateCategoryInput.name) {
      const existingCategory = await this.categoryModel.findOne({
        name: updateCategoryInput.name,
        _id: { $ne: id },
      });
      if (existingCategory) {
        throw new ConflictException(`Category with name '${updateCategoryInput.name}' already exists`);
      }
    }

    // Check if code already exists (excluding current category)
    if (updateCategoryInput.code) {
      const existingCode = await this.categoryModel.findOne({
        code: updateCategoryInput.code,
        _id: { $ne: id },
      });
      if (existingCode) {
        throw new ConflictException(`Category with code '${updateCategoryInput.code}' already exists`);
      }
    }

    // Convert parentId string to ObjectId if provided
    const updateData: any = { ...updateCategoryInput };
    if (updateCategoryInput.parentId) {
      updateData.parentId = new Types.ObjectId(updateCategoryInput.parentId);
    }

    const updatedCategory = await this.categoryModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('parentId')
      .exec();

    if (!updatedCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid category ID format');
    }

    // Check if category has child categories
    const childCategories = await this.categoryModel.find({ parentId: new Types.ObjectId(id) });
    if (childCategories.length > 0) {
      throw new BadRequestException('Cannot delete category that has child categories');
    }

    // Check if category is being used by products (you'll need to implement this check)
    // For now, we'll just delete the category

    const result = await this.categoryModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return {
      success: true,
      message: 'Category deleted successfully',
    };
  }

  async findRootCategories(): Promise<Category[]> {
    return await this.categoryModel
      .find({ parentId: { $exists: false } })
      .sort({ sortOrder: 1 })
      .exec();
  }

  async findChildCategories(parentId: string): Promise<Category[]> {
    if (!Types.ObjectId.isValid(parentId)) {
      throw new BadRequestException('Invalid parent ID format');
    }

    return await this.categoryModel
      .find({ parentId: new Types.ObjectId(parentId) })
      .sort({ sortOrder: 1 })
      .exec();
  }

  async getCategoryTree(): Promise<any[]> {
    const categories = await this.categoryModel
      .find({ isActive: true })
      .sort({ sortOrder: 1 })
      .populate('parentId')
      .exec();

    // Build tree structure
    const categoryMap = new Map();
    const tree = [];

    // First pass: create all nodes
    categories.forEach(category => {
      categoryMap.set(category._id.toString(), {
        ...category.toObject(),
        children: []
      });
    });

    // Second pass: build tree
    categories.forEach(category => {
      const node = categoryMap.get(category._id.toString());
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId.toString());
        if (parent) {
          parent.children.push(node);
        }
      } else {
        tree.push(node);
      }
    });

    return tree;
  }

  async getCategoryStats(): Promise<{
    totalCategories: number;
    activeCategories: number;
    inactiveCategories: number;
    rootCategories: number;
  }> {
    const [stats] = await this.categoryModel.aggregate([
      {
        $group: {
          _id: null,
          totalCategories: { $sum: 1 },
          activeCategories: {
            $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
          },
          inactiveCategories: {
            $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
          },
          rootCategories: {
            $sum: { $cond: [{ $not: ['$parentId'] }, 1, 0] }
          }
        }
      }
    ]);

    return stats || {
      totalCategories: 0,
      activeCategories: 0,
      inactiveCategories: 0,
      rootCategories: 0,
    };
  }
}
