const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const srcDir = path.join(__dirname, 'src');

const moveMap = {
    // Auth
    'controllers/authController.js': 'modules/auth/controllers/authController.js',
    'services/authService.js': 'modules/auth/services/authService.js',
    'services/emailVerificationService.js': 'modules/auth/services/emailVerificationService.js',
    'services/passwordResetService.js': 'modules/auth/services/passwordResetService.js',
    'routes/authRoutes.js': 'modules/auth/routes/authRoutes.js',
    'validators/authValidator.js': 'modules/auth/validators/authValidator.js',
    'models/RefreshToken.js': 'modules/auth/models/RefreshToken.js',
    'models/EmailVerificationToken.js': 'modules/auth/models/EmailVerificationToken.js',
    'models/PasswordResetToken.js': 'modules/auth/models/PasswordResetToken.js',
    'repositories/refreshTokenRepository.js': 'modules/auth/repositories/refreshTokenRepository.js',
    'repositories/emailVerificationTokenRepository.js': 'modules/auth/repositories/emailVerificationTokenRepository.js',
    'repositories/passwordResetTokenRepository.js': 'modules/auth/repositories/passwordResetTokenRepository.js',
    'templates/emails/welcomeEmail.js': 'modules/auth/templates/emails/welcomeEmail.js',
    'templates/emails/passwordResetEmail.js': 'modules/auth/templates/emails/passwordResetEmail.js',
    'middlewares/loginRateLimiter.js': 'modules/auth/middlewares/loginRateLimiter.js',
    'middlewares/registerRateLimiter.js': 'modules/auth/middlewares/registerRateLimiter.js',
    'middlewares/refreshTokenRateLimiter.js': 'modules/auth/middlewares/refreshTokenRateLimiter.js',
    'middlewares/resendVerificationRateLimiter.js': 'modules/auth/middlewares/resendVerificationRateLimiter.js',
    'middlewares/forgotPasswordRateLimiter.js': 'modules/auth/middlewares/forgotPasswordRateLimiter.js',

    // Users
    'models/User.js': 'modules/users/models/User.js',
    'repositories/userRepository.js': 'modules/users/repositories/userRepository.js',

    // Authors
    'models/Author.js': 'modules/authors/models/Author.js',
    'repositories/authorRepository.js': 'modules/authors/repositories/authorRepository.js',
    'controllers/authorController.js': 'modules/authors/controllers/authorController.js',
    'services/authorService.js': 'modules/authors/services/authorService.js',
    'validators/authorValidator.js': 'modules/authors/validators/authorValidator.js',
    'routes/authorRoutes.js': 'modules/authors/routes/authorRoutes.js',

    // Books
    'models/Book.js': 'modules/books/models/Book.js',
    'repositories/bookRepository.js': 'modules/books/repositories/bookRepository.js',
    'controllers/bookControllers.js': 'modules/books/controllers/bookControllers.js',
    'services/bookService.js': 'modules/books/services/bookService.js',
    'validators/bookValidator.js': 'modules/books/validators/bookValidator.js',
    'routes/bookRoutes.js': 'modules/books/routes/bookRoutes.js',
    'helpers/bookQueryHelper.js': 'modules/books/helpers/bookQueryHelper.js',

    // Infrastructure
    'config/redis.js': 'infrastructure/redis/redis.js',
    'services/redisService.js': 'infrastructure/redis/redisService.js',
    'config/mail.js': 'infrastructure/email/mail.js',
    'services/emailService.js': 'infrastructure/email/emailService.js',
    'config/cloudinary.js': 'infrastructure/cloudinary/cloudinary.js',
    'services/cloudinaryService.js': 'infrastructure/cloudinary/cloudinaryService.js',

    // Shared
    'config/cors.js': 'shared/config/cors.js',
    'config/db.js': 'shared/config/db.js',
    'config/logger.js': 'shared/config/logger.js',
    'config/rateLimiter.js': 'shared/config/rateLimiter.js',
    'constants/httpStatus.js': 'shared/constants/httpStatus.js',
    'errors/AppError.js': 'shared/errors/AppError.js',
    'errors/BadRequestError.js': 'shared/errors/BadRequestError.js',
    'errors/ForbiddenError.js': 'shared/errors/ForbiddenError.js',
    'errors/NotFoundError.js': 'shared/errors/NotFoundError.js',
    'errors/UnauthorizedError.js': 'shared/errors/UnauthorizedError.js',
    'errors/ValidationError.js': 'shared/errors/ValidationError.js',
    'helpers/bearerTokenHelper.js': 'shared/helpers/bearerTokenHelper.js',
    'helpers/cacheKeyHelper.js': 'shared/helpers/cacheKeyHelper.js',
    'helpers/pickHelper.js': 'shared/helpers/pickHelper.js',
    'middlewares/authorizeMiddleware.js': 'shared/middlewares/authorizeMiddleware.js',
    'middlewares/checkApiKey.js': 'shared/middlewares/checkApiKey.js',
    'middlewares/errorMiddleware.js': 'shared/middlewares/errorMiddleware.js',
    'middlewares/logger.js': 'shared/middlewares/logger.js',
    'middlewares/protectMiddleware.js': 'shared/middlewares/protectMiddleware.js',
    'middlewares/rateLimiter.js': 'shared/middlewares/rateLimiter.js',
    'middlewares/requestLogger.js': 'shared/middlewares/requestLogger.js',
    'middlewares/upload.js': 'shared/middlewares/upload.js',
    'middlewares/uploadMiddleware.js': 'shared/middlewares/uploadMiddleware.js',
    'middlewares/validationMiddleware.js': 'shared/middlewares/validationMiddleware.js',
    'utils/asyncHandler.js': 'shared/utils/asyncHandler.js',
    'utils/response.js': 'shared/utils/response.js',
    'validators/imageValidator.js': 'shared/validators/imageValidator.js',
    'routes/healthRoutes.js': 'shared/routes/healthRoutes.js',
};

