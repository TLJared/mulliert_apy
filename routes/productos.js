const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
const bcrypt = require('bcrypt');
app.use(express.json());

const {connection} = require('../config.db');
const { request, response } = require("./usuarios");
//---------------------------------------------
// Get all products

const getProducto = (request, response)=>{
    connection.query('SELECT * FROM productos',
        (error, results) =>{
            if (error) 
                throw error;
                response.status(200).json(results);
        }
    );
};
//ruta get productos
app.route("/productos").get(getProducto);

// Post a new product
const postProducto = async (request, response)=>{
    const {nombreProduct, precio, descripcion, stock, imagen, divisa} = request.body;
    try{
         connection.query(
            "SELECT * FROM usuarios WHERE nombreProducto = ?",
            [nombreProduct],
            (error, results)=>{
                if(error){
                    console.log("Error al verificar producto:", error);
                    return response.status(500).json({error: "Error en la consulta de producto"});
                }
                if(results.length > 0){
                    return response.status(400).json({error: "El producto ya está registrado"});
                }
                connection.query("INSERT INTO productos(nombreProduct, precio, descripcion, stock, imagen, divisa)VALUES(?,?,?,?,?,?)",
                    [nombreProduct, precio, descripcion, stock, imagen, divisa],
                    (insertError, insertResults)=>{
                        if (insertError) {
                            console.error("Error al insertar Usuario: insertError");
                                return response.status(500).json({error: 'Error al registrar producto'});
                        }
                        response.status(201).json({message: "Usuario Anadido"});
                    }
                );
            }
        );
    }catch (error){
        console.error("Error");
        response.status(500).json({ error: "Error 2"})
    }
}
//ruta para agregar usuario
app.route("/productos").post(postProducto);

//-------------Eliminar PRODUCTO
const delProductos = async (request, response)=>{
    const id = request.params.id;
        try{
            connection.query("DELETE FROM productos WHERE id = ?",
                [id],
                (error, results)=>{
                    if (error) 
                        throw error;
                        response.status(201).json({"Usuario Eliminado": results.affecte});
                }
            );

        }catch(error){
            console.error("Error: ", error);
            //response.status()
        }
};
app.route('/usuarios').delete(delProductos);

module.exports = app;