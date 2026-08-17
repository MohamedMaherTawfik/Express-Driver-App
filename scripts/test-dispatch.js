/**
 * Dispatch Domain Test Suite
 * Runs without Redis/MongoDB connection using mocked repositories.
 */

const Module = require("module");
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
    if (id === "ioredis") {
        const EventEmitter = require("events");
        class MockRedis extends EventEmitter {
            on() { return this; }
            once() { return this; }
            quit() { return Promise.resolve(); }
        }
        return MockRedis;
    }
    if (id === "bullmq") {
        class MockQueue { add() { return Promise.resolve(); } }
        class MockWorker {}
        return { Queue: MockQueue, Worker: MockWorker };
    }
    return originalRequire.apply(this, arguments);
};

const assert = require("assert");

const dispatchService = require("../src/modules/dispatch/services/dispatchService");
const dispatchRepository = require("../src/modules/dispatch/repositories/dispatchRepository");
const orderRepository = require("../src/modules/orders/repositories/orderRepository");
const serviceRepository = require("../src/modules/services/repositories/serviceRepository");
const driverRepository = require("../src/modules/drivers/repositories/driverRepository");
const notificationService = require("../src/modules/notifications/services/notificationService");

const {
    DISPATCH_OFFER_STATUS,
    DISPATCH_RESULT,
} = require("../src/modules/dispatch/constants/dispatchConstants");
const { ORDER_STATUS } = require("../src/modules/orders/constants/orderConstants");
const { DRIVER_STATUS, DRIVER_AVAILABILITY_STATUS } = require("../src/modules/drivers/constants/driverConstants");
const { DRIVER_APPLICATION_STATUS } = require("../src/modules/driverApplications/constant/driverApplicationConstants");
const { VEHICLE_STATUS } = require("../src/modules/vehicles/constants/vehicleConstants");

const BadRequestError = require("../src/shared/errors/BadRequestError");
const ForbiddenError = require("../src/shared/errors/ForbiddenError");

const ORDER_ID = "660000000000000000001001";
const OFFER_ID = "660000000000000000001002";
const DRIVER_ID = "660000000000000000001003";
const DRIVER2_ID = "660000000000000000001004";
const VEHICLE_ID = "660000000000000000001005";
const VEHICLE2_ID = "660000000000000000001006";
const USER_ID = "660000000000000000001007";
const DRIVER_USER_ID = "660000000000000000001008";
const SERVICE_ID = "660000000000000000001009";

const mockUser = { _id: USER_ID, role: "user" };
const mockDriverUser = { _id: DRIVER_USER_ID, role: "user" };
const mockDriverProfile = { _id: DRIVER_ID, status: DRIVER_STATUS.ACTIVE };

function makeOrder(overrides = {}) {
    return {
        _id: ORDER_ID,
        orderNumber: "ORD-2026-999001",
        user: USER_ID,
        service: SERVICE_ID,
        status: ORDER_STATUS.SEARCHING_DRIVER,
        driver: null,
        vehicle: null,
        serviceSnapshot: {
            name: "Standard",
            type: "delivery",
            basePrice: 10,
            allowedVehicleTypes: ["sedan", "motorcycle"],
        },
        ...overrides,
    };
}

function makeService(overrides = {}) {
    return {
        _id: SERVICE_ID,
        status: "active",
        isActive: true,
        allowedVehicleTypes: ["sedan", "motorcycle"],
        ...overrides,
    };
}

function makeVehicle(overrides = {}) {
    return {
        _id: VEHICLE_ID,
        driver: DRIVER_ID,
        type: "sedan",
        status: VEHICLE_STATUS.ACTIVE,
        isActive: true,
        ...overrides,
    };
}

