const CategoryService = require("./services/categoryService");
const CategoryRepository = require("./repositories/categoryRepository");

const categoryRepository = new CategoryRepository();
const categoryService = new CategoryService(categoryRepository);

module.exports = categoryService;