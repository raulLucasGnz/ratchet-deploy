const db = require("../connDatabase"); // Archivo con la conexión a la base de datos

// Obtener todos los productos
const getMerchandise = (req, res) => {
  const query = "SELECT * FROM merchandise";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error al obtener productos:", err);
      return res
        .status(500)
        .json({ message: "Error al obtener productos", error: err });
    }
    res.status(200).json(results); // Envía los resultados como JSON
  });
};

// Agregar un nuevo producto
const createMerchandise = (req, res) => {
  const { name, description, price, image_url } = req.body;
  const query =
    "INSERT INTO merchandise (name, description, price, image_url) VALUES (?, ?, ?, ?)";
  db.query(query, [name, description, price, image_url], (err, results) => {
    if (err) {
      console.error("Error al agregar producto:", err);
      return res
        .status(500)
        .json({ message: "Error al agregar producto", error: err });
    }
    res.status(201).json({ message: "Producto creado", product: req.body });
  });
};

// Actualizar un producto
const updateMerchandise = (req, res) => {
  const { id } = req.params;
  const { name, description, price, image_url } = req.body;
  const query =
    "UPDATE merchandise SET name = ?, description = ?, price = ?, stock = ?, image_url = ? WHERE id = ?";
  db.query(
    query,
    [name, description, price, stock, image_url, id],
    (err, results) => {
      if (err) return res.status(500).send(err);
      res.send("Producto actualizado");
    }
  );
};

// Eliminar un producto
const deleteMerchandise = (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM merchandise WHERE id = ?";
  db.query(query, [id], (err, results) => {
    if (err) return res.status(500).send(err);
    res.send("Producto eliminado");
  });
};

module.exports = {
  getMerchandise,
  createMerchandise,
  updateMerchandise,
  deleteMerchandise,
};
