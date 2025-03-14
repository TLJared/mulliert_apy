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
    const { nombre, apellido, nombreUsuario, email, contrasena } = request.body;

    try {
        // Encriptar la contraseña
        const saltRounds = 10;  // Número de rondas para el salt (puedes ajustarlo)
        const contrasenaEncriptada = await bcrypt.hash(contrasena, saltRounds);  // Encriptamos la contraseña

        // Insertar los datos en la base de datos
        connection.query(
            "INSERT INTO usuarios(nombre, apellido, nombreUsuario, email, contrasena) VALUES (?,?,?,?,?)", 
            [nombre, apellido, nombreUsuario, email, contrasenaEncriptada],
            (error, results) => {
                if (error) throw error;
                response.status(201).json({ "Usuario añadido correctamente": results.affectedRows });
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

//---------------------------------------------LOGIN DE USUARIOS-------------------------------------------
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
          console.log("Contraseña ingresada:", contrasena);
          console.log("Contraseña en BD:", usuario.contrasena);
      
          const passwordMatch = await bcrypt.compare(contrasena, usuario.contrasena);
      
          if (!passwordMatch) {
            console.log("Las contraseñas no coinciden.");
            return response.status(400).json({ error: "Contraseña incorrecta" });
          }
      
          response.status(200).json({ message: "Login exitoso", usuario });
        }
      );
    } catch (error) {
      console.error("Error al verificar el usuario:", error);
      response.status(500).json({ error: "Error al verificar el usuario" });
    }
  };
  



  // Ruta para login
  app.route("/login").post(loginUsuario);
module.exports = app;