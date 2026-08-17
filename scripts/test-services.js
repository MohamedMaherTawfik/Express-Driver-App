const Module = require("module");
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
    if (id === "ioredis") {
        const EventEmitter = require("events");
        class MockRedis extends EventEmitter {
            constructor() { super(); }
            on() { return this; }
            once() { return this; }
            quit() { return Promise.resolve(); }
        }
        return MockRedis;
    }
    if (id === "bullmq") {
        class MockQueue {
            constructor() {}
            add() { return Promise.resolve(); }
        }
        class MockWorker {
            constructor() {}
        }
        return { Queue: MockQueue, Worker: MockWorker };
    }
    return originalRequire.apply(this, arguments);
};

const assert = require("assert");
const { SERVICE_TYPE, SERVICE_STATUS, VEHICLE_TYPE } = require("../src/modules/services/constants/serviceConstants");
const serviceService = require("../src/modules/services/services/serviceService");
const serviceRepository = require("../src/modules/services/repositories/serviceRepository");
const serviceRoutes = require("../src/modules/services/routes/serviceRoutes");
const BadRequestError = require("../src/shared/errors/BadRequestError");
const NotFoundError = require("../src/shared/errors/NotFoundError");

async function runTests() {
    console.log("=== STARTING SERVICES MODULE COMPREHENSIVE TEST SUITE ===");
    let passed = 0;
    let failed = 0;

    async function test(name, fn) {
        try {
            await fn();
            console.log(`  ✓ PASS: ${name}`);
            passed++;
        } catch (err) {
            console.error(`  ✗ FAIL: ${name}`);
            console.error(`    ${err.message}`);
            failed++;
        }
    }

    // 1. Constants single source of truth verification
    await test("1. Constants single source of truth: VEHICLE_TYPE must match vehicle module", async () => {
        const { VEHICLE_TYPE: VT_FROM_VEHICLE } = require("../src/modules/vehicles/constants/vehicleConstants");
        assert.deepStrictEqual(VEHICLE_TYPE, VT_FROM_VEHICLE, "VEHICLE_TYPE must match vehicleConstants");
        assert.ok(Object.values(SERVICE_TYPE).includes("delivery"));
        assert.ok(Object.values(SERVICE_TYPE).includes("express_delivery"));
        assert.ok(Object.values(SERVICE_TYPE).includes("ride"));
        assert.ok(Object.values(SERVICE_TYPE).includes("freight"));
        assert.ok(Object.values(SERVICE_TYPE).includes("courier"));
        assert.ok(Object.values(SERVICE_STATUS).includes("active"));
        assert.ok(Object.values(SERVICE_STATUS).includes("inactive"));
    });

    // 2. Service creation validation - Missing name
    await test("2. Create service: missing name should throw BadRequestError", async () => {
        await assert.rejects(
            async () => {
                await serviceService.createService({
                    type: SERVICE_TYPE.DELIVERY,
                    basePrice: 15,
                });
            },
            (err) => err instanceof BadRequestError && err.message.includes("Service name is required")
        );
    });

    // 3. Service creation validation - Invalid type
    await test("3. Create service: invalid type should throw BadRequestError", async () => {
        await assert.rejects(
            async () => {
                await serviceService.createService({
                    name: "Super Fast Delivery",
                    type: "spaceship_ride",
                    basePrice: 20,
                });
            },
            (err) => err instanceof BadRequestError && err.message.includes("Service type is invalid")
        );
    });

    // 4. Service creation validation - Negative base price
    await test("4. Create service: negative basePrice should throw BadRequestError", async () => {
        await assert.rejects(
            async () => {
                await serviceService.createService({
                    name: "Express Delivery",
                    type: SERVICE_TYPE.EXPRESS_DELIVERY,
                    basePrice: -5,
                });
            },
            (err) => err instanceof BadRequestError && err.message.includes("Base price is required and cannot be negative")
        );
    });

    // 5. Service creation validation - Negative pricePerKm and pricePerMinute
    await test("5. Create service: negative pricePerKm/pricePerMinute throws BadRequestError", async () => {
        await assert.rejects(
            async () => {
                await serviceService.createService({
                    name: "Express Delivery",
                    type: SERVICE_TYPE.EXPRESS_DELIVERY,
                    basePrice: 10,
                    pricePerKm: -2,
                });
            },
            (err) => err instanceof BadRequestError && err.message.includes("Price per kilometer cannot be negative")
        );

        await assert.rejects(
            async () => {
                await serviceService.createService({
                    name: "Express Delivery",
                    type: SERVICE_TYPE.EXPRESS_DELIVERY,
                    basePrice: 10,
                    pricePerMinute: -1,
                });
            },
            (err) => err instanceof BadRequestError && err.message.includes("Price per minute cannot be negative")
        );
    });

    // 6. Service creation validation - Invalid vehicle type in allowedVehicleTypes
    await test("6. Create service: invalid vehicle type in allowedVehicleTypes should throw BadRequestError", async () => {
        await assert.rejects(
            async () => {
                await serviceService.createService({
                    name: "Bike Delivery",
                    type: SERVICE_TYPE.DELIVERY,
                    basePrice: 10,
                    allowedVehicleTypes: ["hoverboard"],
                });
            },
            (err) => err instanceof BadRequestError && err.message.includes("Invalid vehicle type 'hoverboard'")
        );
    });

    // 7. Mocked successful creation, slug generation and duplicate check
    await test("7. Create service: valid payload generates normalized slug and calls repository", async () => {
        let createdPayload = null;
        const originalCreate = serviceRepository.create;
        const originalFindBySlug = serviceRepository.findBySlug;
        const originalFindOne = serviceRepository.findOne;

        serviceRepository.findBySlug = async () => null;
        serviceRepository.findOne = async () => null;
        serviceRepository.create = async (data) => {
            createdPayload = data;
            return { _id: "660000000000000000000001", ...data };
        };

        try {
            const service = await serviceService.createService({
                name: "Standard Delivery",
                description: "Standard on-demand package delivery",
                type: SERVICE_TYPE.DELIVERY,
                basePrice: 15,
                pricePerKm: 2.5,
                pricePerMinute: 0.5,
                estimatedDurationMin: 30,
                allowedVehicleTypes: [VEHICLE_TYPE.SEDAN, VEHICLE_TYPE.MOTORCYCLE],
            });

            assert.ok(service._id);
            assert.strictEqual(service.slug, "standard-delivery");
            assert.strictEqual(service.name, "Standard Delivery");
            assert.strictEqual(service.basePrice, 15);
            assert.strictEqual(service.status, SERVICE_STATUS.ACTIVE);
            assert.strictEqual(service.isActive, true);
            assert.deepStrictEqual(service.allowedVehicleTypes, [VEHICLE_TYPE.SEDAN, VEHICLE_TYPE.MOTORCYCLE]);
        } finally {
            serviceRepository.create = originalCreate;
            serviceRepository.findBySlug = originalFindBySlug;
            serviceRepository.findOne = originalFindOne;
        }
    });

    // 8. Duplicate slug rejection
    await test("8. Create service: duplicate slug throws BadRequestError", async () => {
        const originalFindBySlug = serviceRepository.findBySlug;
        serviceRepository.findBySlug = async () => ({ _id: "1", slug: "standard-delivery" });

        try {
            await assert.rejects(
                async () => {
                    await serviceService.createService({
                        name: "Standard Delivery",
                        type: SERVICE_TYPE.DELIVERY,
                        basePrice: 15,
                    });
                },
                (err) => err instanceof BadRequestError && err.message.includes("slug already exists")
            );
        } finally {
            serviceRepository.findBySlug = originalFindBySlug;
        }
    });

    // 9. Duplicate name rejection
    await test("9. Create service: duplicate name throws BadRequestError", async () => {
        const originalFindBySlug = serviceRepository.findBySlug;
        const originalFindOne = serviceRepository.findOne;
        serviceRepository.findBySlug = async () => null;
        serviceRepository.findOne = async () => ({ _id: "1", name: "Standard Delivery" });

        try {
            await assert.rejects(
                async () => {
                    await serviceService.createService({
                        name: "Standard Delivery",
                        type: SERVICE_TYPE.DELIVERY,
                        basePrice: 15,
                    });
                },
                (err) => err instanceof BadRequestError && err.message.includes("name already exists")
            );
        } finally {
            serviceRepository.findBySlug = originalFindBySlug;
            serviceRepository.findOne = originalFindOne;
        }
    });

    // 10. Get service by ID - regular user cannot see inactive service
    await test("10. Get service by ID: regular user cannot see inactive service (throws NotFoundError)", async () => {
        const originalFindById = serviceRepository.findById;
        serviceRepository.findById = async () => ({
            _id: "660000000000000000000001",
            name: "Old Service",
            isActive: false,
            status: SERVICE_STATUS.INACTIVE,
        });

        try {
            await assert.rejects(
                async () => {
                    await serviceService.getServiceById("660000000000000000000001", "user");
                },
                (err) => err instanceof NotFoundError
            );

            // Admin can see it
            const adminResult = await serviceService.getServiceById("660000000000000000000001", "admin");
            assert.strictEqual(adminResult.name, "Old Service");
        } finally {
            serviceRepository.findById = originalFindById;
        }
    });

    // 11. Get service by Slug
    await test("11. Get service by Slug: resolves slug and respects active state for regular user", async () => {
        const originalFindBySlug = serviceRepository.findBySlug;
        serviceRepository.findBySlug = async (slug) => {
            if (slug === "active-service") {
                return { _id: "1", slug: "active-service", isActive: true, status: SERVICE_STATUS.ACTIVE };
            }
            if (slug === "inactive-service") {
                return { _id: "2", slug: "inactive-service", isActive: false, status: SERVICE_STATUS.INACTIVE };
            }
            return null;
        };

        try {
            const active = await serviceService.getServiceBySlug("active-service", "user");
            assert.strictEqual(active.slug, "active-service");

            await assert.rejects(
                async () => {
                    await serviceService.getServiceBySlug("inactive-service", "user");
                },
                (err) => err instanceof NotFoundError
            );

            const adminView = await serviceService.getServiceBySlug("inactive-service", "admin");
            assert.strictEqual(adminView.slug, "inactive-service");
        } finally {
            serviceRepository.findBySlug = originalFindBySlug;
        }
    });

    // 12. Get services list - regular user gets only active services
    await test("12. Get services: regular user receives only active services", async () => {
        const originalFindMany = serviceRepository.findMany;
        let capturedFilter = null;
        let capturedSort = null;
        let capturedSkip = null;
        let capturedLimit = null;

        serviceRepository.findMany = async ({ filter, sort, skip, limit }) => {
            capturedFilter = filter;
            capturedSort = sort;
            capturedSkip = skip;
            capturedLimit = limit;
            return { items: [], total: 0 };
        };

        try {
            await serviceService.getServices({ page: 2, limit: 5, sort: "name", type: "delivery" }, "user");
            assert.strictEqual(capturedFilter.isActive, true);
            assert.strictEqual(capturedFilter.status, SERVICE_STATUS.ACTIVE);
            assert.strictEqual(capturedFilter.type, "delivery");
            assert.deepStrictEqual(capturedSort, { name: 1 });
            assert.strictEqual(capturedSkip, 5);
            assert.strictEqual(capturedLimit, 5);

            // Admin can filter arbitrarily
            await serviceService.getServices({ status: "inactive", isActive: "false", search: "fast" }, "admin");
            assert.strictEqual(capturedFilter.status, "inactive");
            assert.strictEqual(capturedFilter.isActive, false);
            assert.ok(capturedFilter.name);
        } finally {
            serviceRepository.findMany = originalFindMany;
        }
    });

    // 13. Update service: validation & duplicate checks
    await test("13. Update service: duplicate name in update throws BadRequestError", async () => {
        const originalFindById = serviceRepository.findById;
        const originalFindOne = serviceRepository.findOne;
        const originalUpdateById = serviceRepository.updateById;

        serviceRepository.findById = async () => ({
            _id: "660000000000000000000001",
            name: "Standard Delivery",
            slug: "standard-delivery",
        });

        serviceRepository.findOne = async (query) => {
            const hasExpressPattern = query.name && query.name.$regex && query.name.$regex.toString().includes("Express Delivery");
            if (query.name === "Express Delivery" || hasExpressPattern) {
                return { _id: "660000000000000000000002", name: "Express Delivery" };
            }
            return null;
        };

        serviceRepository.updateById = async () => {
            throw new Error("Should not reach updateById on validation failure");
        };

        try {
            await assert.rejects(
                async () => {
                    await serviceService.updateService("660000000000000000000001", {
                        name: "Express Delivery",
                    });
                },
                (err) => err instanceof BadRequestError && err.message.includes("name already exists")
            );
        } finally {
            serviceRepository.findById = originalFindById;
            serviceRepository.findOne = originalFindOne;
            serviceRepository.updateById = originalUpdateById;
        }
    });

    // 14. Update service: duplicate slug in update throws BadRequestError
    await test("14. Update service: duplicate slug in update throws BadRequestError", async () => {
        const originalFindById = serviceRepository.findById;
        const originalFindOne = serviceRepository.findOne;
        const originalUpdateById = serviceRepository.updateById;

        serviceRepository.findById = async () => ({
            _id: "660000000000000000000001",
            name: "Standard Delivery",
            slug: "standard-delivery",
        });

        serviceRepository.findOne = async ({ slug }) => {
            if (slug === "express-delivery") {
                return { _id: "660000000000000000000002", slug: "express-delivery" };
            }
            return null;
        };

        serviceRepository.updateById = async () => {
            throw new Error("Should not reach updateById on validation failure");
        };

        try {
            await assert.rejects(
                async () => {
                    await serviceService.updateService("660000000000000000000001", {
                        slug: "express-delivery",
                    });
                },
                (err) => err instanceof BadRequestError && err.message.includes("slug already exists")
            );
        } finally {
            serviceRepository.findById = originalFindById;
            serviceRepository.findOne = originalFindOne;
            serviceRepository.updateById = originalUpdateById;
        }
    });

    // 15. Safe deactivation vs hard delete
    await test("15. Delete service: default behavior is safe deactivation (isActive: false, status: inactive)", async () => {
        const originalFindById = serviceRepository.findById;
        const originalUpdateById = serviceRepository.updateById;
        const originalDeleteById = serviceRepository.deleteById;

        let updatedFields = null;
        let deletedId = null;

        serviceRepository.findById = async () => ({
            _id: "660000000000000000000001",
            name: "Standard Delivery",
        });

        serviceRepository.updateById = async (id, data) => {
            updatedFields = data;
            return { _id: id, ...data };
        };

        serviceRepository.deleteById = async (id) => {
            deletedId = id;
            return true;
        };

        try {
            // Default delete -> safe deactivation
            await serviceService.deleteService("660000000000000000000001", { hardDelete: false });
            assert.strictEqual(updatedFields.isActive, false);
            assert.strictEqual(updatedFields.status, SERVICE_STATUS.INACTIVE);
            assert.strictEqual(deletedId, null);

            // Explicit hard delete
            await serviceService.deleteService("660000000000000000000001", { hardDelete: true });
            assert.strictEqual(deletedId, "660000000000000000000001");
        } finally {
            serviceRepository.findById = originalFindById;
            serviceRepository.updateById = originalUpdateById;
            serviceRepository.deleteById = originalDeleteById;
        }
    });

    // 16. Service Routes & Endpoints structure validation
    await test("16. Routes structure: verify route handlers in serviceRoutes", async () => {
        const routes = serviceRoutes.stack
            .filter((layer) => layer.route)
            .map((layer) => ({
                path: layer.route.path,
                methods: Object.keys(layer.route.methods),
            }));

        const paths = routes.map((r) => r.path);
        assert.ok(paths.includes("/"), "Must contain root path /");
        assert.ok(paths.includes("/slug/:slug"), "Must contain /slug/:slug path");
        assert.ok(paths.includes("/:id"), "Must contain /:id path");

        const rootPost = routes.find((r) => r.path === "/" && r.methods.includes("post"));
        const rootGet = routes.find((r) => r.path === "/" && r.methods.includes("get"));
        const patchId = routes.find((r) => r.path === "/:id" && r.methods.includes("patch"));
        const deleteId = routes.find((r) => r.path === "/:id" && r.methods.includes("delete"));

        assert.ok(rootPost, "POST / must be defined");
        assert.ok(rootGet, "GET / must be defined");
        assert.ok(patchId, "PATCH /:id must be defined");
        assert.ok(deleteId, "DELETE /:id must be defined");
    });

    console.log(`\n=== ALL TESTS COMPLETED: ${passed} passed, ${failed} failed ===\n`);
    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runTests().catch((err) => {
    console.error("FATAL TEST RUNNER ERROR:", err);
    process.exit(1);
});
