const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const bcrypt = require('bcrypt');
app.use(express.json());
//conexión con la base de datos
const {connection} = require("../config.db");

const getproviders = (request, response) => {
    connection.query("SELECT * FROM proovedores", 
    (error, results) => {
        if(error)
            throw error;
        response.status(200).json(results);
    });
};

//ruta
app.route("/proovedores")
.get(getproviders);


//ruta para insertar un nuevo proveedor
const postProviders = async (request, response) => {
    const { nombre, apellidos, direccion, telefono, celular, email} = request.body;

    try {
        connection.query(
            "SELECT * FROM proovedores WHERE email = ?",
            [email],
            (error, results) => {
                if (error) {
                    console.error("Error al verificar proovedor:", error);
                    return response.status(500).json({ error: "Error en la consulta de proovedor" });
                }

                if (results.length > 0) {
                    return response.status(400).json({ error: "El correo ya está registrado en otro proovedor" });
                }

                // Insertar usuario si no existe
                connection.query(
                    "INSERT INTO proovedores(nombre, apellidos, direccion, telefono, celular, email) VALUES (?,?,?,?,?,?)",
                    [nombre, apellidos, direccion, telefono, celular, email],
                    (insertError, insertResults) => {
                        if (insertError) {
                            console.error("Error al insertar proovedor:", insertError);
                            return response.status(500).json({ error: "Error al registrar el proovedor" });
                        }
                        response.status(201).json({ message: "Proovedor añadido correctamente" });
                    }
                );
            }
        );
    } catch (error) {
        console.error("Error", error);
        response.status(500).json({ error: "Error en el servidor" });
    }
};
//ruta
app.route("/proovedores")
.post(postProviders);


const delProviders = (request, response) => {
    const id = request.params.id;
    connection.query("Delete from proovedores where id = ?", 
    [id],
    (error, results) => {
        if(error)
            throw error;
        response.status(201).json({"Proovedor eliminado":results.affectedRows});
    });
};

//ruta
app.route("/proovedores/:id")
.delete(delProviders);

//Ruta para actualizar permiso de acceso al usuario
const updateProovedorActivo = (request, response) => {
  const id = request.params.id;
  const { activo } = request.body;

  connection.query(
      "UPDATE proovedores SET activo = ? WHERE id = ?",
      [activo, id],
      (error, results) => {
          if (error) {
              console.error("Error al activar proovedor!:", error);
              return response.status(500).json({ error: "Error al activar proovedor." });
          }

          if (results.affectedRows === 0) {
              return response.status(404).json({ error: "Proovedor no encontrado" });
          }

          response.status(200).json({ message: "Se ha modificando el estado (activo) correctamente!" });
      }
  );
};

app.route("/proovedores/:id")
  .put(updateProovedorActivo);



  const getprovidersActivos = (request, response) => {
    connection.query("SELECT * FROM proovedores WHERE activo = 1", 
    (error, results) => {
        if(error)
            throw error;
        response.status(200).json(results);
    });
};

//ruta
app.route("/proovedores/activos")
.get(getprovidersActivos);

module.exports = app;