function makeDriver(overrides = {}) {
    const id = overrides._id || DRIVER_ID;
    return {
        _id: id,
        user: { _id: overrides.userId || DRIVER_USER_ID },
        status: DRIVER_STATUS.ACTIVE,
        availabilityStatus: DRIVER_AVAILABILITY_STATUS.AVAILABLE,
        application: { status: DRIVER_APPLICATION_STATUS.APPROVED },
        vehicle: makeVehicle({ driver: id, _id: id === DRIVER2_ID ? VEHICLE2_ID : VEHICLE_ID }),
        ...overrides,
    };
}

function makeOffer(overrides = {}) {
    return {
        _id: OFFER_ID,
        order: ORDER_ID,
        driver: makeDriver(),
        vehicle: makeVehicle(),
        status: DISPATCH_OFFER_STATUS.OFFERED,
        expiresAt: new Date(Date.now() + 60000),
        ...overrides,
    };
}

const originals = [];
function mock(obj, key, value) {
    originals.push([obj, key, obj[key]]);
    obj[key] = value;
}

function restoreAll() {
    while (originals.length > 0) {
        const [obj, key, value] = originals.pop();
        obj[key] = value;
    }
}

function setupStartDispatch({
    order = makeOrder(),
    service = makeService(),
    openOffer = null,
    previousDriverIds = [],
    candidates = [makeDriver()],
    activeOrder = false,
    createdOffer = null,
} = {}) {
    const notifications = [];

    mock(notificationService, "createNotification", async (data) => {
        notifications.push(data);
        return data;
    });
    mock(orderRepository, "findByIdRaw", async () => order);
    mock(orderRepository, "updateStatusAtomic", async (id, from, to) => {
        if (order.status !== from) return null;
        order = { ...order, status: to };
        return order;
    });
    mock(serviceRepository, "findById", async () => service);
    mock(dispatchRepository, "findOpenOfferByOrder", async () => openOffer);
    mock(dispatchRepository, "expireOfferAtomic", async (id, now) => ({ ...openOffer, status: DISPATCH_OFFER_STATUS.EXPIRED, respondedAt: now }));
    mock(dispatchRepository, "findPreviousDriverIds", async () => previousDriverIds);
    mock(dispatchRepository, "findCandidateDrivers", async () => candidates);
    mock(dispatchRepository, "findDriversWithOpenOffers", async () => new Set());
    mock(orderRepository, "exists", async () => activeOrder);
    mock(dispatchRepository, "createOffer", async (data) => createdOffer || ({ _id: OFFER_ID, ...data }));

    return { notifications };
}

