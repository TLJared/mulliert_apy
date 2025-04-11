const express = require("express");
const app = express();
const dotenv = require("dotenv");
const multer = require("multer"); 
const path = require("path");
const fs = require("fs");

dotenv.config();
app.use(express.json());


const { connection } = require("../config.db");

// almacenamiento de imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, "../public/uploads");
        // Crear el directorio si no existe
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// aceptar solo imágenes
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('El archivo debe ser una imagen'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // Límite de 5MB
    }
});

// Servir archivos estáticos para acceder a las imágenes
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

const getProducts = (request, response) => {
    connection.query("SELECT * FROM productos", 
    (error, results) => {
        if(error)
            throw error;
        response.status(200).json(results);
    });
};

// Ruta
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

// Ruta de búsqueda
app.route("/productos/search")
   .get(searchProducts);

// POST Producto con todo y imagen
const postProducts = async (request, response) => {
    const { nombre, descripcion, precio, moneda, cantidad } = request.body;
    let imagenPath = null;

    if (request.file) {
        // Generamos la ruta relativa para guardar en la BD
        imagenPath = `/uploads/${request.file.filename}`;
    }

    if (!moneda || !["MXN", "USD"].includes(moneda)) {
        return response.status(400).json({ error: "Moneda inválida" });
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

                // Insertar producto incluyendo imagen si existe
                connection.query(
                    "INSERT INTO productos(nombre, descripcion, precio, moneda, cantidad, imagen) VALUES (?,?,?,?,?,?)",
                    [nombre, descripcion, precio, moneda, cantidad, imagenPath],
                    (insertError, insertResults) => {
                        if (insertError) {
                            console.error("Error al insertar producto:", insertError);
                            return response.status(500).json({ error: "Error al registrar producto" });
                        }
                        response.status(201).json({ 
                            message: "Producto añadido correctamente",
                            producto: {
                                id: insertResults.insertId,
                                nombre,
                                descripcion,
                                precio,
                                moneda,
                                cantidad,
                                imagen: imagenPath
                            }
                        });
                    }
                );
            }
        );
    } catch (error) {
        console.error("Error:", error);
        response.status(500).json({ error: "Error de servidor" });
    }
};

// Ruta para añadir producto con imagen
app.route("/productos")
   .post(upload.single('imagen'), postProducts);

// Ruta para subir/actualizar solo la imagen de un producto existente
const uploadProductImage = (request, response) => {
    const id = request.params.id;
    
    if (!request.file) {
        return response.status(400).json({ error: "No se proporcionó ninguna imagen" });
    }
    
    const imagenPath = `/uploads/${request.file.filename}`;
    
    connection.query("SELECT * FROM productos WHERE id = ?", 
    [id],
    (error, results) => {
        if (error) {
            console.error("Error al buscar producto:", error);
            return response.status(500).json({ error: "Error en la consulta de producto" });
        }
        
        if (results.length === 0) {
            return response.status(404).json({ error: "Producto no encontrado" });
        }
        
        // Si existe una imagen anterior, se borra
        const productoActual = results[0];
        if (productoActual.imagen) {
            const oldImagePath = path.join(__dirname, '../public', productoActual.imagen);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }
        
        // Actualizar la ruta de la imagen en la BD
        connection.query(
            "UPDATE productos SET imagen = ? WHERE id = ?",
            [imagenPath, id],
            (updateError) => {
                if (updateError) {
                    console.error("Error al actualizar imagen:", updateError);
                    return response.status(500).json({ error: "Error al actualizar la imagen del producto" });
                }
                response.status(200).json({ 
                    message: "Imagen actualizada correctamente",
                    imagen: imagenPath
                });
            }
        );
    });
};

app.route("/productos/:id/imagen")
   .post(upload.single('imagen'), uploadProductImage);

const delProduct = (request, response) => {
    const id = request.params.id;
    
    // Primero obtenemos el producto para saber si tiene imagen que borrar
    connection.query("SELECT imagen FROM productos WHERE id = ?", 
    [id],
    (error, results) => {
        if (error) {
            console.error("Error al buscar producto:", error);
            return response.status(500).json({ error: "Error en la consulta de producto" });
        }
        
        if (results.length > 0 && results[0].imagen) {
            // Borrar la imagen asociada si existe
            const imagePath = path.join(__dirname, '../public', results[0].imagen);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        // borramos el registro de la BD
        connection.query("DELETE FROM productos WHERE id = ?", 
        [id],
        (delError, delResults) => {
            if (delError) {
                console.error("Error al eliminar producto:", delError);
                return response.status(500).json({ error: "Error al eliminar producto" });
            }
            response.status(200).json({
                message: "Producto eliminado",
                eliminados: delResults.affectedRows
            });
        });
    });
};

// Ruta
app.route("/productos/:id")
.delete(delProduct);

// PUT Producto Actualizar con imagen JEJE
const putProducto = (request, response) => {
    const id = request.params.id;
    const { nombre, descripcion, precio, moneda, cantidad } = request.body;
    let imagenPath = null;
    
    if (request.file) {
        //ruta  para guardar en la BD
        imagenPath = `/uploads/${request.file.filename}`;
    }

    if (!moneda || !["MXN", "USD"].includes(moneda)) {
        return response.status(400).json({ error: "Moneda inválida" });
    }

    connection.query("SELECT * FROM productos WHERE id = ?", 
    [id], 
    (error, results) => {
        if (error) {
            console.error("Error al buscar producto:", error);
            return response.status(500).json({ error: "Error en la consulta de producto" });
        }
        
        if (results.length === 0) {
            return response.status(404).json({ error: "Producto no encontrado" });
        }

        const productoActual = results[0];
        
        // Si se está subiendo una nueva imagen y ya existe una anterior, borrar la anterior
        if (imagenPath && productoActual.imagen) {
            const oldImagePath = path.join(__dirname, '../public', productoActual.imagen);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
            }
        }
        
        // Si no hay nueva imagen, mantenemos la existente
        if (!imagenPath) {
            imagenPath = productoActual.imagen;
        }

        connection.query(
            "UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, moneda = ?, cantidad = ?, imagen = ? WHERE id = ?",
            [nombre, descripcion, precio, moneda, cantidad, imagenPath, id],
            (updateError) => {
                if (updateError) {
                    console.error("Error al actualizar producto:", updateError);
                    return response.status(500).json({ error: "Error al actualizar producto" });
                }
                response.status(200).json({ 
                    message: "Producto actualizado correctamente",
                    producto: {
                        id,
                        nombre,
                        descripcion,
                        precio,
                        moneda, 
                        cantidad,
                        imagen: imagenPath
                    }
                });
            }
        );
    });
};

app.route("/productos/:id")
   .put(upload.single('imagen'), putProducto);

module.exports = app;