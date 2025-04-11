const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const bcrypt = require('bcrypt');
app.use(express.json());
//conexión con la base de datos
const {connection} = require("../config.db");

const getUsuario = (request, response) => {
    connection.query("SELECT * FROM usuarios", 
    (error, results) => {
        if(error)
            throw error;
        response.status(200).json(results);
    });
};

//ruta
app.route("/usuarios")
.get(getUsuario);

const postUsuario = async (request, response) => {
    const { username, nombreUsuario, apellidoUser, email, contrasena, telefono } = request.body;

    try {
        // Encriptar la contraseña
        const saltRounds = 10;
        const contrasenaEncriptada = await bcrypt.hash(contrasena, saltRounds);

        // Verificar si el usuario ya existe en la base de datos antes de insertarlo
        connection.query(
            "SELECT * FROM usuarios WHERE email = ?",
            [email],
            (error, results) => {
                if (error) {
                    console.error("Error al verificar usuario:", error);
                    return response.status(500).json({ error: "Error en la consulta de usuario" });
                }

                if (results.length > 0) {
                    return response.status(400).json({ error: "El correo ya está registrado" });
                }

                // Insertar usuario si no existe
                connection.query(
                    "INSERT INTO usuarios(username, nombreUsuario, apellidoUser, email, contrasena, telefono) VALUES (?,?,?,?,?,?)",
                    [username, nombreUsuario, apellidoUser, email, contrasenaEncriptada, telefono],
                    (insertError, insertResults) => {
                        if (insertError) {
                            console.error("Error al insertar usuario:", insertError);
                            return response.status(500).json({ error: "Error al registrar el usuario" });
                        }
                        response.status(201).json({ message: "Usuario añadido correctamente" });
                    }
                );
            }
        );
    } catch (error) {
        console.error("Error al encriptar la contraseña:", error);
        response.status(500).json({ error: "Error al encriptar la contraseña" });
    }
};
//ruta
app.route("/usuarios")
.post(postUsuario);


const delUsuario = (request, response) => {
    const id = request.params.id;
    connection.query("Delete from usuarios where id = ?", 
    [id],
    (error, results) => {
        if(error)
            throw error;
        response.status(201).json({"Usuario eliminado":results.affectedRows});
    });
};

//ruta
app.route("/usuarios/:id")
.delete(delUsuario);

//----------------------------
const loginUsuario = async (request, response) => {
  const { email, contrasena } = request.body;

  try {
      connection.query(
          "SELECT * FROM usuarios WHERE email = ?",
          [email],
          async (error, results) => {
              if (error) throw error;

              if (results.length === 0) {
                  return response.status(400).json({ error: "Usuario no encontrado" });
              }

              const usuario = results[0];

              if (usuario.statusU === 0) {
                  return response.status(403).json({ error: "No se ha dado de alta tu cuenta. Contacta al administrador." });
              }

              const passwordMatch = await bcrypt.compare(contrasena, usuario.contrasena);

              if (!passwordMatch) {
                  return response.status(400).json({ error: "Contraseña incorrecta" });
              }

              response.status(200).json({
                  message: "Login exitoso",
                  usuario: {
                      id: usuario.id,
                      nombreUsuario: usuario.nombreUsuario,
                      email: usuario.email,
                      rol: usuario.rol // Se envía el rol del usuario
                  }
              });
          }
      );
  } catch (error) {
      console.error("Error al verificar el usuario:", error);
      response.status(500).json({ error: "Error al verificar el usuario" });
  }
};


  // Ruta para login
  app.route("/login").post(loginUsuario);


  
//Ruta para actualizar permiso de acceso al usuario
const updateUsuarioStatus = (request, response) => {
  const id = request.params.id;
  const { statusU } = request.body;

  connection.query(
      "UPDATE usuarios SET statusU = ? WHERE id = ?",
      [statusU, id],
      (error, results) => {
          if (error) {
              console.error("Error al actualizar el usuario:", error);
              return response.status(500).json({ error: "Error al actualizar el usuario" });
          }

          if (results.affectedRows === 0) {
              return response.status(404).json({ error: "Usuario no encontrado" });
          }

          response.status(200).json({ message: "Usuario actualizado correctamente" });
      }
  );
};

app.route("/usuarios/:id")
  .put(updateUsuarioStatus);
//-----------------------------

// función para actualizar el rol del usuario
const updateUserRole = (request, response) => {
  const id = request.params.id;
  const { rol } = request.body;

  if (!rol || !["admin", "operador"].includes(rol)) {
      return response.status(400).json({ error: "Rol inválido" });
  }

  connection.query(
      "UPDATE usuarios SET rol = ? WHERE id = ?",
      [rol, id],
      (error, results) => {
          if (error) {
              console.error("Error al actualizar el rol del usuario:", error);
              return response.status(500).json({ error: "Error al actualizar el rol" });
          }

          if (results.affectedRows === 0) {
              return response.status(404).json({ error: "Usuario no encontrado" });
          }

          response.status(200).json({ message: "Rol actualizado correctamente" });
      }
  );
};

// actualizar el rol del usuario
app.route("/usuarios/:id/rol").put(updateUserRole);


module.exports = app;