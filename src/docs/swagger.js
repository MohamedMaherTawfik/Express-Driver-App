const swaggerJsdoc = require("swagger-jsdoc");

const schemas = require("./schemas");
const responses = require("./responses");

const options = {
    definition: {
        openapi: "3.0.0",

        info: {
            title: "Express Starter API",
            version: "1.0.0"
        },

        servers: [
            {
                url: "http://localhost:3000"
            }
        ],

        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            },

            schemas,

            responses
        }
    },

    apis: [
        "./src/modules/**/routes/*.js",
        "./src/docs/**/*.js"
    ]
};

module.exports = swaggerJsdoc(options);