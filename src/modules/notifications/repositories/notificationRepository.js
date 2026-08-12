const Notification = require("../models/Notification");

class NotificationRepository {
    async create(data) {
        return Notification.create(data);
    }

    async findById(id) {
        return Notification.findById(id);
    }

    async findByUserId(userId, options = {}) {
        const {
            page = 1,
            limit = 20,
            unreadOnly = false
        } = options;

        const skip = (page - 1) * limit;

        const filter = {
            user: userId
        };

        if (unreadOnly) {
            filter.readAt = null;
        }

        const [notifications, total] = await Promise.all([
            Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),

            Notification.countDocuments(filter)
        ]);

        return {
            notifications,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async countUnreadByUserId(userId) {
        return Notification.countDocuments({
            user: userId,
            readAt: null
        });
    }

    async markAsRead(id, userId) {
        return Notification.findOneAndUpdate(
            {
                _id: id,
                user: userId,
                readAt: null
            },
            {
                readAt: new Date()
            },
            {
                new: true
            }
        );
    }

    async markAllAsRead(userId) {
        return Notification.updateMany(
            {
                user: userId,
                readAt: null
            },
            {
                readAt: new Date()
            }
        );
    }

    async deleteById(id, userId) {
        return Notification.findOneAndDelete({
            _id: id,
            user: userId
        });
    }

    async deleteAllByUserId(userId) {
        return Notification.deleteMany({
            user: userId
        });
    }
}

module.exports = new NotificationRepository();