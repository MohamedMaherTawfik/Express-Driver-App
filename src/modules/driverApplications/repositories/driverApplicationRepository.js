const DriverApplication = require("../models/driverApplication");
const { DRIVER_APPLICATION_STATUS } = require("../constant/driverApplicationConstants");

class DriverApplicationRepository {

    async create(data, options = {}) {
        /*
         * When called inside a transaction, options.session must be provided.
         * DriverApplication.create() with a session requires an array of docs.
         */
        if (options.session) {
            const [application] = await DriverApplication.create([data], {
                session: options.session,
            });
            return application;
        }
        return DriverApplication.create(data);
    }

    async findById(id) {
        return DriverApplication.findById(id).populate("vehicle");
    }

    async findByUserId(userId) {
        return DriverApplication.find({ user: userId })
            .populate("vehicle")
            .sort({ createdAt: -1 });
    }

    async findLatestByUserId(userId) {
        return DriverApplication.findOne({ user: userId })
            .populate("vehicle")
            .sort({ createdAt: -1 });
    }

    async findPendingByUserId(userId) {
        return DriverApplication.findOne({
            user: userId,
            status: DRIVER_APPLICATION_STATUS.PENDING,
        });
    }

    /**
     * Finds an application by id within a transaction session.
     * Passing a session locks the document for the duration of the transaction.
     */
    async findByIdWithSession(id, session) {
        return DriverApplication.findById(id)
            .populate("vehicle")
            .session(session);
    }

    async updateById(id, data, options = {}) {
        return DriverApplication.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
            session: options.session,
        }).populate("vehicle");
    }

    async deleteById(id) {
        return DriverApplication.findByIdAndDelete(id);
    }
}

module.exports = new DriverApplicationRepository();
