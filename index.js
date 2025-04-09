const express = require("express");
const app = express();

//nos ayuda a analizar el cuerpo de la solicitud POST
app.use(express.json());
app.use(express.urlencoded({extended: true}));

//cargamos el archivo de rutas
app.use(require('./routes/usuarios'));
app.use(require('./routes/proovedores'));
app.use(require('./routes/productos'));
app.use(require('./routes/job'));
app.use(require('./routes/uso-materiales'));
app.listen(process.env.PORT||3300,() => {
    console.log("Servidor corriendo en el puerto 3300: http://localhost:3300");
});

module.exports = app;




// app.use("/uploads", express.static("uploads"));