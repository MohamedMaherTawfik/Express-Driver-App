const vehicleRepository = require("../repositories/vehicleRepository");
const driverRepository = require("../../drivers/repositories/driverRepository");
const { VEHICLE_STATUS } = require("../constants/vehicleConstants");
const NotFoundError = require("../../../shared/errors/NotFoundError");
const BadRequestError = require("../../../shared/errors/BadRequestError");
const ForbiddenError = require("../../../shared/errors/ForbiddenError");
const notificationService = require("../../notifications/services/notificationService");

class VehicleService {
    async createVehicle(userId, userRole, vehicleData) {
        let driverId = vehicleData.driver;
        // notifyUserId will be the User._id to send the notification to.
        let notifyUserId = userId;

        // If user is not admin, they can only create a vehicle for their own driver profile.
        if (userRole !== "admin") {
            const driver = await driverRepository.findByUserId(userId);
            if (!driver) {
                throw new NotFoundError("Driver profile");
            }
            driverId = driver._id.toString();
            // notifyUserId is already userId (the authenticated user)
        } else {
            // Admin must provide a driver ID
            if (!driverId) {
                throw new BadRequestError("Driver ID is required for admins to create a vehicle.");
            }
            const driver = await driverRepository.findById(driverId);
            if (!driver) {
                throw new NotFoundError("Driver");
            }
            // For admin, notify the driver's user, not the admin themselves
            notifyUserId = driver.user.toString();
        }

        // Check if driver already has a vehicle
        const existingVehicle = await vehicleRepository.findByDriverId(driverId);
        if (existingVehicle) {
            throw new BadRequestError("Driver already has a registered vehicle.");
        }

        // Check plateNumber uniqueness
        if (vehicleData.plateNumber) {
            const duplicatePlate = await vehicleRepository.findOne({
                plateNumber: vehicleData.plateNumber.trim()
            });
            if (duplicatePlate) {
                throw new BadRequestError("A vehicle with this plate number already exists.");
            }
        }

        // Check registrationNumber uniqueness
        if (vehicleData.registrationNumber) {
            const duplicateReg = await vehicleRepository.findOne({
                registrationNumber: vehicleData.registrationNumber.trim()
            });
            if (duplicateReg) {
                throw new BadRequestError("A vehicle with this registration number already exists.");
            }
        }

        // Sanitized data insertion
        const newVehicleData = {
            driver: driverId,
            type: vehicleData.type,
            make: vehicleData.make,
            model: vehicleData.model,
            year: vehicleData.year,
            color: vehicleData.color,
            plateNumber: vehicleData.plateNumber.trim(),
            registrationNumber: vehicleData.registrationNumber ? vehicleData.registrationNumber.trim() : undefined,
            status: vehicleData.status || VEHICLE_STATUS.ACTIVE,
            isActive: vehicleData.isActive !== undefined ? vehicleData.isActive : true,
        };

        const vehicle = await vehicleRepository.create(newVehicleData);

        // Update driver's vehicle reference
        await driverRepository.updateById(driverId, { vehicle: vehicle._id });

        // Send notification for vehicle addition
        await notificationService.createNotification({
            userId: notifyUserId,
            type: "vehicle_added",
            title: "Vehicle Added",
            message: "A new vehicle has been successfully added to your profile.",
            data: {
                vehicleId: vehicle._id.toString(),
                plateNumber: vehicle.plateNumber
            }
        }).catch(err => console.error("Notification error:", err));

        return vehicle;
    }

    async getVehicleById(id, userId, userRole) {
        const vehicle = await vehicleRepository.findById(id);
        if (!vehicle) {
            throw new NotFoundError("Vehicle");
        }

        // Authorization check: Only admin or the driver themselves can view the vehicle
        if (userRole !== "admin") {
            const driver = await driverRepository.findByUserId(userId);
            if (!driver || vehicle.driver._id.toString() !== driver._id.toString()) {
                throw new ForbiddenError("You are not authorized to view this vehicle.");
            }
        }

        return vehicle;
    }

