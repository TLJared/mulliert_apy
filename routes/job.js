const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
app.use(express.json());

// Conexión con la base de datos
const { connection } = require("../config.db");

const getTareas = (request, response) => {
    connection.query("SELECT * FROM tareas", (error, results) => {
        if (error) {
            console.error("Error al obtener tareas:", error);
            return response.status(500).json({ error: "Error en la consulta de tareas" });
        }
        if (results.length === 0) {
            return response.status(404).json({ error: "No hay tareas registradas" });
        }
        response.status(200).json(results);
    });
};

// Ruta para obtener todas las tareas
app.route("/tareas").get(getTareas);

const crearTarea = (request, response) => {
    const { titulo, descripcion, fecha_vencimiento, usuario_id } = request.body;

    if (!titulo || !descripcion) {
        return response.status(400).json({ error: "Título y descripción son obligatorios" });
    }

    const status = "pendiente"; // Estado por defecto

    connection.query(
        "INSERT INTO tareas (titulo, descripcion, fecha_vencimiento, status, usuario_id) VALUES (?, ?, ?, ?, ?)",
        [titulo, descripcion, fecha_vencimiento, status, usuario_id || null],
        (error, results) => {
            if (error) {
                console.error("Error al crear tarea:", error);
                return response.status(500).json({ error: "Error al crear la tarea" });
            }
            response.status(201).json({ message: "Tarea creada correctamente", tarea_id: results.insertId });
        }
    );
};

// Ruta para crear una tarea
app.route("/tareas").post(crearTarea);


// ---------------------- ASIGNAR TAREA A UN USUARIO ----------------------
const asignarTarea = (request, response) => {
    const id = request.params.id; // ID de la tarea
    const { usuario_id } = request.body; // ID del usuario

    // Verificar si la tarea existe
    connection.query("SELECT * FROM tareas WHERE id = ?", [id], (error, tareaResults) => {
        if (error) {
            console.error("Error al buscar tarea:", error);
            return response.status(500).json({ error: "Error en la consulta de la tarea" });
        }
        if (tareaResults.length === 0) {
            return response.status(404).json({ error: "Tarea no encontrada" });
        }

        // Verificar si el usuario existe
        connection.query("SELECT * FROM usuarios WHERE id = ?", [usuario_id], (error, usuarioResults) => {
            if (error) {
                console.error("Error al buscar usuario:", error);
                return response.status(500).json({ error: "Error en la consulta del usuario" });
            }
            if (usuarioResults.length === 0) {
                return response.status(404).json({ error: "Usuario no encontrado" });
            }

            // Asignar la tarea al usuario
            connection.query(
                "UPDATE tareas SET usuario_id = ? WHERE id = ?",
                [usuario_id, id],
                (updateError, updateResults) => {
                    if (updateError) {
                        console.error("Error al asignar tarea:", updateError);
                        return response.status(500).json({ error: "Error al asignar la tarea" });
                    }
                    response.status(200).json({ message: "Tarea asignada correctamente", tarea_id: id, usuario_id });
                }
            );
        });
    });
};

// Ruta para asignar tarea
app.route("/tareas/:id/asignar").put(asignarTarea);


//-----------------------  GET TAREA POR USUARIO ----------------------
const getTareasPorUsuario = (request, response) => {
    const usuarioId = request.params.usuarioId;

    connection.query(
        "SELECT * FROM tareas WHERE usuario_id = ?",
        [usuarioId],
        (error, results) => {
            if (error) {
                console.error("Error al obtener tareas:", error);
                return response.status(500).json({ error: "Error al obtener las tareas" });
            }
            response.status(200).json(results);
        }
    );
};

// Ruta para obtener tareas por usuario
app.route("/tareas/usuario/:usuarioId").get(getTareasPorUsuario);
//----------------------------------------------
const actualizarEstadoTarea = (request, response) => {
    const { id } = request.params;
    const { status } = request.body;

    const estadosValidos = ["pendiente", "en_progreso", "completada", "cancelada"];
    if (!estadosValidos.includes(status)) {
        return response.status(400).json({ error: "Estado no válido" });
    }

    connection.query(
        "UPDATE tareas SET status = ? WHERE id = ?",
        [status, id],
        (error) => {
            if (error) {
                console.error("Error al actualizar tarea:", error);
                return response.status(500).json({ error: "Error al actualizar la tarea" });
            }
            response.status(200).json({ message: "Estado actualizado correctamente" });
        }
    );
};

// Ruta para actualizar estado de tarea
app.route("/tareas/:id/status").put(actualizarEstadoTarea);

module.exports = app;
