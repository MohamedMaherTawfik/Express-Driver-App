class BookQueryHelper {
    buildFilter(query) {
        const queryObject = { ...query };
        const excludedFields = ["page", "sort", "limit", "search"];

        excludedFields.forEach(field => delete queryObject[field]);

        let queryString = JSON.stringify(queryObject);
        queryString = queryString.replace(
            /\b(gt|gte|lt|lte|in)\b/g,
            match => `$${match}`
        );

        const filter = JSON.parse(queryString);

        if (query.search) {
            filter.title = {
                $regex: query.search,
                $options: "i"
            };
        }

        return filter;
    }

    buildPagination(query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 10;
        const skip = (page - 1) * limit;

        return {
            page,
            limit,
            skip
        };
    }

    buildSort(query) {
        return query.sort || "-createdAt";
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