    async getVehicles(userId, userRole, queryParams = {}) {
        const { page = 1, limit = 10, sort = "-createdAt", type, status, driver } = queryParams;

        const filter = {};

        // Filtering
        if (type) filter.type = type;
        if (status) filter.status = status;

        if (userRole !== "admin") {
            // Non-admin can only see their own vehicle
            const driverProfile = await driverRepository.findByUserId(userId);
            if (!driverProfile) {
                throw new NotFoundError("Driver profile");
            }
            filter.driver = driverProfile._id;
        } else if (driver) {
            filter.driver = driver;
        }

        // Parsing sort
        let sortOption = { createdAt: -1 };
        if (sort) {
            const direction = sort.startsWith("-") ? -1 : 1;
            const field = sort.replace(/^[+-]/, "");
            sortOption = { [field]: direction };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        return vehicleRepository.findMany({
            filter,
            sort: sortOption,
            skip,
            limit: parseInt(limit),
        });
    }

    async updateVehicle(id, userId, userRole, updateData) {
        const vehicle = await vehicleRepository.findById(id);
        if (!vehicle) {
            throw new NotFoundError("Vehicle");
        }

        // Authorization check: Only admin or the driver themselves can edit the vehicle
        if (userRole !== "admin") {
            const driver = await driverRepository.findByUserId(userId);
            if (!driver || vehicle.driver._id.toString() !== driver._id.toString()) {
                throw new ForbiddenError("You are not authorized to update this vehicle.");
            }
            // Non-admin cannot update sensitive fields like driver, status, isActive
            delete updateData.driver;
            delete updateData.status;
            delete updateData.isActive;
        }

        // Check plate number uniqueness if updated
        if (updateData.plateNumber && updateData.plateNumber.trim() !== vehicle.plateNumber) {
            const duplicatePlate = await vehicleRepository.findOne({
                plateNumber: updateData.plateNumber.trim(),
                _id: { $ne: id },
            });
            if (duplicatePlate) {
                throw new BadRequestError("A vehicle with this plate number already exists.");
            }
            updateData.plateNumber = updateData.plateNumber.trim();
        }

        // Check registration number uniqueness if updated
        if (updateData.registrationNumber && updateData.registrationNumber.trim() !== vehicle.registrationNumber) {
            const duplicateReg = await vehicleRepository.findOne({
                registrationNumber: updateData.registrationNumber.trim(),
                _id: { $ne: id },
            });
            if (duplicateReg) {
                throw new BadRequestError("A vehicle with this registration number already exists.");
            }
            updateData.registrationNumber = updateData.registrationNumber.trim();
        }

        // Allowed update fields
        const allowedFields = ["type", "make", "model", "year", "color", "plateNumber", "registrationNumber"];
        if (userRole === "admin") {
            allowedFields.push("status", "isActive", "driver");
        }

        const filteredUpdate = {};
        for (const key of allowedFields) {
            if (updateData[key] !== undefined) {
                filteredUpdate[key] = updateData[key];
            }
        }

        const updatedVehicle = await vehicleRepository.updateById(id, filteredUpdate);

        // If driver reference was updated by admin, update vehicle refs on drivers
        if (userRole === "admin" && filteredUpdate.driver && filteredUpdate.driver !== vehicle.driver._id.toString()) {
            // Remove ref from old driver
            await driverRepository.updateById(vehicle.driver._id, { $unset: { vehicle: 1 } });
            // Add ref to new driver
            await driverRepository.updateById(filteredUpdate.driver, { vehicle: id });
        }

        return updatedVehicle;
    }

    async deleteVehicle(id, userId, userRole) {
        const vehicle = await vehicleRepository.findById(id);
        if (!vehicle) {
            throw new NotFoundError("Vehicle");
        }

        // Only admin or the driver themselves can delete
        if (userRole !== "admin") {
            const driver = await driverRepository.findByUserId(userId);
            if (!driver || vehicle.driver._id.toString() !== driver._id.toString()) {
                throw new ForbiddenError("You are not authorized to delete this vehicle.");
            }
        }

        // We do a hard delete but clean up the driver's vehicle ref.
        await vehicleRepository.deleteById(id);

        // Clean up the driver's vehicle reference
        await driverRepository.updateById(vehicle.driver._id, { $unset: { vehicle: 1 } });

        return true;
    }
}

module.exports = new VehicleService();
