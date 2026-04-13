require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const dbConnector = require('./config/db');
const fastifyJwt = require('@fastify/jwt');
const cors = require('@fastify/cors');

fastify.register(fastifyJwt, {
    secret: process.env.JWT_SECRET
});

fastify.register(dbConnector);

fastify.register(cors, {
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
});

fastify.decorate('authenticate', async function(request, reply) {
    try {
        await request.jwtVerify();
    } catch (err) {
        reply.send(err);
    }
});

fastify.get('/', async (request, reply) => {
return { status: 'Tickets Service is Online', timestamp: new Date() };
});

fastify.register(require('./routes/tickets.routes'), { prefix: '/anteiku/tickets' });

module.exports = fastify;