/**
 * Orders Module — Comprehensive Test Suite
 * Runs without Redis/MongoDB connection using mocked repositories.
 */

// ── Mock Redis / BullMQ to prevent connection errors ──────────────
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
        class MockQueue { constructor() {} add() { return Promise.resolve(); } }
        class MockWorker { constructor() {} }
        return { Queue: MockQueue, Worker: MockWorker };
    }
    return originalRequire.apply(this, arguments);
};

const assert = require("assert");

// Modules under test
const orderService = require("../src/modules/orders/services/orderService");
const orderRepository = require("../src/modules/orders/repositories/orderRepository");
const serviceRepository = require("../src/modules/services/repositories/serviceRepository");
const driverRepository = require("../src/modules/drivers/repositories/driverRepository");
const vehicleRepository = require("../src/modules/vehicles/repositories/vehicleRepository");
const notificationService = require("../src/modules/notifications/services/notificationService");

const {
    ORDER_STATUS,
    ORDER_STATUS_TRANSITIONS,
    USER_CANCELLABLE_STATUSES,
    TERMINAL_STATUSES,
    DRIVER_ALLOWED_TRANSITIONS,
} = require("../src/modules/orders/constants/orderConstants");

const BadRequestError = require("../src/shared/errors/BadRequestError");
const NotFoundError = require("../src/shared/errors/NotFoundError");
const ForbiddenError = require("../src/shared/errors/ForbiddenError");

// ── Helpers ───────────────────────────────────────────────────────
const MOCK_USER_ID = "660000000000000000000001";
const MOCK_USER2_ID = "660000000000000000000002";
const MOCK_SERVICE_ID = "660000000000000000000010";
const MOCK_ORDER_ID = "660000000000000000000020";
const MOCK_DRIVER_ID = "660000000000000000000030";
const MOCK_DRIVER2_ID = "660000000000000000000031";
const MOCK_VEHICLE_ID = "660000000000000000000040";
const MOCK_VEHICLE2_ID = "660000000000000000000041";

const mockUser = { _id: MOCK_USER_ID, role: "user", name: "Test User" };
const mockAdmin = { _id: MOCK_USER2_ID, role: "admin", name: "Admin" };

const mockService = {
    _id: MOCK_SERVICE_ID,
    name: "Standard Delivery",
    type: "delivery",
    status: "active",
    isActive: true,
    basePrice: 15,
    pricePerKm: 2,
    pricePerMinute: 0.5,
    allowedVehicleTypes: ["sedan", "motorcycle"],
};

const validPickup = {
    address: "123 Main St",
    latitude: 25.2048,
    longitude: 55.2708,
};

const validDropoff = {
    address: "456 Park Ave",
    latitude: 25.1972,
    longitude: 55.2796,
};

function makeMockOrder(overrides = {}) {
    return {
        _id: MOCK_ORDER_ID,
        orderNumber: "ORD-2026-000001",
        user: MOCK_USER_ID,
        service: MOCK_SERVICE_ID,
        serviceSnapshot: {
            name: "Standard Delivery",
            type: "delivery",
            basePrice: 15,
            pricePerKm: 2,
            pricePerMinute: 0.5,
            allowedVehicleTypes: ["sedan", "motorcycle"],
        },
        driver: null,
        vehicle: null,
        pickup: validPickup,
        dropoff: validDropoff,
        status: ORDER_STATUS.PENDING,
        pricing: { basePrice: 15, distancePrice: 0, timePrice: 0, serviceFee: 0, discount: 0, total: 15 },
        cancellation: null,
        ...overrides,
    };
}

