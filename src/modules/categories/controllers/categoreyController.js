const categoryService = require("../container/categoryContainer");
const asyncHandler = require("../../../shared/utils/asyncHandler");
const ApiResponse = require("../../../shared/utils/response");

class CategoryController {
    getAll = asyncHandler(async(req, res) => {
        const categories = await categoryService.getCategories();
        return ApiResponse.ok(res, categories, "Categories fetched successfully");
    });

    getCategoryById = asyncHandler(async(req, res) => {
        const category = await categoryService.getCategoryById(req.params.id);
        return ApiResponse.ok(res, category, "Category fetched successfully");
    });

    getCategoryBySlug = asyncHandler(async(req, res) => {
        const category = await categoryService.getCategoryBySlug(req.params.slug);
        return ApiResponse.ok(res, category, "Category fetched successfully");
    });

    createCategory = asyncHandler(async(req, res) => {
        const category = await categoryService.createCategory(req.body);
        return ApiResponse.created(res, category, "Category created successfully");
    });

    updateCategory = asyncHandler(async(req, res) => {
        const category = await categoryService.updateCategory(req.params.id, req.body);
        return ApiResponse.ok(res, category, "Category updated successfully");
    });

    deleteCategory = asyncHandler(async(req, res) => {
        const category = await categoryService.deleteCategory(req.params.id);
        return ApiResponse.ok(res, category, "Category deleted successfully");
    });

    deleteAllCategories = asyncHandler(async(req, res) => {
        const categories = await categoryService.deleteAllCategories();
        return ApiResponse.ok(res, categories, "Categories deleted successfully");
    });
}

module.exports = new CategoryController();