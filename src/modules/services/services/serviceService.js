const serviceRepository = require("../repositories/serviceRepository");
const { SERVICE_TYPE, SERVICE_STATUS, VEHICLE_TYPE } = require("../constants/serviceConstants");
const NotFoundError = require("../../../shared/errors/NotFoundError");
const BadRequestError = require("../../../shared/errors/BadRequestError");

const slugify = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-")
        .replace(/^-+|-+$/g, "");
};

class ServiceService {
    async createService(serviceData) {
        if (!serviceData.name) {
            throw new BadRequestError("Service name is required.");
        }

        const name = serviceData.name.trim();

        // Validate type
        if (!serviceData.type || !Object.values(SERVICE_TYPE).includes(serviceData.type)) {
            throw new BadRequestError(
                `Service type is invalid. Must be one of: ${Object.values(SERVICE_TYPE).join(", ")}`
            );
        }

        // Validate basePrice
        if (serviceData.basePrice === undefined || serviceData.basePrice === null || isNaN(serviceData.basePrice) || Number(serviceData.basePrice) < 0) {
            throw new BadRequestError("Base price is required and cannot be negative.");
        }

        // Validate pricePerKm if provided
        if (serviceData.pricePerKm !== undefined && (isNaN(serviceData.pricePerKm) || Number(serviceData.pricePerKm) < 0)) {
            throw new BadRequestError("Price per kilometer cannot be negative.");
        }

        // Validate pricePerMinute if provided
        if (serviceData.pricePerMinute !== undefined && (isNaN(serviceData.pricePerMinute) || Number(serviceData.pricePerMinute) < 0)) {
            throw new BadRequestError("Price per minute cannot be negative.");
        }

        // Validate allowedVehicleTypes if provided
        if (serviceData.allowedVehicleTypes && Array.isArray(serviceData.allowedVehicleTypes)) {
            for (const vt of serviceData.allowedVehicleTypes) {
                if (!Object.values(VEHICLE_TYPE).includes(vt)) {
                    throw new BadRequestError(
                        `Invalid vehicle type '${vt}'. Must be one of: ${Object.values(VEHICLE_TYPE).join(", ")}`
                    );
                }
            }
        }

        const slug = slugify(serviceData.slug || name);

        if (!slug) {
            throw new BadRequestError("Valid service slug or name is required.");
        }

        // Check duplicate slug
        const existingSlug = await serviceRepository.findBySlug(slug);
        if (existingSlug) {
            throw new BadRequestError("A service with this slug already exists.");
        }

        // Check duplicate name (case-insensitive)
        const existingName = await serviceRepository.findOne({
            name: { $regex: new RegExp(`^${name.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i") }
        });
        if (existingName) {
            throw new BadRequestError("A service with this name already exists.");
        }

        // Sanitized insertion payload (mass-assignment protection)
        const newServiceData = {
            name,
            slug,
            description: serviceData.description ? serviceData.description.trim() : "",
            type: serviceData.type,
            status: serviceData.status || SERVICE_STATUS.ACTIVE,
            basePrice: Number(serviceData.basePrice),
            pricePerKm: serviceData.pricePerKm !== undefined ? Number(serviceData.pricePerKm) : 0,
            pricePerMinute: serviceData.pricePerMinute !== undefined ? Number(serviceData.pricePerMinute) : 0,
            estimatedDurationMin: serviceData.estimatedDurationMin ? Number(serviceData.estimatedDurationMin) : undefined,
            allowedVehicleTypes: Array.isArray(serviceData.allowedVehicleTypes) ? serviceData.allowedVehicleTypes : [],
            isActive: serviceData.isActive !== undefined ? serviceData.isActive : true,
        };

        return serviceRepository.create(newServiceData);
    }

    async getServiceById(id, userRole) {
        const service = await serviceRepository.findById(id);
        if (!service) {
            throw new NotFoundError("Service");
        }

        // Non-admin users can only view active services
        if (userRole !== "admin" && (!service.isActive || service.status !== SERVICE_STATUS.ACTIVE)) {
            throw new NotFoundError("Service");
        }

        return service;
    }

    async getServiceBySlug(slug, userRole) {
        const normalizedSlug = slugify(slug);
        const service = await serviceRepository.findBySlug(normalizedSlug);
        if (!service) {
            throw new NotFoundError("Service");
        }

        // Non-admin users can only view active services
        if (userRole !== "admin" && (!service.isActive || service.status !== SERVICE_STATUS.ACTIVE)) {
            throw new NotFoundError("Service");
        }

        return service;
    }

    async getServices(queryParams = {}, userRole) {
        const {
            page = 1,
            limit = 10,
            sort = "-createdAt",
            type,
            status,
            isActive,
            search,
        } = queryParams;

        const filter = {};

        // Non-admin can only view active services
        if (userRole !== "admin") {
            filter.isActive = true;
            filter.status = SERVICE_STATUS.ACTIVE;
        } else {
            if (status) filter.status = status;
            if (isActive !== undefined) {
                filter.isActive = isActive === "true" || isActive === true;
            }
        }

        if (type) {
            filter.type = type;
        }

        if (search) {
            filter.name = { $regex: search.trim(), $options: "i" };
        }

        // Parsing sort
        let sortOption = { createdAt: -1 };
        if (sort) {
            const direction = sort.startsWith("-") ? -1 : 1;
            const field = sort.replace(/^[+-]/, "");
            sortOption = { [field]: direction };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        return serviceRepository.findMany({
            filter,
            sort: sortOption,
            skip,
            limit: parseInt(limit),
        });
    }

    async updateService(id, updateData) {
        const service = await serviceRepository.findById(id);
        if (!service) {
            throw new NotFoundError("Service");
        }

        // Validate type if updated
        if (updateData.type && !Object.values(SERVICE_TYPE).includes(updateData.type)) {
            throw new BadRequestError(
                `Service type is invalid. Must be one of: ${Object.values(SERVICE_TYPE).join(", ")}`
            );
        }

        // Validate status if updated
        if (updateData.status && !Object.values(SERVICE_STATUS).includes(updateData.status)) {
            throw new BadRequestError(
                `Service status is invalid. Must be one of: ${Object.values(SERVICE_STATUS).join(", ")}`
            );
        }

        // Validate numeric prices if updated
        if (updateData.basePrice !== undefined && (isNaN(updateData.basePrice) || Number(updateData.basePrice) < 0)) {
            throw new BadRequestError("Base price cannot be negative.");
        }
        if (updateData.pricePerKm !== undefined && (isNaN(updateData.pricePerKm) || Number(updateData.pricePerKm) < 0)) {
            throw new BadRequestError("Price per kilometer cannot be negative.");
        }
        if (updateData.pricePerMinute !== undefined && (isNaN(updateData.pricePerMinute) || Number(updateData.pricePerMinute) < 0)) {
            throw new BadRequestError("Price per minute cannot be negative.");
        }

        // Validate allowedVehicleTypes if updated
        if (updateData.allowedVehicleTypes && Array.isArray(updateData.allowedVehicleTypes)) {
            for (const vt of updateData.allowedVehicleTypes) {
                if (!Object.values(VEHICLE_TYPE).includes(vt)) {
                    throw new BadRequestError(
                        `Invalid vehicle type '${vt}'. Must be one of: ${Object.values(VEHICLE_TYPE).join(", ")}`
                    );
                }
            }
        }

        // Check duplicate name if name is updated (case-insensitive)
        if (updateData.name && updateData.name.trim() !== service.name) {
            const duplicateName = await serviceRepository.findOne({
                name: { $regex: new RegExp(`^${updateData.name.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i") },
                _id: { $ne: id },
            });
            if (duplicateName) {
                throw new BadRequestError("A service with this name already exists.");
            }
            updateData.name = updateData.name.trim();
        }

        // Check duplicate slug if slug is updated
        if (updateData.slug) {
            const normalizedSlug = slugify(updateData.slug);
            if (normalizedSlug !== service.slug) {
                const duplicateSlug = await serviceRepository.findOne({
                    slug: normalizedSlug,
                    _id: { $ne: id },
                });
                if (duplicateSlug) {
                    throw new BadRequestError("A service with this slug already exists.");
                }
                updateData.slug = normalizedSlug;
            }
        }

        // Whitelist allowed fields for update
        const allowedFields = [
            "name",
            "slug",
            "description",
            "type",
            "status",
            "basePrice",
            "pricePerKm",
            "pricePerMinute",
            "estimatedDurationMin",
            "allowedVehicleTypes",
            "isActive",
        ];

        const filteredUpdate = {};
        for (const key of allowedFields) {
            if (updateData[key] !== undefined) {
                filteredUpdate[key] = updateData[key];
            }
        }

        return serviceRepository.updateById(id, filteredUpdate);
    }

    async deleteService(id, { hardDelete = false } = {}) {
        const service = await serviceRepository.findById(id);
        if (!service) {
            throw new NotFoundError("Service");
        }

        if (hardDelete) {
            const mongoose = require("mongoose");
            const Order = mongoose.models.Order;
            if (Order) {
                const isReferenced = await Order.exists({ service: id });
                if (isReferenced) {
                    throw new BadRequestError("Cannot hard delete service because it is referenced in existing orders.");
                }
            }
            await serviceRepository.deleteById(id);
        } else {
            // Default safe deactivation to preserve historical order integrity
            await serviceRepository.updateById(id, {
                isActive: false,
                status: SERVICE_STATUS.INACTIVE,
            });
        }

        return true;
    }
}

module.exports = new ServiceService();
