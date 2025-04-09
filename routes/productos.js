const express = require("express");
const app = express();
const dotenv = require("dotenv");
dotenv.config();
app.use(express.json());
//conexión con la base de datos
const {connection} = require("../config.db");

const getProducts = (request, response) => {
    connection.query("SELECT * FROM productos", 
    (error, results) => {
        if(error)
            throw error;
        response.status(200).json(results);
    });
};
//ruta
app.route("/productos")
.get(getProducts);

const searchProducts = (request, response) => {
    const search = request.query.search; // Obtener el parámetro de búsqueda
    let sql = "SELECT * FROM productos";

    if (search) {
        sql += " WHERE nombre LIKE ?";
    }

    connection.query(sql, search ? [`%${search}%`] : [], (error, results) => {
        if (error) {
            throw error;
        }
        response.status(200).json(results);
    });
};

// Ruta
app.route("/productos")
   .get(searchProducts);

// POST Producto (sin imagen)
const postProducts = async (request, response) => {
    const { nombre, descripcion, precio, moneda, cantidad } = request.body;

    if (!moneda || !["MXN", "USD"].includes(moneda)) {
        return response.status(400).json({ error: "Moneda inválido" });
    }

    try {
        connection.query(
            "SELECT * FROM productos WHERE nombre = ?",
            [nombre],
            (error, results) => {
                if (error) {
                    console.error("Error al verificar producto:", error);
                    return response.status(500).json({ error: "Error en la consulta de productos" });
                }

                if (results.length > 0) {
                    return response.status(400).json({ error: "El producto ya está registrado anteriormente" });
                }

                // Insertar usuario si no existe
                connection.query(
                    "INSERT INTO productos(nombre, descripcion, precio, moneda, cantidad) VALUES (?,?,?,?,?)",
                    [nombre, descripcion, precio, moneda, cantidad],
                    (insertError, insertResults) => {
                        if (insertError) {
                            console.error("Error al insertar producto:", insertError);
                            return response.status(500).json({ error: "Error al registrar producto" });
                        }
                        response.status(201).json({ message: "Producto añadido correctamente" });
                    }
                );
            }
        );
    } catch (error) {
        console.error("Error:", error);
        response.status(500).json({ error: "Error de servidor" });
    }
};
//ruta
app.route("/productos")
.post(postProducts);



const delProduct = (request, response) => {
    const id = request.params.id;
    connection.query("Delete from productos where id = ?", 
    [id],
    (error, results) => {
        if(error)
            throw error;
        response.status(201).json({"Producto eliminado":results.affectedRows});
    });
};

//ruta
app.route("/productos/:id")
.delete(delProduct);


//---------------------- PUT Producto (Actualizar sin imagen) ----------------------
const putProducto = (request, response) => {
    const id = request.params.id;
    const { nombre, descripcion, precio, moneda, cantidad } = request.body;

    if (!moneda || !["MXN", "USD"].includes(moneda)) {
        return response.status(400).json({ error: "Moneda inválido" });
    }

    connection.query("SELECT * FROM productos WHERE id = ?", [id], (error, results) => {
        if (error) {
            console.error("Error al buscar producto:", error);
            return response.status(500).json({ error: "Error en la consulta de producto" });
        }
        if (results.length === 0) {
            return response.status(404).json({ error: "Producto no encontrado" });
        }

        const producto = results[0];
        connection.query(
            "UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, moneda = ?, cantidad = ? WHERE id = ?",
            [nombre, descripcion, precio, moneda, cantidad,id],
            (error) => {
                if (error) {
                    console.error("Error al actualizar producto:", error);
                    return response.status(500).json({ error: "Error al actualizar producto" });
                }
                response.status(200).json({ message: "Producto actualizado correctamente" });
            }
        );
    });
};

app.route("/productos/:id").put(putProducto);


module.exports = app;

// 🚀 Cómo probar en Postman
// 1️⃣ Subir un producto (POST)
// Método: POST
// URL: http://localhost:3000/productos
// Body: form-data
// nombreProduct: "Laptop Dell"
// precio: "1200"
// descripcion: "Laptop de alta gama"
// stock: "10"
// divisa: "USD"
// imagen: (Selecciona una imagen de tu PC)
// 2️⃣ Ver productos (GET)
// Método: GET
// URL: http://localhost:3000/productos
// 3️⃣ Actualizar producto (PUT)
// Método: PUT
// URL: http://localhost:3000/productos/{id}
// Body: form-data
// Modifica algún campo, como precio, y sube una nueva imagen.
// 4️⃣ Eliminar un producto (DELETE)
// Método: DELETE
// URL: http://localhost:3000/productos/{id} 

//module.exports = app;