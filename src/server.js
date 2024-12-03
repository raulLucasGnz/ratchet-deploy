const express = require("express");
const { create } = require("express-handlebars");
const path = require("path");
require("dotenv").config(); // Cargar variables de entorno
const stripe = require("stripe")("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");

const app = express();

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

// Middleware para manejar solicitudes POST
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));

// Ruta para crear una sesión de Stripe Checkout
app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Prelisten KR Album",
              description: "Acceso anticipado al disco de Ratchet.",
            },
            unit_amount: 100, // Precio en céntimos (1 euro)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.origin}/success`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Error creando sesión de Stripe:", error);
    res.status(500).json({ error: "No se pudo crear la sesión de Stripe" });
  }
});

// Webhook de Stripe para manejar el correo del cliente
app.post(
  "/webhook-stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const endpointSecret = "whsec_1c8d485b48e15d3c04b1ecc3647ed7a310fd125e632efd67ef45294fa97d314c";

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        endpointSecret
      );

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        // Obtener correo proporcionado por el cliente en Stripe
        const email = session.customer_details.email;
        console.log("Correo del cliente:", email);  // Verifica si el correo es correcto

        if (!email) {
          console.error("No se pudo obtener el correo electrónico del cliente.");
          return res.status(400).send("No se pudo obtener el correo electrónico del cliente.");
        }

        // Enviar enlace al correo del cliente usando Mailjet
        const mailjet = require("node-mailjet").apiConnect(
          "d222394e196840b86bf3041a036052bb",
          "55a0f2a79d44b9f3e6dfdf5272e0c831"
        );

        const request = mailjet.post("send", { version: "v3.1" }).request({
          Messages: [
            {
              From: {
                Email: "ratchet@ratchet.digital",
                Name: "Ratchet KR-1",
              },
              To: [
                {
                  Email: email,
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

        try {
          const response = await request;
          console.log("Correo enviado correctamente:", response.body);
        } catch (error) {
          console.error("Error enviando correo con Mailjet:", error);
        }
      }

      res.status(200).send("Evento recibido");
    } catch (err) {
      console.error("⚠️  Error verificando el webhook:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

// Rutas principales
app.use("/", require("./routes/index"));

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).render("error");
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en el puerto ${PORT}`);
});