// ── Test runner ───────────────────────────────────────────────────
async function runTests() {
    console.log("=== STARTING ORDERS MODULE COMPREHENSIVE TEST SUITE ===\n");
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

    // ── Silence notifications in all tests ───────────────────────
    notificationService.createNotification = async () => {};

    // ═══════════════════════════════════════════════════════════
    // 1. CONSTANTS
    // ═══════════════════════════════════════════════════════════
    await test("1. Constants: ORDER_STATUS has all required statuses", () => {
        const required = [
            "pending", "searching_driver", "driver_assigned", "driver_arriving",
            "driver_arrived", "picked_up", "in_transit", "delivered", "cancelled", "failed",
        ];
        for (const s of required) {
            assert.ok(Object.values(ORDER_STATUS).includes(s), `Missing status: ${s}`);
        }
    });

    await test("2. Constants: TERMINAL_STATUSES are non-transitionable", () => {
        for (const s of TERMINAL_STATUSES) {
            const transitions = ORDER_STATUS_TRANSITIONS[s];
            assert.deepStrictEqual(transitions, [], `${s} should have no transitions`);
        }
    });

    await test("3. Constants: USER_CANCELLABLE_STATUSES are a subset of non-terminal statuses", () => {
        for (const s of USER_CANCELLABLE_STATUSES) {
            assert.ok(!TERMINAL_STATUSES.includes(s), `${s} should not be terminal`);
        }
    });

    await test("4. Constants: DRIVER_ALLOWED_TRANSITIONS form a valid chain", () => {
        const chain = [
            [ORDER_STATUS.DRIVER_ASSIGNED, ORDER_STATUS.DRIVER_ARRIVING],
            [ORDER_STATUS.DRIVER_ARRIVING, ORDER_STATUS.DRIVER_ARRIVED],
            [ORDER_STATUS.DRIVER_ARRIVED, ORDER_STATUS.PICKED_UP],
            [ORDER_STATUS.PICKED_UP, ORDER_STATUS.IN_TRANSIT],
            [ORDER_STATUS.IN_TRANSIT, ORDER_STATUS.DELIVERED],
        ];
        for (const [from, to] of chain) {
            assert.strictEqual(DRIVER_ALLOWED_TRANSITIONS[from], to, `${from} → ${to} missing`);
        }
    });

    // ═══════════════════════════════════════════════════════════
    // 5. CREATE ORDER
    // ═══════════════════════════════════════════════════════════
    await test("5. Create order: valid payload creates order with service snapshot", async () => {
        const origFindById = serviceRepository.findById;
        const origCreate = orderRepository.create;
        const origNext = orderRepository.nextOrderNumber;

        serviceRepository.findById = async () => ({ ...mockService });
        orderRepository.nextOrderNumber = async () => "ORD-2026-000001";
        orderRepository.create = async (data) => ({ _id: MOCK_ORDER_ID, ...data });

        try {
            const order = await orderService.createOrder(
                { serviceId: MOCK_SERVICE_ID, pickup: validPickup, dropoff: validDropoff },
                mockUser
            );
            assert.strictEqual(order.orderNumber, "ORD-2026-000001");
            assert.strictEqual(order.user.toString(), MOCK_USER_ID);
            assert.strictEqual(order.status, ORDER_STATUS.PENDING);
            assert.strictEqual(order.serviceSnapshot.name, "Standard Delivery");
            assert.strictEqual(order.pricing.basePrice, 15);
            assert.strictEqual(order.pricing.total, 15);
            assert.strictEqual(order.pricing.distancePrice, 0);
            assert.strictEqual(order.driver, null);
            assert.strictEqual(order.vehicle, null);
        } finally {
            serviceRepository.findById = origFindById;
            orderRepository.create = origCreate;
            orderRepository.nextOrderNumber = origNext;
        }
    });

    await test("6. Create order: nonexistent service throws NotFoundError", async () => {
        const origFindById = serviceRepository.findById;
        serviceRepository.findById = async () => null;
        try {
            await assert.rejects(
                () => orderService.createOrder({ serviceId: MOCK_SERVICE_ID, pickup: validPickup, dropoff: validDropoff }, mockUser),
                (err) => err instanceof NotFoundError
            );
        } finally {
            serviceRepository.findById = origFindById;
        }
    });

    await test("7. Create order: inactive service throws BadRequestError", async () => {
        const origFindById = serviceRepository.findById;
        serviceRepository.findById = async () => ({ ...mockService, isActive: false, status: "inactive" });
        try {
            await assert.rejects(
                () => orderService.createOrder({ serviceId: MOCK_SERVICE_ID, pickup: validPickup, dropoff: validDropoff }, mockUser),
                (err) => err instanceof BadRequestError && err.message.includes("not currently available")
            );
        } finally {
            serviceRepository.findById = origFindById;
        }
    });

    await test("8. Create order: user comes from req.user, not req.body", async () => {
        const origFindById = serviceRepository.findById;
        const origCreate = orderRepository.create;
        const origNext = orderRepository.nextOrderNumber;

        serviceRepository.findById = async () => ({ ...mockService });
        orderRepository.nextOrderNumber = async () => "ORD-2026-000002";
        let capturedData = null;
        orderRepository.create = async (data) => { capturedData = data; return { _id: MOCK_ORDER_ID, ...data }; };

        try {
            await orderService.createOrder(
                { serviceId: MOCK_SERVICE_ID, pickup: validPickup, dropoff: validDropoff, user: "injected_user_id" },
                mockUser // actual user comes from here
            );
            assert.strictEqual(capturedData.user.toString(), MOCK_USER_ID, "User must come from requestingUser, not body");
        } finally {
            serviceRepository.findById = origFindById;
            orderRepository.create = origCreate;
            orderRepository.nextOrderNumber = origNext;
        }
    });

    await test("9. Create order: service snapshot is built from DB values, not client input", async () => {
        const origFindById = serviceRepository.findById;
        const origCreate = orderRepository.create;
        const origNext = orderRepository.nextOrderNumber;

        const dbService = { ...mockService, basePrice: 99.99, name: "DB Service Name" };
        serviceRepository.findById = async () => dbService;
        orderRepository.nextOrderNumber = async () => "ORD-2026-000003";
        let capturedData = null;
        orderRepository.create = async (data) => { capturedData = data; return { _id: MOCK_ORDER_ID, ...data }; };

        try {
            await orderService.createOrder(
                { serviceId: MOCK_SERVICE_ID, pickup: validPickup, dropoff: validDropoff },
                mockUser
            );
            assert.strictEqual(capturedData.serviceSnapshot.basePrice, 99.99);
            assert.strictEqual(capturedData.serviceSnapshot.name, "DB Service Name");
            assert.strictEqual(capturedData.pricing.basePrice, 99.99);
            assert.strictEqual(capturedData.pricing.total, 99.99);
        } finally {
            serviceRepository.findById = origFindById;
            orderRepository.create = origCreate;
            orderRepository.nextOrderNumber = origNext;
        }
    });

    // ═══════════════════════════════════════════════════════════
    // 10. GET ORDERS
    // ═══════════════════════════════════════════════════════════
    await test("10. Get orders: user receives only own orders", async () => {
        const origFindUserOrders = orderRepository.findUserOrders;
        let capturedUserId = null;
        orderRepository.findUserOrders = async ({ userId }) => {
            capturedUserId = userId;
            return { items: [], total: 0 };
        };
        try {
            await orderService.getOrders({}, mockUser);
            assert.strictEqual(capturedUserId.toString(), MOCK_USER_ID);
        } finally {
            orderRepository.findUserOrders = origFindUserOrders;
        }
    });

    await test("11. Get orders: admin receives all orders", async () => {
        const origFindMany = orderRepository.findMany;
        let called = false;
        orderRepository.findMany = async () => { called = true; return { items: [], total: 0 }; };
        try {
            await orderService.getOrders({}, mockAdmin);
            assert.ok(called, "Admin should use findMany (all orders)");
        } finally {
            orderRepository.findMany = origFindMany;
        }
    });

    await test("12. Get orders: driver receives only assigned orders", async () => {
        const origFindDriverOrders = orderRepository.findDriverOrders;
        let capturedDriverId = null;
        orderRepository.findDriverOrders = async ({ driverId }) => {
            capturedDriverId = driverId;
            return { items: [], total: 0 };
        };
        const mockDriver = { _id: MOCK_DRIVER_ID, status: "active" };
        try {
            await orderService.getOrders({}, mockUser, mockDriver);
            assert.strictEqual(capturedDriverId.toString(), MOCK_DRIVER_ID);
        } finally {
            orderRepository.findDriverOrders = origFindDriverOrders;
        }
    });

    await test("13. Get orders: invalid status filter throws BadRequestError", async () => {
        await assert.rejects(
            () => orderService.getOrders({ status: "flying" }, mockUser),
            (err) => err instanceof BadRequestError
        );
    });

    // ═══════════════════════════════════════════════════════════
    // 14. GET ORDER BY ID
    // ═══════════════════════════════════════════════════════════
    await test("14. Get order by ID: order not found throws NotFoundError", async () => {
        const origFindById = orderRepository.findById;
        orderRepository.findById = async () => null;
        try {
            await assert.rejects(
                () => orderService.getOrderById(MOCK_ORDER_ID, mockUser),
                (err) => err instanceof NotFoundError
            );
        } finally {
            orderRepository.findById = origFindById;
        }
    });

    await test("15. Get order by ID: user can view own order", async () => {
        const origFindById = orderRepository.findById;
        orderRepository.findById = async () => makeMockOrder({ user: { _id: MOCK_USER_ID } });
        try {
            const order = await orderService.getOrderById(MOCK_ORDER_ID, mockUser);
            assert.ok(order);
        } finally {
            orderRepository.findById = origFindById;
        }
    });

    await test("16. Get order by ID: user cannot view another user's order", async () => {
        const origFindById = orderRepository.findById;
        orderRepository.findById = async () => makeMockOrder({ user: { _id: MOCK_USER2_ID } });
        try {
            await assert.rejects(
                () => orderService.getOrderById(MOCK_ORDER_ID, mockUser),
                (err) => err instanceof ForbiddenError
            );
        } finally {
            orderRepository.findById = origFindById;
        }
    });

    await test("17. Get order by ID: admin can view any order", async () => {
        const origFindById = orderRepository.findById;
        orderRepository.findById = async () => makeMockOrder({ user: { _id: MOCK_USER_ID } });
        try {
            const order = await orderService.getOrderById(MOCK_ORDER_ID, mockAdmin);
            assert.ok(order);
        } finally {
            orderRepository.findById = origFindById;
        }
    });

    await test("18. Get order by ID: driver cannot view unassigned order", async () => {
        const origFindById = orderRepository.findById;
        orderRepository.findById = async () => makeMockOrder({ driver: null });
        const mockDriver = { _id: MOCK_DRIVER_ID, status: "active" };
        try {
            await assert.rejects(
                () => orderService.getOrderById(MOCK_ORDER_ID, mockUser, mockDriver),
                (err) => err instanceof ForbiddenError
            );
        } finally {
            orderRepository.findById = origFindById;
        }
    });

    // ═══════════════════════════════════════════════════════════
    // 19. CANCEL ORDER
    // ═══════════════════════════════════════════════════════════
    await test("19. Cancel order: user can cancel PENDING order", async () => {
        const origFindByIdRaw = orderRepository.findByIdRaw;
        const origUpdateStatusAtomic = orderRepository.updateStatusAtomic;
        orderRepository.findByIdRaw = async () => makeMockOrder({ status: ORDER_STATUS.PENDING });
        orderRepository.updateStatusAtomic = async (id, from, to, extra) => ({
            ...makeMockOrder(), status: to, cancellation: extra.cancellation
        });
        try {
            const order = await orderService.cancelOrder(MOCK_ORDER_ID, mockUser, "Changed mind");
            assert.strictEqual(order.status, ORDER_STATUS.CANCELLED);
        } finally {
            orderRepository.findByIdRaw = origFindByIdRaw;
            orderRepository.updateStatusAtomic = origUpdateStatusAtomic;
        }
    });

    await test("20. Cancel order: cannot cancel a DELIVERED order", async () => {
        const origFindByIdRaw = orderRepository.findByIdRaw;
        orderRepository.findByIdRaw = async () => makeMockOrder({ status: ORDER_STATUS.DELIVERED });
        try {
            await assert.rejects(
                () => orderService.cancelOrder(MOCK_ORDER_ID, mockUser),
                (err) => err instanceof BadRequestError && err.message.includes("delivered")
            );
        } finally {
            orderRepository.findByIdRaw = origFindByIdRaw;
        }
    });

    await test("21. Cancel order: cannot cancel an already CANCELLED order", async () => {
        const origFindByIdRaw = orderRepository.findByIdRaw;
        orderRepository.findByIdRaw = async () => makeMockOrder({ status: ORDER_STATUS.CANCELLED });
        try {
            await assert.rejects(
                () => orderService.cancelOrder(MOCK_ORDER_ID, mockUser),
                (err) => err instanceof BadRequestError
            );
        } finally {
            orderRepository.findByIdRaw = origFindByIdRaw;
        }
    });

    await test("22. Cancel order: user cannot cancel an IN_TRANSIT order", async () => {
        const origFindByIdRaw = orderRepository.findByIdRaw;
        orderRepository.findByIdRaw = async () => makeMockOrder({ status: ORDER_STATUS.IN_TRANSIT });
        try {
            await assert.rejects(
                () => orderService.cancelOrder(MOCK_ORDER_ID, mockUser),
                (err) => err instanceof BadRequestError
            );
        } finally {
            orderRepository.findByIdRaw = origFindByIdRaw;
        }
    });

    await test("23. Cancel order: user cannot cancel another user's order", async () => {
        const origFindByIdRaw = orderRepository.findByIdRaw;
        orderRepository.findByIdRaw = async () => makeMockOrder({ user: MOCK_USER2_ID, status: ORDER_STATUS.PENDING });
        try {
            await assert.rejects(
                () => orderService.cancelOrder(MOCK_ORDER_ID, mockUser),
                (err) => err instanceof ForbiddenError
            );
        } finally {
            orderRepository.findByIdRaw = origFindByIdRaw;
        }
    });

    await test("24. Cancel order: admin can cancel IN_TRANSIT order", async () => {
        const origFindByIdRaw = orderRepository.findByIdRaw;
        const origUpdateStatusAtomic = orderRepository.updateStatusAtomic;
        orderRepository.findByIdRaw = async () => makeMockOrder({ status: ORDER_STATUS.IN_TRANSIT, user: MOCK_USER_ID });
        orderRepository.updateStatusAtomic = async (id, from, to, extra) => ({
            ...makeMockOrder(), status: to
        });
        try {
            const order = await orderService.cancelOrder(MOCK_ORDER_ID, mockAdmin, "Safety issue");
            assert.strictEqual(order.status, ORDER_STATUS.CANCELLED);
        } finally {
            orderRepository.findByIdRaw = origFindByIdRaw;
            orderRepository.updateStatusAtomic = origUpdateStatusAtomic;
        }
    });

    // ═══════════════════════════════════════════════════════════
    // 25. STATUS TRANSITIONS
    // ═══════════════════════════════════════════════════════════
    await test("25. Status update: invalid transition is rejected", async () => {
        const origFindByIdRaw = orderRepository.findByIdRaw;
        orderRepository.findByIdRaw = async () => makeMockOrder({ status: ORDER_STATUS.PENDING });
        try {
            await assert.rejects(
                () => orderService.updateOrderStatus(MOCK_ORDER_ID, ORDER_STATUS.DELIVERED, mockAdmin),
                (err) => err instanceof BadRequestError && err.message.includes("Invalid status transition")
            );
        } finally {
            orderRepository.findByIdRaw = origFindByIdRaw;
        }
    });

    await test("26. Status update: driver can advance their assigned order", async () => {
        const origFindByIdRaw = orderRepository.findByIdRaw;
        const origUpdateStatusAtomic = orderRepository.updateStatusAtomic;
        const mockDriver = { _id: MOCK_DRIVER_ID, status: "active" };
        orderRepository.findByIdRaw = async () => makeMockOrder({
            status: ORDER_STATUS.DRIVER_ASSIGNED,
            driver: MOCK_DRIVER_ID,
        });
        orderRepository.updateStatusAtomic = async (id, from, to) => ({ ...makeMockOrder(), status: to });
        try {
            const order = await orderService.updateOrderStatus(
                MOCK_ORDER_ID,
                ORDER_STATUS.DRIVER_ARRIVING,
                mockUser,
                mockDriver
            );
            assert.strictEqual(order.status, ORDER_STATUS.DRIVER_ARRIVING);
        } finally {
            orderRepository.findByIdRaw = origFindByIdRaw;
            orderRepository.updateStatusAtomic = origUpdateStatusAtomic;
        }
    });

    await test("27. Status update: driver cannot skip to wrong transition", async () => {
        const origFindByIdRaw = orderRepository.findByIdRaw;
        const mockDriver = { _id: MOCK_DRIVER_ID, status: "active" };
        orderRepository.findByIdRaw = async () => makeMockOrder({
            status: ORDER_STATUS.DRIVER_ASSIGNED,
            driver: MOCK_DRIVER_ID,
        });
        try {
            await assert.rejects(
                () => orderService.updateOrderStatus(MOCK_ORDER_ID, ORDER_STATUS.DELIVERED, mockUser, mockDriver),
                (err) => (err instanceof BadRequestError || err instanceof ForbiddenError)
            );
        } finally {
            orderRepository.findByIdRaw = origFindByIdRaw;
        }
    });

    await test("28. Status update: driver cannot update unassigned order", async () => {
        const origFindByIdRaw = orderRepository.findByIdRaw;
        const mockDriver = { _id: MOCK_DRIVER_ID, status: "active" };
        orderRepository.findByIdRaw = async () => makeMockOrder({
            status: ORDER_STATUS.DRIVER_ASSIGNED,
            driver: "different_driver_id",
        });
        try {
            await assert.rejects(
                () => orderService.updateOrderStatus(MOCK_ORDER_ID, ORDER_STATUS.DRIVER_ARRIVING, mockUser, mockDriver),
                (err) => err instanceof ForbiddenError
            );
        } finally {
            orderRepository.findByIdRaw = origFindByIdRaw;
        }
    });

    await test("29. Status update: cannot update terminal status order", async () => {
        const origFindByIdRaw = orderRepository.findByIdRaw;
        orderRepository.findByIdRaw = async () => makeMockOrder({ status: ORDER_STATUS.DELIVERED });
        try {
            await assert.rejects(
                () => orderService.updateOrderStatus(MOCK_ORDER_ID, ORDER_STATUS.CANCELLED, mockAdmin),
                (err) => err instanceof BadRequestError
            );
        } finally {
            orderRepository.findByIdRaw = origFindByIdRaw;
        }
    });

    // ═══════════════════════════════════════════════════════════
    // 30. VEHICLE / DRIVER VALIDATION
    // ═══════════════════════════════════════════════════════════
    await test("30. Assign driver: vehicle type incompatible with service throws BadRequestError", async () => {
        const origFindByIdRaw = orderRepository.findByIdRaw;
        const origFindDriverById = driverRepository.findById;
        const origFindVehicleById = vehicleRepository.findById;

        orderRepository.findByIdRaw = async () => makeMockOrder({ status: ORDER_STATUS.SEARCHING_DRIVER });
        driverRepository.findById = async () => ({ _id: MOCK_DRIVER_ID, status: "active" });
        vehicleRepository.findById = async () => ({
            _id: MOCK_VEHICLE_ID,
            type: "truck", // not in allowedVehicleTypes: ["sedan", "motorcycle"]
            driver: { _id: MOCK_DRIVER_ID },
            status: "active",
            isActive: true,
        });

        try {
            await assert.rejects(
                () => orderService.assignDriver(MOCK_ORDER_ID, MOCK_DRIVER_ID, MOCK_VEHICLE_ID),
                (err) => err instanceof BadRequestError && err.message.includes("not compatible")
            );
        } finally {
            orderRepository.findByIdRaw = origFindByIdRaw;
            driverRepository.findById = origFindDriverById;
            vehicleRepository.findById = origFindVehicleById;
        }
    });

    await test("31. Assign driver: vehicle not belonging to driver throws BadRequestError", async () => {
        const origFindByIdRaw = orderRepository.findByIdRaw;
        const origFindDriverById = driverRepository.findById;
        const origFindVehicleById = vehicleRepository.findById;

        orderRepository.findByIdRaw = async () => makeMockOrder({ status: ORDER_STATUS.SEARCHING_DRIVER });
        driverRepository.findById = async () => ({ _id: MOCK_DRIVER_ID, status: "active" });
        vehicleRepository.findById = async () => ({
            _id: MOCK_VEHICLE_ID,
            type: "sedan",
            driver: { _id: "different_driver_id" }, // different driver!
            status: "active",
            isActive: true,
        });

        try {
            await assert.rejects(
                () => orderService.assignDriver(MOCK_ORDER_ID, MOCK_DRIVER_ID, MOCK_VEHICLE_ID),
                (err) => err instanceof BadRequestError && err.message.includes("not belong")
            );
        } finally {
            orderRepository.findByIdRaw = origFindByIdRaw;
            driverRepository.findById = origFindDriverById;
            vehicleRepository.findById = origFindVehicleById;
        }
    });

    await test("32. Assign driver: valid assignment advances status to DRIVER_ASSIGNED", async () => {
        const origFindByIdRaw = orderRepository.findByIdRaw;
        const origFindDriverById = driverRepository.findById;
        const origAssignDriverAtomic = orderRepository.assignDriverAtomic;

        orderRepository.findByIdRaw = async () => makeMockOrder({ status: ORDER_STATUS.SEARCHING_DRIVER });
        driverRepository.findById = async () => ({ _id: MOCK_DRIVER_ID, status: "active" });
        orderRepository.assignDriverAtomic = async (id, from, to, driverId, vehicleId) => ({
            ...makeMockOrder(), status: to, driver: driverId, vehicle: vehicleId
        });

        try {
            const order = await orderService.assignDriver(MOCK_ORDER_ID, MOCK_DRIVER_ID, null);
            assert.strictEqual(order.status, ORDER_STATUS.DRIVER_ASSIGNED);
            assert.strictEqual(order.driver, MOCK_DRIVER_ID);
        } finally {
            orderRepository.findByIdRaw = origFindByIdRaw;
            driverRepository.findById = origFindDriverById;
            orderRepository.assignDriverAtomic = origAssignDriverAtomic;
        }
    });

    await test("33. Assign driver: inactive driver fails before assignment", async () => {
        const origFindByIdRaw = orderRepository.findByIdRaw;
        const origFindDriverById = driverRepository.findById;
        const origAssignDriverAtomic = orderRepository.assignDriverAtomic;
        let assignmentAttempted = false;

        orderRepository.findByIdRaw = async () => makeMockOrder({ status: ORDER_STATUS.SEARCHING_DRIVER });
        driverRepository.findById = async () => ({ _id: MOCK_DRIVER_ID, status: "inactive" });
        orderRepository.assignDriverAtomic = async () => {
            assignmentAttempted = true;
            return null;
        };

        try {
            await assert.rejects(
                () => orderService.assignDriver(MOCK_ORDER_ID, MOCK_DRIVER_ID, null),
                (err) => err instanceof BadRequestError && err.message.includes("not active")
            );
            assert.strictEqual(assignmentAttempted, false);
        } finally {
            orderRepository.findByIdRaw = origFindByIdRaw;
            driverRepository.findById = origFindDriverById;
            orderRepository.assignDriverAtomic = origAssignDriverAtomic;
        }
    });

    await test("34. Assign driver: inactive vehicle fails before assignment", async () => {
        const origFindByIdRaw = orderRepository.findByIdRaw;
        const origFindDriverById = driverRepository.findById;
        const origFindVehicleById = vehicleRepository.findById;
        const origAssignDriverAtomic = orderRepository.assignDriverAtomic;
        let assignmentAttempted = false;

        orderRepository.findByIdRaw = async () => makeMockOrder({ status: ORDER_STATUS.SEARCHING_DRIVER });
        driverRepository.findById = async () => ({ _id: MOCK_DRIVER_ID, status: "active" });
        vehicleRepository.findById = async () => ({
            _id: MOCK_VEHICLE_ID,
            type: "sedan",
            driver: { _id: MOCK_DRIVER_ID },
            status: "inactive",
            isActive: false,
        });
        orderRepository.assignDriverAtomic = async () => {
            assignmentAttempted = true;
            return null;
        };

        try {
            await assert.rejects(
                () => orderService.assignDriver(MOCK_ORDER_ID, MOCK_DRIVER_ID, MOCK_VEHICLE_ID),
                (err) => err instanceof BadRequestError && err.message.includes("Vehicle is not active")
            );
            assert.strictEqual(assignmentAttempted, false);
        } finally {
            orderRepository.findByIdRaw = origFindByIdRaw;
            driverRepository.findById = origFindDriverById;
            vehicleRepository.findById = origFindVehicleById;
            orderRepository.assignDriverAtomic = origAssignDriverAtomic;
        }
    });

    await test("35. Assign driver: second assignment to already assigned order fails", async () => {
        const origFindByIdRaw = orderRepository.findByIdRaw;

        orderRepository.findByIdRaw = async () => makeMockOrder({
            status: ORDER_STATUS.DRIVER_ASSIGNED,
            driver: MOCK_DRIVER_ID,
        });

        try {
            await assert.rejects(
                () => orderService.assignDriver(MOCK_ORDER_ID, MOCK_DRIVER2_ID, null),
                (err) => err instanceof BadRequestError && err.message.includes("SEARCHING_DRIVER")
            );
        } finally {
            orderRepository.findByIdRaw = origFindByIdRaw;
        }
    });

    await test("36. Assign driver: concurrent assignment attempts allow only one winner", async () => {
        const origFindByIdRaw = orderRepository.findByIdRaw;
        const origFindDriverById = driverRepository.findById;
        const origAssignDriverAtomic = orderRepository.assignDriverAtomic;

        const storedOrder = makeMockOrder({ status: ORDER_STATUS.SEARCHING_DRIVER });
        orderRepository.findByIdRaw = async () => ({ ...storedOrder });
        driverRepository.findById = async (driverId) => ({ _id: driverId, status: "active" });
        orderRepository.assignDriverAtomic = async (id, from, to, driverId, vehicleId) => {
            if (
                storedOrder.status !== from ||
                storedOrder.driver !== null ||
                storedOrder.vehicle !== null
            ) {
                return null;
            }
            storedOrder.status = to;
            storedOrder.driver = driverId;
            storedOrder.vehicle = vehicleId;
            return { ...storedOrder };
        };

        try {
            const results = await Promise.allSettled([
                orderService.assignDriver(MOCK_ORDER_ID, MOCK_DRIVER_ID, null),
                orderService.assignDriver(MOCK_ORDER_ID, MOCK_DRIVER2_ID, null),
            ]);

            const fulfilled = results.filter((r) => r.status === "fulfilled");
            const rejected = results.filter((r) => r.status === "rejected");

            assert.strictEqual(fulfilled.length, 1);
            assert.strictEqual(rejected.length, 1);
            assert.ok(rejected[0].reason instanceof BadRequestError);
            assert.strictEqual(storedOrder.status, ORDER_STATUS.DRIVER_ASSIGNED);
            assert.ok([MOCK_DRIVER_ID, MOCK_DRIVER2_ID].includes(storedOrder.driver));
        } finally {
            orderRepository.findByIdRaw = origFindByIdRaw;
            driverRepository.findById = origFindDriverById;
            orderRepository.assignDriverAtomic = origAssignDriverAtomic;
        }
    });

    await test("37. Repository: assignDriverAtomic uses status and unassigned guards", async () => {
        const Order = require("../src/modules/orders/models/order");
        const origFindOneAndUpdate = Order.findOneAndUpdate;
        let capturedFilter = null;
        let capturedUpdate = null;
        let capturedOptions = null;

        Order.findOneAndUpdate = (filter, update, options) => {
            capturedFilter = filter;
            capturedUpdate = update;
            capturedOptions = options;
            return Promise.resolve(makeMockOrder({
                status: ORDER_STATUS.DRIVER_ASSIGNED,
                driver: MOCK_DRIVER_ID,
                vehicle: MOCK_VEHICLE_ID,
            }));
        };

        try {
            await orderRepository.assignDriverAtomic(
                MOCK_ORDER_ID,
                ORDER_STATUS.SEARCHING_DRIVER,
                ORDER_STATUS.DRIVER_ASSIGNED,
                MOCK_DRIVER_ID,
                MOCK_VEHICLE_ID
            );

            assert.deepStrictEqual(capturedFilter, {
                _id: MOCK_ORDER_ID,
                status: ORDER_STATUS.SEARCHING_DRIVER,
                driver: null,
                vehicle: null,
            });
            assert.strictEqual(capturedUpdate.$set.status, ORDER_STATUS.DRIVER_ASSIGNED);
            assert.strictEqual(capturedUpdate.$set.driver, MOCK_DRIVER_ID);
            assert.strictEqual(capturedUpdate.$set.vehicle, MOCK_VEHICLE_ID);
            assert.strictEqual(capturedOptions.new, true);
            assert.strictEqual(capturedOptions.runValidators, true);
        } finally {
            Order.findOneAndUpdate = origFindOneAndUpdate;
        }
    });

    await test("38. Status update: concurrent status changes from same state allow only one winner", async () => {
        const origFindByIdRaw = orderRepository.findByIdRaw;
        const origUpdateStatusAtomic = orderRepository.updateStatusAtomic;

        const storedOrder = makeMockOrder({
            status: ORDER_STATUS.DRIVER_ARRIVING,
            driver: MOCK_DRIVER_ID,
        });

        orderRepository.findByIdRaw = async () => ({ ...storedOrder });
        orderRepository.updateStatusAtomic = async (id, from, to, extra = {}) => {
            if (storedOrder.status !== from) return null;
            storedOrder.status = to;
            Object.assign(storedOrder, extra);
            return { ...storedOrder };
        };

        try {
            const results = await Promise.allSettled([
                orderService.updateOrderStatus(MOCK_ORDER_ID, ORDER_STATUS.DRIVER_ARRIVED, mockAdmin),
                orderService.updateOrderStatus(MOCK_ORDER_ID, ORDER_STATUS.CANCELLED, mockAdmin),
            ]);

            const fulfilled = results.filter((r) => r.status === "fulfilled");
            const rejected = results.filter((r) => r.status === "rejected");

            assert.strictEqual(fulfilled.length, 1);
            assert.strictEqual(rejected.length, 1);
            assert.ok(rejected[0].reason instanceof BadRequestError);
            assert.ok([ORDER_STATUS.DRIVER_ARRIVED, ORDER_STATUS.CANCELLED].includes(storedOrder.status));
        } finally {
            orderRepository.findByIdRaw = origFindByIdRaw;
            orderRepository.updateStatusAtomic = origUpdateStatusAtomic;
        }
    });

    await test("39. Cancel race: cancel vs status update cannot overwrite each other", async () => {
        const origFindByIdRaw = orderRepository.findByIdRaw;
        const origUpdateStatusAtomic = orderRepository.updateStatusAtomic;

        const storedOrder = makeMockOrder({
            status: ORDER_STATUS.DRIVER_ASSIGNED,
            driver: MOCK_DRIVER_ID,
        });

        orderRepository.findByIdRaw = async () => ({ ...storedOrder });
        orderRepository.updateStatusAtomic = async (id, from, to, extra = {}) => {
            if (storedOrder.status !== from) return null;
            storedOrder.status = to;
            Object.assign(storedOrder, extra);
            return { ...storedOrder };
        };

        try {
            const mockDriver = { _id: MOCK_DRIVER_ID, status: "active" };
            const results = await Promise.allSettled([
                orderService.cancelOrder(MOCK_ORDER_ID, mockAdmin, "Cancelled during race"),
                orderService.updateOrderStatus(
                    MOCK_ORDER_ID,
                    ORDER_STATUS.DRIVER_ARRIVING,
                    mockUser,
                    mockDriver
                ),
            ]);

            const fulfilled = results.filter((r) => r.status === "fulfilled");
            const rejected = results.filter((r) => r.status === "rejected");

            assert.strictEqual(fulfilled.length, 1);
            assert.strictEqual(rejected.length, 1);
            assert.ok(rejected[0].reason instanceof BadRequestError);
            assert.ok([ORDER_STATUS.CANCELLED, ORDER_STATUS.DRIVER_ARRIVING].includes(storedOrder.status));
        } finally {
            orderRepository.findByIdRaw = origFindByIdRaw;
            orderRepository.updateStatusAtomic = origUpdateStatusAtomic;
        }
    });

    // ═══════════════════════════════════════════════════════════
    // 33. ORDER ROUTES STRUCTURE
    // ═══════════════════════════════════════════════════════════
    await test("40. Routes structure: required endpoints are registered", async () => {
        const orderRoutes = require("../src/modules/orders/routes/orderRoutes");
        const routes = orderRoutes.stack
            .filter((layer) => layer.route)
            .map((layer) => ({
                path: layer.route.path,
                methods: Object.keys(layer.route.methods),
            }));

        const paths = routes.map((r) => r.path);
        assert.ok(paths.includes("/"), "POST / must exist");
        assert.ok(paths.includes("/:id/cancel"), "PATCH /:id/cancel must exist");
        assert.ok(paths.includes("/:id/status"), "PATCH /:id/status must exist");
        assert.ok(paths.includes("/:id/assign-driver"), "POST /:id/assign-driver must exist");

        const postRoot = routes.find((r) => r.path === "/" && r.methods.includes("post"));
        const getRoot = routes.find((r) => r.path === "/" && r.methods.includes("get"));
        assert.ok(postRoot, "POST / must be defined");
        assert.ok(getRoot, "GET / must be defined");
    });

    await test("41. Model: Order orderNumber field is required and unique index exists", async () => {
        const Order = require("../src/modules/orders/models/order");
        const schema = Order.schema;
        assert.ok(schema.path("orderNumber").options.unique, "orderNumber must be unique");
        assert.ok(schema.path("orderNumber").options.required, "orderNumber must be required");
    });

    await test("42. Model: Order has paymentStatus and paymentId for future Payments module", async () => {
        const Order = require("../src/modules/orders/models/order");
        const schema = Order.schema;
        assert.ok(schema.path("paymentStatus"), "paymentStatus field must exist");
        assert.ok(schema.path("paymentId"), "paymentId field must exist");
    });

    await test("43. Model: Order has partial unique index for one active order per driver", async () => {
        const Order = require("../src/modules/orders/models/order");
        const indexes = Order.schema.indexes();
        const activeDriverIndex = indexes.find(([fields, options]) => (
            fields.driver === 1 &&
            options.unique === true &&
            options.partialFilterExpression?.status?.$in?.includes(ORDER_STATUS.DRIVER_ASSIGNED) &&
            options.partialFilterExpression?.status?.$in?.includes(ORDER_STATUS.IN_TRANSIT)
        ));

        assert.ok(activeDriverIndex, "Active driver unique partial index must exist");
    });

    // ─── Summary ─────────────────────────────────────────────────
    console.log(`\n=== ALL TESTS COMPLETED: ${passed} passed, ${failed} failed ===\n`);
    if (failed > 0) process.exit(1);
    else process.exit(0);
}

runTests().catch((err) => {
    console.error("FATAL TEST RUNNER ERROR:", err);
    process.exit(1);
});
