const driverRepository = require("../repositories/driverRepository");
const { DRIVER_AVAILABILITY_STATUS } = require("../constants/driverConstants");

const NotFoundError = require("../../../shared/errors/NotFoundError");
const BadRequestError = require("../../../shared/errors/BadRequestError");

class DriverService {

    /**
     * Retrieve a driver by their Driver document ID.
     */
    async getDriverById(id) {
        const driver = await driverRepository.findById(id);

        if (!driver) {
            throw new NotFoundError("Driver");
        }

        return driver;
    }

    /**
     * Retrieve the driver profile for the currently authenticated user.
     */
    async getDriverByUserId(userId) {
        const driver = await driverRepository.findByUserId(userId);

        if (!driver) {
            throw new NotFoundError("Driver");
        }

        return driver;
    }

    /**
     * Update the driver's availability status.
     * Only values defined in DRIVER_AVAILABILITY_STATUS are accepted.
     *
     * @param {string} driverId          - Driver document ID
     * @param {string} availabilityStatus - One of DRIVER_AVAILABILITY_STATUS values
     */
    async updateAvailability(driverId, availabilityStatus) {
        if (!Object.values(DRIVER_AVAILABILITY_STATUS).includes(availabilityStatus)) {
            throw new BadRequestError(
                `Invalid availability status. Must be one of: ${Object.values(DRIVER_AVAILABILITY_STATUS).join(", ")}`
            );
        }

        const driver = await driverRepository.updateById(driverId, {
            availabilityStatus,
        });

        if (!driver) {
            throw new NotFoundError("Driver");
        }

        return driver;
    }
}

module.exports = new DriverService();
