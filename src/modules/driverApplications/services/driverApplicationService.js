const mongoose = require("mongoose");

const driverApplicationRepository = require("../repositories/driverApplicationRepository");
const applicationVehicleRepository = require("../repositories/applicationVehicleRepository");
const driverRepository = require("../../drivers/repositories/driverRepository");

const {
    DRIVER_APPLICATION_STATUS,
} = require("../constant/driverApplicationConstants");

const NotFoundError = require("../../../shared/errors/NotFoundError");
const BadRequestError = require("../../../shared/errors/BadRequestError");

class DriverApplicationService {

    /**
     * Submit a new driver application.
     *
     * Uses a Mongoose transaction to atomically create both the DriverApplication
     * and the ApplicationVehicle. If either operation fails the whole transaction
     * is rolled back.
     *
     * @param {string} userId   - ID of the authenticated user (from req.user)
     * @param {object} applicationData - { licenseNumber, licenseExpiry }
     * @param {object} vehicleData     - { type, make, model, year, color, plateNumber }
     */
    async createApplication(userId, applicationData, vehicleData) {
        // Application-level duplicate check (before acquiring session) for a fast fail.
        const existingPending =
            await driverApplicationRepository.findPendingByUserId(userId);

        if (existingPending) {
            throw new BadRequestError(
                "You already have a pending driver application."
            );
        }

        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            const application = await driverApplicationRepository.create(
                {
                    user: userId,
                    status: DRIVER_APPLICATION_STATUS.PENDING,
                    ...applicationData,
                },
                { session }
            );

            await applicationVehicleRepository.create(
                {
                    application: application._id,
                    ...vehicleData,
                },
                { session }
            );

            await session.commitTransaction();

            // Return the full application with the vehicle populated.
            return driverApplicationRepository.findById(application._id);

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }

    /**
     * Retrieve a single application by ID. Throws 404 if not found.
     */
    async getApplicationById(id) {
        const application = await driverApplicationRepository.findById(id);

        if (!application) {
            throw new NotFoundError("Driver application");
        }

        return application;
    }

    /**
     * Retrieve all applications for the authenticated user, newest first.
     * Rejected applications are preserved — they are historical records.
     */
    async getUserApplications(userId) {
        return driverApplicationRepository.findByUserId(userId);
    }

    /**
     * Admin rejects a pending application.
     *
     * @param {string} id              - DriverApplication ID
     * @param {string} adminId         - ID of the reviewing admin
     * @param {string} rejectionReason - Reason text
     */
    async rejectApplication(id, adminId, rejectionReason) {
        const application = await this.getApplicationById(id);

        if (application.status !== DRIVER_APPLICATION_STATUS.PENDING) {
            throw new BadRequestError(
                "Only pending applications can be rejected."
            );
        }

        return driverApplicationRepository.updateById(id, {
            status: DRIVER_APPLICATION_STATUS.REJECTED,
            rejectionReason,
            reviewedAt: new Date(),
            reviewedBy: adminId,
        });
    }

    /**
     * Admin approves a pending application.
     *
     * Uses a Mongoose transaction to atomically:
     *   1. Update the application status to APPROVED
     *   2. Create the actual Driver entity
     *
     * If either operation fails the entire transaction is rolled back.
     *
     * @param {string} id      - DriverApplication ID
     * @param {string} adminId - ID of the reviewing admin
     */
    async approveApplication(id, adminId) {
        // Optimistic read outside transaction for a fast fail.
        const applicationSnapshot = await driverApplicationRepository.findById(id);

        if (!applicationSnapshot) {
            throw new NotFoundError("Driver application");
        }

        if (applicationSnapshot.status !== DRIVER_APPLICATION_STATUS.PENDING) {
            throw new BadRequestError(
                "Only pending applications can be approved."
            );
        }

        // Check for an existing driver before starting the transaction.
        const driverAlreadyExists = await driverRepository.existsByUserId(
            applicationSnapshot.user.toString()
        );

        if (driverAlreadyExists) {
            throw new BadRequestError(
                "A driver profile already exists for this user."
            );
        }

        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            const now = new Date();

            // Re-read inside the transaction session to get a consistent lock.
            const application =
                await driverApplicationRepository.findByIdWithSession(id, session);

            if (!application || application.status !== DRIVER_APPLICATION_STATUS.PENDING) {
                throw new BadRequestError(
                    "Application is no longer pending."
                );
            }

            // Mark application as approved.
            await driverApplicationRepository.updateById(
                id,
                {
                    status: DRIVER_APPLICATION_STATUS.APPROVED,
                    reviewedAt: now,
                    reviewedBy: adminId,
                },
                { session }
            );

            // Create the actual Driver entity.
            await driverRepository.create(
                {
                    user: application.user,
                    application: application._id,
                    licenseNumber: application.licenseNumber,
                    approvedAt: now,
                },
                { session }
            );

            await session.commitTransaction();

            // Return the updated application (with vehicle populated).
            return driverApplicationRepository.findById(id);

        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }
}

module.exports = new DriverApplicationService();