async function runTests() {
    console.log("=== STARTING DISPATCH DOMAIN TEST SUITE ===\n");
    let passed = 0;
    let failed = 0;

    async function test(name, fn) {
        try {
            restoreAll();
            await fn();
            console.log(`  ✓ PASS: ${name}`);
            passed++;
        } catch (err) {
            console.error(`  ✗ FAIL: ${name}`);
            console.error(`    ${err.message}`);
            failed++;
        } finally {
            restoreAll();
        }
    }

    await test("1. Constants: offer lifecycle contains required states", () => {
        assert.deepStrictEqual(Object.values(DISPATCH_OFFER_STATUS).sort(), [
            "accepted",
            "cancelled",
            "expired",
            "offered",
            "rejected",
        ]);
    });

    await test("2. Model: DispatchOffer has unique open offer indexes", () => {
        const DispatchOffer = require("../src/modules/dispatch/models/dispatchOffer");
        const indexes = DispatchOffer.schema.indexes();
        assert.ok(indexes.some(([fields, opts]) => fields.order === 1 && opts.unique && opts.name === "unique_open_offer_per_order"));
        assert.ok(indexes.some(([fields, opts]) => fields.driver === 1 && opts.unique && opts.name === "unique_open_offer_per_driver"));
    });

    await test("3. Routes: dispatch offer endpoints are registered", () => {
        const routes = require("../src/modules/dispatch/routes/dispatchRoutes").stack
            .filter((layer) => layer.route)
            .map((layer) => layer.route.path);
        assert.ok(routes.includes("/offers/:id/accept"));
        assert.ok(routes.includes("/offers/:id/reject"));
        assert.ok(routes.includes("/offers/:id/expire"));
    });

    await test("4. Dispatch: PENDING order is moved to SEARCHING_DRIVER before offer", async () => {
        setupStartDispatch({ order: makeOrder({ status: ORDER_STATUS.PENDING }) });
        const result = await dispatchService.startDispatch(ORDER_ID);
        assert.strictEqual(result.result, DISPATCH_RESULT.OFFER_CREATED);
    });

    await test("5. Dispatch: eligible order creates driver offer", async () => {
        const { notifications } = setupStartDispatch();
        const result = await dispatchService.startDispatch(ORDER_ID);
        assert.strictEqual(result.result, DISPATCH_RESULT.OFFER_CREATED);
        assert.strictEqual(result.offer.driver, DRIVER_ID);
        assert.strictEqual(notifications.length, 1);
    });

    await test("6. Dispatch: no eligible drivers leaves order searching", async () => {
        setupStartDispatch({ candidates: [] });
        const result = await dispatchService.startDispatch(ORDER_ID);
        assert.strictEqual(result.result, DISPATCH_RESULT.NO_CANDIDATES);
        assert.strictEqual(result.offer, null);
    });

    await test("7. Dispatch: inactive driver is excluded", async () => {
        setupStartDispatch({ candidates: [makeDriver({ status: DRIVER_STATUS.INACTIVE })] });
        const result = await dispatchService.startDispatch(ORDER_ID);
        assert.strictEqual(result.result, DISPATCH_RESULT.NO_CANDIDATES);
    });

    await test("8. Dispatch: offline driver is excluded", async () => {
        setupStartDispatch({ candidates: [makeDriver({ availabilityStatus: DRIVER_AVAILABILITY_STATUS.OFFLINE })] });
        const result = await dispatchService.startDispatch(ORDER_ID);
        assert.strictEqual(result.result, DISPATCH_RESULT.NO_CANDIDATES);
    });

    await test("9. Dispatch: busy driver is excluded", async () => {
        setupStartDispatch({ candidates: [makeDriver({ availabilityStatus: DRIVER_AVAILABILITY_STATUS.BUSY })] });
        const result = await dispatchService.startDispatch(ORDER_ID);
        assert.strictEqual(result.result, DISPATCH_RESULT.NO_CANDIDATES);
    });

    await test("10. Dispatch: incompatible vehicle is excluded", async () => {
        setupStartDispatch({ candidates: [makeDriver({ vehicle: makeVehicle({ type: "truck" }) })] });
        const result = await dispatchService.startDispatch(ORDER_ID);
        assert.strictEqual(result.result, DISPATCH_RESULT.NO_CANDIDATES);
    });

    await test("11. Dispatch: inactive vehicle is excluded", async () => {
        setupStartDispatch({ candidates: [makeDriver({ vehicle: makeVehicle({ status: VEHICLE_STATUS.INACTIVE, isActive: false }) })] });
        const result = await dispatchService.startDispatch(ORDER_ID);
        assert.strictEqual(result.result, DISPATCH_RESULT.NO_CANDIDATES);
    });

    await test("12. Dispatch: driver without approved application is excluded", async () => {
        setupStartDispatch({ candidates: [makeDriver({ application: { status: DRIVER_APPLICATION_STATUS.PENDING } })] });
        const result = await dispatchService.startDispatch(ORDER_ID);
        assert.strictEqual(result.result, DISPATCH_RESULT.NO_CANDIDATES);
    });

    await test("13. Dispatch: existing open offer is idempotent", async () => {
        const existing = makeOffer();
        setupStartDispatch({ openOffer: existing });
        const result = await dispatchService.startDispatch(ORDER_ID);
        assert.strictEqual(result.result, DISPATCH_RESULT.EXISTING_OFFER);
        assert.strictEqual(result.offer, existing);
    });

    await test("14. Dispatch: expired open offer is expired and next candidate offered", async () => {
        const oldOffer = makeOffer({ expiresAt: new Date(Date.now() - 1000) });
        setupStartDispatch({ openOffer: oldOffer });
        const result = await dispatchService.startDispatch(ORDER_ID);
        assert.strictEqual(result.result, DISPATCH_RESULT.OFFER_CREATED);
    });

    await test("15. Dispatch: inactive service cannot be dispatched", async () => {
        setupStartDispatch({ service: makeService({ status: "inactive", isActive: false }) });
        await assert.rejects(
            () => dispatchService.startDispatch(ORDER_ID),
            (err) => err instanceof BadRequestError && err.message.includes("Inactive service")
        );
    });

    await test("16. Dispatch: cancelled order cannot be dispatched", async () => {
        setupStartDispatch({ order: makeOrder({ status: ORDER_STATUS.CANCELLED }) });
        await assert.rejects(
            () => dispatchService.startDispatch(ORDER_ID),
            (err) => err instanceof BadRequestError
        );
    });

    await test("17. Accept: driver accepts offer and order is assigned atomically", async () => {
        const offer = makeOffer();
        mock(dispatchRepository, "findOfferById", async () => offer);
        mock(orderRepository, "findByIdRaw", async () => makeOrder());
        mock(serviceRepository, "findById", async () => makeService());
        mock(dispatchRepository, "acceptOfferAtomic", async () => ({ ...offer, status: DISPATCH_OFFER_STATUS.ACCEPTED }));
        mock(driverRepository, "claimAvailableDriver", async () => ({ ...mockDriverProfile, availabilityStatus: DRIVER_AVAILABILITY_STATUS.BUSY }));
        mock(orderRepository, "assignDriverAtomic", async () => makeOrder({ status: ORDER_STATUS.DRIVER_ASSIGNED, driver: DRIVER_ID, vehicle: VEHICLE_ID }));
        mock(notificationService, "createNotification", async (data) => data);

        const result = await dispatchService.acceptOffer(OFFER_ID, mockDriverUser, mockDriverProfile);
        assert.strictEqual(result.result, DISPATCH_RESULT.ACCEPTED);
        assert.strictEqual(result.order.status, ORDER_STATUS.DRIVER_ASSIGNED);
    });

    await test("18. Accept: driver cannot accept another driver's offer", async () => {
        mock(dispatchRepository, "findOfferById", async () => makeOffer({ driver: makeDriver({ _id: DRIVER2_ID }) }));
        await assert.rejects(
            () => dispatchService.acceptOffer(OFFER_ID, mockDriverUser, mockDriverProfile),
            (err) => err instanceof ForbiddenError
        );
    });

    await test("19. Accept: repeated accept of accepted offer is idempotent", async () => {
        mock(dispatchRepository, "findOfferById", async () => makeOffer({ status: DISPATCH_OFFER_STATUS.ACCEPTED }));
        const result = await dispatchService.acceptOffer(OFFER_ID, mockDriverUser, mockDriverProfile);
        assert.strictEqual(result.idempotent, true);
    });

    await test("20. Accept: expired offer cannot be accepted", async () => {
        mock(dispatchRepository, "findOfferById", async () => makeOffer({ expiresAt: new Date(Date.now() - 1000) }));
        mock(dispatchRepository, "expireOfferAtomic", async () => makeOffer({ status: DISPATCH_OFFER_STATUS.EXPIRED }));
        await assert.rejects(
            () => dispatchService.acceptOffer(OFFER_ID, mockDriverUser, mockDriverProfile),
            (err) => err instanceof BadRequestError && err.message.includes("expired")
        );
    });

    await test("21. Accept: unavailable driver fails after offer claim", async () => {
        mock(dispatchRepository, "findOfferById", async () => makeOffer());
        mock(orderRepository, "findByIdRaw", async () => makeOrder());
        mock(serviceRepository, "findById", async () => makeService());
        mock(dispatchRepository, "acceptOfferAtomic", async () => makeOffer({ status: DISPATCH_OFFER_STATUS.ACCEPTED }));
        mock(driverRepository, "claimAvailableDriver", async () => null);

        await assert.rejects(
            () => dispatchService.acceptOffer(OFFER_ID, mockDriverUser, mockDriverProfile),
            (err) => err instanceof BadRequestError && err.message.includes("no longer available")
        );
    });

    await test("22. Accept: assignment failure releases driver and cancels offer in non-transaction mode", async () => {
        let released = false;
        let cancelled = false;
        mock(dispatchRepository, "findOfferById", async () => makeOffer());
        mock(orderRepository, "findByIdRaw", async () => makeOrder());
        mock(serviceRepository, "findById", async () => makeService());
        mock(dispatchRepository, "acceptOfferAtomic", async () => makeOffer({ status: DISPATCH_OFFER_STATUS.ACCEPTED }));
        mock(driverRepository, "claimAvailableDriver", async () => ({ ...mockDriverProfile, availabilityStatus: DRIVER_AVAILABILITY_STATUS.BUSY }));
        mock(orderRepository, "assignDriverAtomic", async () => null);
        mock(driverRepository, "releaseBusyDriver", async () => { released = true; });
        mock(dispatchRepository, "cancelOfferAtomic", async () => { cancelled = true; });

        await assert.rejects(() => dispatchService.acceptOffer(OFFER_ID, mockDriverUser, mockDriverProfile));
        assert.strictEqual(released, true);
        assert.strictEqual(cancelled, true);
    });

    await test("23. Reject: offer is rejected and retry chooses another candidate", async () => {
        mock(dispatchRepository, "findOfferById", async () => makeOffer());
        mock(dispatchRepository, "rejectOfferAtomic", async () => makeOffer({ status: DISPATCH_OFFER_STATUS.REJECTED }));
        setupStartDispatch({ previousDriverIds: [DRIVER_ID], candidates: [makeDriver({ _id: DRIVER2_ID })] });

        const result = await dispatchService.rejectOffer(OFFER_ID, mockDriverUser, mockDriverProfile, "No thanks");
        assert.strictEqual(result.result, DISPATCH_RESULT.REJECTED);
        assert.strictEqual(result.next.result, DISPATCH_RESULT.OFFER_CREATED);
        assert.strictEqual(result.next.offer.driver, DRIVER2_ID);
    });

    await test("24. Reject: repeated reject is idempotent", async () => {
        mock(dispatchRepository, "findOfferById", async () => makeOffer({ status: DISPATCH_OFFER_STATUS.REJECTED }));
        const result = await dispatchService.rejectOffer(OFFER_ID, mockDriverUser, mockDriverProfile);
        assert.strictEqual(result.idempotent, true);
    });

    await test("25. Expire: expired offer retries dispatch", async () => {
        mock(dispatchRepository, "findOfferById", async () => makeOffer({ expiresAt: new Date(Date.now() - 1000) }));
        mock(dispatchRepository, "expireOfferAtomic", async () => makeOffer({ status: DISPATCH_OFFER_STATUS.EXPIRED }));
        setupStartDispatch({ previousDriverIds: [DRIVER_ID], candidates: [makeDriver({ _id: DRIVER2_ID })] });

        const result = await dispatchService.expireOffer(OFFER_ID);
        assert.strictEqual(result.result, DISPATCH_RESULT.EXPIRED);
        assert.strictEqual(result.next.result, DISPATCH_RESULT.OFFER_CREATED);
    });

    await test("26. Race: concurrent acceptance allows only one winner", async () => {
        let accepted = false;
        mock(dispatchRepository, "findOfferById", async () => makeOffer());
        mock(orderRepository, "findByIdRaw", async () => makeOrder());
        mock(serviceRepository, "findById", async () => makeService());
        mock(dispatchRepository, "acceptOfferAtomic", async () => {
            if (accepted) return null;
            accepted = true;
            return makeOffer({ status: DISPATCH_OFFER_STATUS.ACCEPTED });
        });
        mock(driverRepository, "claimAvailableDriver", async () => ({ ...mockDriverProfile, availabilityStatus: DRIVER_AVAILABILITY_STATUS.BUSY }));
        mock(orderRepository, "assignDriverAtomic", async () => makeOrder({ status: ORDER_STATUS.DRIVER_ASSIGNED }));
        mock(notificationService, "createNotification", async (data) => data);

        const results = await Promise.allSettled([
            dispatchService.acceptOffer(OFFER_ID, mockDriverUser, mockDriverProfile),
            dispatchService.acceptOffer(OFFER_ID, mockDriverUser, mockDriverProfile),
        ]);

        assert.strictEqual(results.filter((r) => r.status === "fulfilled").length, 1);
        assert.strictEqual(results.filter((r) => r.status === "rejected").length, 1);
    });

    await test("27. Race: duplicate dispatch returns existing offer", async () => {
        const duplicate = new Error("duplicate");
        duplicate.code = 11000;
        let existing = null;
        setupStartDispatch();
        mock(dispatchRepository, "createOffer", async () => {
            existing = makeOffer();
            throw duplicate;
        });
        mock(dispatchRepository, "findOpenOfferByOrder", async () => existing);

        const result = await dispatchService.startDispatch(ORDER_ID);
        assert.strictEqual(result.result, DISPATCH_RESULT.EXISTING_OFFER);
    });

    await test("28. Dispatch: driver with active order is excluded", async () => {
        setupStartDispatch({ activeOrder: true });
        const result = await dispatchService.startDispatch(ORDER_ID);
        assert.strictEqual(result.result, DISPATCH_RESULT.NO_CANDIDATES);
    });

    await test("29. Repository: claimAvailableDriver is conditional on available status", async () => {
        const Driver = require("../src/modules/drivers/models/driver");
        const origFindOneAndUpdate = Driver.findOneAndUpdate;
        let filter = null;
        let update = null;
        Driver.findOneAndUpdate = (f, u) => {
            filter = f;
            update = u;
            return Promise.resolve(makeDriver({ availabilityStatus: DRIVER_AVAILABILITY_STATUS.BUSY }));
        };

        try {
            await driverRepository.claimAvailableDriver(DRIVER_ID);
            assert.strictEqual(filter._id, DRIVER_ID);
            assert.strictEqual(filter.availabilityStatus, DRIVER_AVAILABILITY_STATUS.AVAILABLE);
            assert.strictEqual(update.$set.availabilityStatus, DRIVER_AVAILABILITY_STATUS.BUSY);
        } finally {
            Driver.findOneAndUpdate = origFindOneAndUpdate;
        }
    });

    await test("30. Orders routes: dispatch trigger endpoints are registered", () => {
        const routes = require("../src/modules/orders/routes/orderRoutes").stack
            .filter((layer) => layer.route)
            .map((layer) => layer.route.path);
        assert.ok(routes.includes("/:id/dispatch"));
        assert.ok(routes.includes("/:id/dispatch/retry"));
    });

    await test("31. Model: Driver has dispatch candidate lookup index", () => {
        const Driver = require("../src/modules/drivers/models/driver");
        const indexes = Driver.schema.indexes();
        assert.ok(indexes.some(([fields]) => (
            fields.status === 1 &&
            fields.availabilityStatus === 1 &&
            fields.createdAt === 1
        )));
    });

    console.log(`\n=== DISPATCH TESTS COMPLETED: ${passed} passed, ${failed} failed ===\n`);
    if (failed > 0) process.exit(1);
    process.exit(0);
}

runTests().catch((err) => {
    console.error("FATAL TEST RUNNER ERROR:", err);
    process.exit(1);
});
