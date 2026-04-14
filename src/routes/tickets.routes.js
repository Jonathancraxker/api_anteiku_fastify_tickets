const TicketsController = require('../controllers/tickets.controller');

async function ticketRoutes(fastify, options) {
    
    // Obtener tickets de un grupo
    fastify.get('/group/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        try {
            const data = await TicketsController.getTicketsByGroup(fastify, id);
            return { statusCode: 200, intOp: "SxTKS200", data };
        } catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: 'Error al obtener tickets' });
        }
    });

    // Obtener estadísticas de un grupo
    fastify.get('/group/:id/stats', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        const data = await TicketsController.getGroupStats(fastify, id);
        return { statusCode: 200, intOp: "SxTKS201", data };
    });

    fastify.post('/', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        // Ahora autor_id puede venir directamente del token: request.user.id
        const ticketData = { ...request.body, autor_id: request.user.id };
        const data = await TicketsController.createTicket(fastify, ticketData);
        return { statusCode: 201, intOp: "SxTKS202", data: [data, {message: "Ticket creado"}] };
    });

    // Actualizar ticket
    fastify.put('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        const usuarioId = request.user.id; // Obtenido del JWT
        try {
            const data = await TicketsController.updateTicket(fastify, id, request.body, usuarioId);
            return { statusCode: 200, intOp: "SxTKS203", data: [data, {message: "Ticket actualizado"}] };
        } catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });

    // Eliminar ticket
    fastify.delete('/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        const usuarioId = request.user.id;
        try {
            await TicketsController.deleteTicket(fastify, id, usuarioId);
            return { statusCode: 200, intOp: "SxTKS204", data: [{message: "Ticket eliminado"}] };
        } catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });

    // Obtener catálogos para los Selects del Front
    fastify.get('/catalogos', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const data = await TicketsController.getCatalogos(fastify);
        return { statusCode: 200, intOp: "SxTKS205", data };
    });

    // Obtener comentarios de un ticket específico
    fastify.get('/:id/comments', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        const data = await TicketsController.getCommentsByTicket(fastify, id);
        return { statusCode: 200, intOp: "SxTKS206", data: [data, { message: "Comentarios obtenidos" }] };
    });

    // Agregar comentario
    fastify.post('/:id/comments', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { id } = request.params;
        const commentData = {
            ticket_id: id,
            autor_id: request.user.id,
            contenido: request.body.contenido
        };
        const data = await TicketsController.addComment(fastify, commentData);
        return { statusCode: 201, intOp: "SxTKS207", data: [data, { message: "Comentario añadido" }] };
    });

    // Mis tickets asignados (Perfil)
    fastify.get('/my-assigned', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        try {
            const data = await TicketsController.getMyAssigned(fastify, request.user.id);
            return { statusCode: 200, intOp: "SxTKS208", data };
        } catch (err) {
            return reply.status(500).send({ error: err.message });
        }
    });

    // Mis estadísticas (Perfil)
    fastify.get('/my-stats', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        try {
            const data = await TicketsController.getMyStats(fastify, request.user.id);
            return { statusCode: 200, intOp: "SxTKS209", data };
        } catch (err) {
            return reply.status(500).send({ error: err.message });
        }
    });

    // Endpoint para obtener el historial de un grupo
    fastify.get('/group-history/:groupId', { preHandler: [fastify.authenticate] }, async (request, reply) => {
        const { groupId } = request.params;
        try {
            const data = await TicketsController.getGroupHistory(fastify, groupId);
            return { statusCode: 200, intOp: "SxTKS210", data };
        } catch (err) {
            return reply.status(500).send({ error: err.message });
        }
    });

}
module.exports = ticketRoutes;