// Map old absolute path -> new absolute path
const absMoveMap = {};
for (const [oldRel, newRel] of Object.entries(moveMap)) {
    const p1 = path.join(srcDir, oldRel);
    const p2 = path.join(srcDir, newRel);
    absMoveMap[p1] = p2;
}

// Function to get the final path for a file
function getNewAbsPath(oldAbsPath) {
    return absMoveMap[oldAbsPath] || oldAbsPath;
}

// Read all files before moving to cache their AST/contents and their OLD locations
function getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, fileList);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.md')) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

const allFiles = getAllFiles(srcDir);
const fileContents = {};

for (const f of allFiles) {
    if (f.endsWith('.js')) {
        fileContents[f] = fs.readFileSync(f, 'utf8');
    }
}

// Now compute the new contents before moving anything!
const newContents = {};
let importsUpdated = 0;

for (const [oldFilePath, content] of Object.entries(fileContents)) {
    const newFilePath = getNewAbsPath(oldFilePath);
    
    // Replace requires
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    let changed = false;
    let modifiedContent = content.replace(requireRegex, (match, requiredPath) => {
        if (!requiredPath.startsWith('.')) return match; // Not a local import
        
        // 1. Resolve old required file path
        let absRequiredPath = path.resolve(path.dirname(oldFilePath), requiredPath);
        if (!absRequiredPath.endsWith('.js')) {
            if (fs.existsSync(absRequiredPath + '.js')) {
                absRequiredPath += '.js';
            } else if (fs.existsSync(path.join(absRequiredPath, 'index.js'))) {
                absRequiredPath = path.join(absRequiredPath, 'index.js');
            }
        }
        
        // 2. What is the NEW absolute path of this required file?
        const newAbsRequiredPath = getNewAbsPath(absRequiredPath);
        
        // 3. Compute relative path from newFilePath to newAbsRequiredPath
        let newRelRequire = path.relative(path.dirname(newFilePath), newAbsRequiredPath).replace(/\\/g, '/');
        if (!newRelRequire.startsWith('.')) {
            newRelRequire = './' + newRelRequire;
        }
        
        // Preserve or remove .js based on original
        if (newRelRequire.endsWith('.js') && !requiredPath.endsWith('.js')) {
            newRelRequire = newRelRequire.slice(0, -3);
        }
        
        if (requiredPath !== newRelRequire) {
            changed = true;
            importsUpdated++;
            return `require("${newRelRequire}")`;
        }
        return match;
    });
    
    newContents[oldFilePath] = modifiedContent;
}

// 1. Move files physically
let filesMoved = 0;
for (const [oldRel, newRel] of Object.entries(moveMap)) {
    const fullOldPath = path.join(srcDir, oldRel);
    const fullNewPath = path.join(srcDir, newRel);

    if (fs.existsSync(fullOldPath)) {
        fs.mkdirSync(path.dirname(fullNewPath), { recursive: true });
        try {
            execSync(`git mv "${fullOldPath}" "${fullNewPath}"`, { cwd: __dirname });
        } catch (e) {
            fs.renameSync(fullOldPath, fullNewPath);
        }
        filesMoved++;
    }
}

// 2. Write updated contents
for (const [oldFilePath, content] of Object.entries(newContents)) {
    const newFilePath = getNewAbsPath(oldFilePath);
    // Write the new content to the new location
    if (fs.existsSync(newFilePath)) {
        fs.writeFileSync(newFilePath, content, 'utf8');
    }
}

// Also let's clean up old empty directories
function cleanEmptyFoldersRecursively(folder) {
    if (!fs.statSync(folder).isDirectory()) return;
    
    const files = fs.readdirSync(folder);
    if (files.length > 0) {
        files.forEach(file => cleanEmptyFoldersRecursively(path.join(folder, file)));
    }
    
    if (fs.readdirSync(folder).length === 0) {
        fs.rmdirSync(folder);
    }
}
cleanEmptyFoldersRecursively(srcDir);

console.log(JSON.stringify({ filesMoved, importsUpdated }));
