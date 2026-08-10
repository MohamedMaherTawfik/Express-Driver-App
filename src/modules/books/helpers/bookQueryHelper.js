class BookQueryHelper {
    buildFilter(query) {
        const filter = {};

        // Search
        if (typeof query.search === "string" && query.search.trim()) {
            filter.title = {
                $regex: query.search.trim(),
                $options: "i"
            };
        }

        // Allowed filter fields only
        const allowedFilters = [
            "author",
            "price",
            "pages"
        ];

        // Allowed operators only
        const allowedOperators = [
            "gt",
            "gte",
            "lt",
            "lte",
            "in"
        ];

        allowedFilters.forEach(field => {
            if (query[field] === undefined) {
                return;
            }

            const value = query[field];

            // Example:
            // ?price[gte]=100
            if (
                typeof value === "object" &&
                value !== null &&
                !Array.isArray(value)
            ) {
                filter[field] = {};

                Object.keys(value).forEach(operator => {
                    if (allowedOperators.includes(operator)) {
                        filter[field][`$${operator}`] = value[operator];
                    }
                });

                if (Object.keys(filter[field]).length === 0) {
                    delete filter[field];
                }

                return;
            }

            // Normal equality
            filter[field] = value;
        });

        return filter;
    }

    buildPagination(query) {
        const page = Math.max(Number(query.page) || 1, 1);

        // Max 100 items per request
        const limit = Math.min(
            Math.max(Number(query.limit) || 10, 1),
            100
        );

        return {
            page,
            limit,
            skip: (page - 1) * limit
        };
    }

    buildSort(query) {
        const allowedSortFields = [
            "title",
            "price",
            "pages",
            "createdAt"
        ];

        if (!query.sort) {
            return "-createdAt";
        }

        const field = query.sort.replace("-", "");

        if (!allowedSortFields.includes(field)) {
            return "-createdAt";
        }

        return query.sort;
    }

    buildPaginationMeta({ page, limit, totalItems }) {
        const totalPages = Math.ceil(totalItems / limit);

        return {
            currentPage: page,
            perPage: limit,
            totalItems,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
        };
    }
}

module.exports = new BookQueryHelper();