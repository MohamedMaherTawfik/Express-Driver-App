const httpStatus = require("../constants/httpStatus");

class ApiResponse {
    static ok(res, data = null, message = undefined, meta = null) {
        const response = {
            success: true
        };

        if (message) {
            response.message = message;
        }

        response.data = data;

        if (meta) {
            response.meta = meta;
        }

        return res.status(httpStatus.OK).json(response);
    }

    static created(res, data = null, message = undefined) {
        const response = {
            success: true
        };

        if (message) {
            response.message = message;
        }

        response.data = data;

        return res.status(httpStatus.CREATED).json(response);
    }

    static noContent(res) {
        return res.status(httpStatus.NO_CONTENT).send();
    }
}

module.exports = ApiResponse;
