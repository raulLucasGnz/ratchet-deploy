const { Router } = require("express");
const router = Router();
require("dotenv").config(); //cargar variables desde archivo seguro

// Ruta para la página principal
router.get("/", (req, res) => {
  res.render("index"); // Renderiza la vista 'index.hbs'
});

// Ruta para la página 'pre' (preorder)
router.get("/pre", (req, res) => {
  res.render("pre"); // Renderiza la vista 'pre.hbs'
});

//Pedir Email en caso de no darlo el cliente
router.get("/request-email", (req, res) => {
  const { sessionId } = req.query; // Obtener el sessionId de los parámetros
  if (!sessionId) {
    return res.status(400).send("Falta el ID de la sesión.");
  }
  // Renderizar una página que muestre el formulario para introducir el correo
  res.render("requestEmail", { sessionId });
});

//Ruta de prueba
router.get("/test", (req, res) => {
  res.status(200).send("Ruta de prueba funcionando.");
});

module.exports = router;
