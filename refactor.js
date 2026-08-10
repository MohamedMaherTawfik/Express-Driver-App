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

// Also keep docs where they are.
// app.js and server.js remain in src.

// Create a map from old relative paths (from src) to new relative paths.
const newLocations = {};
for (const [oldPath, newPath] of Object.entries(moveMap)) {
    // Both are relative to src
    newLocations[oldPath.replace(/\\/g, '/')] = newPath.replace(/\\/g, '/');
}

// 1. Move files
let filesMoved = 0;
for (const [oldPath, newPath] of Object.entries(moveMap)) {
    const fullOldPath = path.join(srcDir, oldPath);
    const fullNewPath = path.join(srcDir, newPath);

    if (fs.existsSync(fullOldPath)) {
        fs.mkdirSync(path.dirname(fullNewPath), { recursive: true });
        execSync(`git mv "${fullOldPath}" "${fullNewPath}"`, { cwd: __dirname });
        filesMoved++;
    }
}

// 2. Refactor imports
function getAllFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getAllFiles(fullPath, fileList);
        } else if (fullPath.endsWith('.js')) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

const allJsFiles = getAllFiles(srcDir);
let importsUpdated = 0;

for (const file of allJsFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // We need to find all require(...) statements
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    content = content.replace(requireRegex, (match, requiredPath) => {
        // If it's not a relative path, ignore
        if (!requiredPath.startsWith('.')) return match;

        // Determine the absolute path of the required file
        let absRequiredPath = path.resolve(path.dirname(file), requiredPath);
        
        // If the path doesn't have .js, it might be implicit
        if (!absRequiredPath.endsWith('.js')) {
            if (fs.existsSync(absRequiredPath + '.js')) {
                absRequiredPath += '.js';
            } else if (fs.existsSync(path.join(absRequiredPath, 'index.js'))) {
                absRequiredPath = path.join(absRequiredPath, 'index.js');
            }
        }

        // What was the old path of this required file relative to src?
        // Since we already moved files, `absRequiredPath` is currently pointing to a non-existent old location if it wasn't updated, 
        // OR it's pointing to the old location before we moved it? Wait, we moved it!
        // Actually, let's map the old absolute path to the old relative path, then to the new relative path, then compute the new relative requirement.

        // Actually, the simplest way is to check if the old relative path matches anything in `moveMap`.
        const relToSrcOld = path.relative(srcDir, absRequiredPath).replace(/\\/g, '/');
        
        // Let's see if relToSrcOld has .js
        let searchKey = relToSrcOld;
        if (!searchKey.endsWith('.js')) searchKey += '.js';

        if (newLocations[searchKey]) {
            const targetNewRelToSrc = newLocations[searchKey];
            const targetAbsNew = path.join(srcDir, targetNewRelToSrc);
            
            let newRequiredPath = path.relative(path.dirname(file), targetAbsNew).replace(/\\/g, '/');
            if (!newRequiredPath.startsWith('.')) {
                newRequiredPath = './' + newRequiredPath;
            }
            if (newRequiredPath.endsWith('.js') && !requiredPath.endsWith('.js')) {
                 newRequiredPath = newRequiredPath.slice(0, -3); // remove .js if it wasn't there
            }
            if (requiredPath !== newRequiredPath) {
                importsUpdated++;
                changed = true;
                return `require("${newRequiredPath}")`;
            }
        } else {
             // Maybe it's referring to app.js, server.js, docs which didn't move.
             // We still need to update the path if the file *itself* moved.
             // What was the old location of `file`?
             // But `file` is already at its new location! So `path.dirname(file)` is the new directory.
             // If `requiredPath` was pointing to `app.js` from `src/controllers`, it was `../app`.
             // Now from `src/modules/auth/controllers`, it should be `../../../app`.
             
             // Wait, our `absRequiredPath` logic used `path.dirname(file)` which is the NEW location.
             // If the code still has `require('../app')`, resolving `../app` from `modules/auth/controllers` gives `modules/auth/app.js` which is WRONG.
             // We need to resolve the require based on the OLD location of the file!
        }

        return match;
    });

    if (changed) {
        fs.writeFileSync(file, content);
    }
}

console.log(JSON.stringify({ filesMoved, importsUpdated }));
