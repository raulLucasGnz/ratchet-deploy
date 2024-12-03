const express = require("express");
const { create } = require("express-handlebars");
const path = require("path");
require("dotenv").config(); // Cargar variables de entorno

// Stripe
const stripe = require("stripe")(
  "pk_live_51QItw8Ai3Y284oZpmaoXUYRp67EMT9S6xHpxwDf9dd6rYWe1yI6JJ9DzjRBH63HgVYm17gh0nW9xjxuDAp6jdCAP00npXx1acf",
  {
    apiVersion: "2023-10-16",
  }
);

// Inicialización
const app = express();

// Middleware para procesar solicitudes POST y JSON
app.use(express.urlencoded({ extended: false }));

// Configuración de vistas
app.set("views", path.join(__dirname, "views"));
const hbs = create({
  defaultLayout: "main",
  layoutsDir: path.join(app.get("views"), "layouts"),
  partialsDir: path.join(app.get("views"), "partials"),
  extname: ".hbs",
});
app.engine(".hbs", hbs.engine);
app.set("view engine", ".hbs");

// Archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Middleware para Stripe Webhooks
app.post(
  "/webhook-stripe",
  express.raw({ type: "application/json" }), // Usar raw body
  async (req, res) => {
    const endpointSecret = process.env.WEBHOOK_SECRET_KEY;
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      // Verificar el webhook
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

      // Procesar el evento
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        // Asegurarse de que el correo electrónico del cliente esté presente
        if (!session.customer_email) {
          console.error(
            "Error: No se encontró el correo electrónico del cliente."
          );
          return res
            .status(400)
            .send("Error: No se encontró el correo electrónico del cliente.");
        }

        //DEBUG
        console.log("API Key:", process.env.MAILJET_API_KEY);
        console.log("API Secret:", process.env.MAILJET_API_SECRET);
        console.log("Sender Email:", process.env.MAILJET_SENDER_EMAIL);

        // Configuración de Mailjet
        const mailjet = require("node-mailjet").apiConnect(
          process.env.MAILJET_API_KEY,
          process.env.MAILJET_API_SECRET
        );

        const request = mailjet.post("send", { version: "v3.1" }).request({
          Messages: [
            {
              From: {
                Email: process.env.MAILJET_SENDER_EMAIL,
                Name: "Ratchet_Kr-1",
              },
              To: [
                {
                  Email: session.customer_email, // Correo del cliente desde Stripe
                  Name: "Cliente",
                },
              ],
              Subject: "¡Tu acceso al disco!",
              TextPart:
                "Gracias por tu compra. Aquí está tu enlace para escuchar el disco: https://untitled.stream/library/project/CCT1aA5If1mhBnuy7bS6A",
              HTMLPart:
                "<p>Gracias por tu compra.</p><p>Haz clic en este <a href='https://untitled.stream/library/project/CCT1aA5If1mhBnuy7bS6A'>enlace</a> para escuchar el disco.</p>",
            },
          ],
        });

        // Enviar correo
        try {
          const response = await request;
          console.log("Correo enviado correctamente:", response.body);
        } catch (error) {
          console.error("Error enviando correo con Mailjet:", error);
        }
      }

      // Responder al webhook
      res.status(200).send("Evento recibido");
    } catch (err) {
      console.error(`⚠️  Error verificando el webhook: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

// Rutas principales
app.use("/", require("./routes/index"));

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).render("error");
});

// Usar el puerto de producción o 3000 por defecto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en el puerto ${PORT}`);
});
