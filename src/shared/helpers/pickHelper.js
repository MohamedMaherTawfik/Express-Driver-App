/**
 * Pick only allowed fields from an object.
 *
 * @param {Object} obj
 * @param {string[]} allowedFields
 * @returns {Object}
 */
module.exports = (obj, allowedFields) => {
    return allowedFields.reduce((result, field) => {
        if (obj[field] !== undefined) {
            result[field] = obj[field];
        }   
        return result;
    }, {});
};