const fs = require("fs");
const path = require("path");

const moduleName = process.argv[2];

if (!moduleName) {
    console.error("❌ Module name is required");
    process.exit(1);
}

if (!/^[a-z][a-zA-Z0-9]*$/.test(moduleName)) {
    console.error("❌ Invalid module name");
    process.exit(1);
}

function singularize(name) {
    if (name.endsWith("ies")) {
        return name.slice(0, -3) + "y";
    }

    if (name.endsWith("s")) {
        return name.slice(0, -1);
    }

    return name;
}

const modulesPath = path.join(
    __dirname,
    "..",
    "src",
    "modules"
);

const modulePath = path.join(
    modulesPath,
    moduleName
);

if (fs.existsSync(modulePath)) {
    console.error(
        `❌ Module "${moduleName}" already exists`
    );

    process.exit(1);
}

const folders = [
    "constants",
    "controllers",
    "models",
    "repositories",
    "routes",
    "services",
    "validators",
];

const singularName = singularize(moduleName);

const files = {
    constants: `${singularName}Constants.js`,
    controllers: `${singularName}Controller.js`,
    models: `${singularName}.js`,
    repositories: `${singularName}Repository.js`,
    routes: `${singularName}Routes.js`,
    services: `${singularName}Service.js`,
    validators: `${singularName}Validator.js`,
};

fs.mkdirSync(modulePath, {
    recursive: true,
});

for (const folder of folders) {
    const folderPath = path.join(
        modulePath,
        folder
    );

    fs.mkdirSync(folderPath, {
        recursive: true,
    });

    const filePath = path.join(
        folderPath,
        files[folder]
    );

    fs.writeFileSync(filePath, "");
}

console.log(
    `✅ Module "${moduleName}" created successfully.`
);