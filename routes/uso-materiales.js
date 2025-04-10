const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
app.use(express.json());

// conexión con la base de datos
const { connection } = require("../config.db");


const getUsoMateriales = (request, response) => {
    const query = `
        SELECT 
            um.id, 
            u.nombreUsuario AS operador,
            p.nombre AS material,
            um.cantidad_usada, 
            t.titulo AS tarea, 
            um.fecha_uso
        FROM uso_materiales um
        JOIN usuarios u ON um.usuario_id = u.id
        JOIN productos p ON um.producto_id = p.id
        JOIN tareas t ON um.tarea_id = t.id
        ORDER BY um.fecha_uso DESC;
    `;

    connection.query(query, (error, results) => {
        if (error) {
            console.error("Error al obtener el uso de materiales:", error);
            return response.status(500).json({ error: "Error en la consulta" });
        }

        if (results.length === 0) {
            return response.status(404).json({ error: "No hay registros de uso de materiales" });
        }

        response.status(200).json(results);
    });
};

// Ruta para obtener el uso de materiales
app.route("/uso-materiales").get(getUsoMateriales);


// función para registrar el uso de materiales
const registrarUsoMaterial = (request, response) => {
    const { tarea_id, producto_id, usuario_id, cantidad_usada } = request.body;

    // Validación básica
    if (!tarea_id || !producto_id || !usuario_id || !cantidad_usada || cantidad_usada <= 0) {
        return response.status(400).json({ error: "Datos incompletos o inválidos" });
    }

    const query = `
        INSERT INTO uso_materiales (tarea_id, producto_id, usuario_id, cantidad_usada)
        VALUES (?, ?, ?, ?)
    `;

    connection.query(query, [tarea_id, producto_id, usuario_id, cantidad_usada], (error, results) => {
        if (error) {
            console.error("Error al registrar el uso de materiales:", error);
            return response.status(500).json({ error: "Error en el servidor" });
        }

        response.status(201).json({ message: "Uso de material registrado exitosamente", id: results.insertId });
    });
};

// ruta
app.route("/uso-materiales")
.post(registrarUsoMaterial);

module.exports = app;