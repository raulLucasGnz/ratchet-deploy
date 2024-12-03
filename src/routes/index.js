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

//Ruta de prueba
router.get("/test", (req, res) => {
  res.status(200).send("Ruta de prueba funcionando.");
});

router.get("/success", (req, res) => {
  res.render("success");
});

router.get("/cancel", (req, res) => {
  res.render("cancel");
});

module.exports = router;
