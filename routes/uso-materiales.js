const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
app.use(express.json());

// conexión con la base de datos
const { connection } = require("../config.db");

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