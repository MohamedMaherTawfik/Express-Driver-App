const NotFoundError = require("../../../shared/errors/NotFoundError");

class CategoryService {
    constructor(categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    async getCategories() {
        const categories = await this.categoryRepository.find();
        if (!categories || categories.length === 0) {
            throw new NotFoundError("Categories not found");
        }
        return categories;
    }

    async getCategoryById(id) {
        const category = await this.categoryRepository.findById(id);
        if (!category) {
            throw new NotFoundError("Category not found");
        }
        return category;
    }

    async getCategoryBySlug(slug) {
        const category = await this.categoryRepository.findBySlug(slug);
        if (!category) {
            throw new NotFoundError("Category not found");
        }
        return category;
    }

    async createCategory(category) {
        return await this.categoryRepository.create(category);
    }

    async updateCategory(id, category) {
        return await this.categoryRepository.update(id, category);
    }

    async deleteCategory(id) {
        return await this.categoryRepository.delete(id);
    }

    async deleteAllCategories() {
        return await this.categoryRepository.deleteAll();
    }
}

module.exports = CategoryService;