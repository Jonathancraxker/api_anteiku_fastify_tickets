const fastifyPostgres = require('@fastify/postgres');
const fp = require('fastify-plugin');

async function dbConnector(fastify) {
fastify.register(fastifyPostgres, {
    connectionString: process.env.DATABASE_URL
});
}

module.exports = fp(dbConnector);