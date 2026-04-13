class TicketsController {
    static async getTicketsByGroup(fastify, groupId) {
        const query = `
            SELECT 
                t.id, 
                t.titulo, 
                t.descripcion, 
                t.creado_en, 
                t.fecha_final,
                u_autor.nombre_completo as autor_nombre,
                u_asig.nombre_completo as asignado_nombre,
                e.nombre as estado,
                e.color as estado_color,
                p.nombre as prioridad
            FROM tickets t
            LEFT JOIN usuarios u_autor ON t.autor_id = u_autor.id
            LEFT JOIN usuarios u_asig ON t.asignado_id = u_asig.id
            INNER JOIN estados e ON t.estado_id = e.id
            INNER JOIN prioridades p ON t.prioridad_id = p.id
            WHERE t.grupo_id = $1
            ORDER BY t.creado_en DESC
        `;
        const result = await fastify.pg.query(query, [groupId]);
        return result.rows;
    }

    static async getGroupStats(fastify, groupId) {
        const query = `
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE e.nombre = 'Pendiente') as pendientes,
                COUNT(*) FILTER (WHERE e.nombre = 'En Progreso') as en_progreso,
                COUNT(*) FILTER (WHERE e.nombre = 'Hecho') as hechos,
                COUNT(*) FILTER (WHERE e.nombre = 'Cerrado') as cerrados
            FROM tickets t
            INNER JOIN estados e ON t.estado_id = e.id
            WHERE t.grupo_id = $1
        `;
        const result = await fastify.pg.query(query, [groupId]);
        return result.rows[0];
    }

    static async saveHistory(fastify, ticketId, usuarioId, accion, detalles) {
        const query = `
            INSERT INTO historial_tickets (ticket_id, usuario_id, accion, detalles)
            VALUES ($1, $2, $3, $4)
        `;
        await fastify.pg.query(query, [ticketId, usuarioId, accion, JSON.stringify(detalles)]);
    }

    static async createTicket(fastify, ticketData) {
        const { grupo_id, titulo, descripcion, autor_id, asignado_id, estado_id, prioridad_id, fecha_final } = ticketData;
        const query = `
            INSERT INTO tickets (grupo_id, titulo, descripcion, autor_id, asignado_id, estado_id, prioridad_id, fecha_final)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;
        const values = [grupo_id, titulo, descripcion, autor_id, asignado_id, estado_id, prioridad_id, fecha_final];
        const result = await fastify.pg.query(query, values);
        const nuevoTicket = result.rows[0];

        // Guardamos en el historial
        await this.saveHistory(fastify, nuevoTicket.id, ticketData.autor_id, 'CREACIÓN', { 
            titulo: nuevoTicket.titulo,
            asignado_a: nuevoTicket.asignado_id 
        });

        return nuevoTicket;
    }

    static async updateTicket(fastify, ticketId, updateData, usuarioId) {
        const { titulo, descripcion, asignado_id, estado_id, prioridad_id, fecha_final } = updateData;
        
        // 1. Obtenemos el estado actual antes de actualizar para el historial
        const currentTicket = await fastify.pg.query('SELECT estado_id, asignado_id FROM tickets WHERE id = $1', [ticketId]);
        if (currentTicket.rowCount === 0) throw new Error('Ticket no encontrado');

        // 2. Ejecutamos la actualización
        const query = `
            UPDATE tickets 
            SET titulo = $1, descripcion = $2, asignado_id = $3, estado_id = $4, prioridad_id = $5, fecha_final = $6
            WHERE id = $7 RETURNING *;
        `;
        const values = [titulo, descripcion, asignado_id, estado_id, prioridad_id, fecha_final, ticketId];
        const result = await fastify.pg.query(query, values);
        const updatedTicket = result.rows[0];

        // 3. Guardamos en el historial que fue una ACTUALIZACIÓN
        // Guardamos los IDs viejos vs nuevos en el JSON de detalles
        await this.saveHistory(fastify, ticketId, usuarioId, 'ACTUALIZACIÓN', {
            antes: currentTicket.rows[0],
            despues: { estado_id, asignado_id }
        });

        return updatedTicket;
    }

    // borrar ticket
    static async deleteTicket(fastify, ticketId, usuarioId) {
        // 1. Obtenemos el ticket antes de eliminar para el historial
        const currentTicket = await fastify.pg.query('SELECT * FROM tickets WHERE id = $1', [ticketId]);
        if (currentTicket.rowCount === 0) throw new Error('Ticket no encontrado');

        // 2. Eliminamos el ticket
        const deleteQuery = 'DELETE FROM tickets WHERE id = $1';
        await fastify.pg.query(deleteQuery, [ticketId]);

        // // 3. Guardamos en el historial que fue una ELIMINACIÓN
        // await this.saveHistory(fastify, ticketId, usuarioId, 'ELIMINACIÓN', {
        //     ticket: currentTicket.rows[0]
        // });
    }

    static async getCatalogos(fastify) {
        const estados = await fastify.pg.query('SELECT id, nombre, color FROM estados ORDER BY id');
        const prioridades = await fastify.pg.query('SELECT id, nombre, orden FROM prioridades ORDER BY orden');
        
        return {
            estados: estados.rows,
            prioridades: prioridades.rows
        };
    }

    // Obtener todos los comentarios de un ticket
    static async getCommentsByTicket(fastify, ticketId) {
        const query = `
            SELECT 
                c.id, 
                c.contenido, 
                c.creado_en, 
                u.nombre_completo as autor_nombre,
                u.email as autor_email
            FROM comentarios c
            LEFT JOIN usuarios u ON c.autor_id = u.id
            WHERE c.ticket_id = $1
            ORDER BY c.creado_en ASC
        `;
        const result = await fastify.pg.query(query, [ticketId]);
        return result.rows;
    }

// Crear un comentario
    static async addComment(fastify, commentData) {
        const { ticket_id, autor_id, contenido } = commentData;
        const query = `
            INSERT INTO comentarios (ticket_id, autor_id, contenido)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const result = await fastify.pg.query(query, [ticket_id, autor_id, contenido]);
        
        // Opcional: Registrar en el historial que hubo un nuevo comentario
        await this.saveHistory(fastify, ticket_id, autor_id, 'COMENTARIO', { 
            comentario: contenido.substring(0, 30) + '...'
        });

        return result.rows[0];
    }

}
module.exports = TicketsController;