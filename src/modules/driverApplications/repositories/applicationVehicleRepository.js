const ApplicationVehicle = require("../models/applicationVehicle");

class ApplicationVehicleRepository {

    async create(data, options = {}) {
        if (options.session) {
            const [vehicle] = await ApplicationVehicle.create([data], {
                session: options.session,
            });
            return vehicle;
        }
        return ApplicationVehicle.create(data);
    }

    async findById(id) {
        return ApplicationVehicle.findById(id);
    }

    async findByApplicationId(applicationId) {
        return ApplicationVehicle.findOne({ application: applicationId });
    }

    async updateById(id, data) {
        return ApplicationVehicle.findByIdAndUpdate(id, data, {
            new: true,
            runValidators: true,
        });
    }

    async deleteById(id) {
        return ApplicationVehicle.findByIdAndDelete(id);
    }
}

module.exports = new ApplicationVehicleRepository();
