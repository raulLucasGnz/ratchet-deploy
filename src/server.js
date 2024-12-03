const express = require("express");
const { create } = require("express-handlebars");
const path = require("path");
require("dotenv").config(); // Cargar variables de entorno
const axios = require("axios");
const morgan = require("morgan");
const session = require('express-session');

// Inicialización
const app = express();

// Middleware para procesar solicitudes POST y JSON
app.use(express.urlencoded({ extended: false }));
app.use(express.json()); // Este middleware es necesario para parsear JSON en las solicitudes.

// Configurar el middleware de sesión
app.use(
  session({
    secret: 'mi_secreto', // Cambia esto por un valor seguro
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Cambia a true si usas HTTPS
  })
);

// Usa Morgan para loggear las solicitudes HTTP
app.use(morgan("dev"));

// Stripe
const stripe = require("stripe")(
  "pk_live_51QItw8Ai3Y284oZpmaoXUYRp67EMT9S6xHpxwDf9dd6rYWe1yI6JJ9DzjRBH63HgVYm17gh0nW9xjxuDAp6jdCAP00npXx1acf",
  {
    apiVersion: "2023-10-16",
  }
);

// Hunter Mail API KEY
const HUNTER_API_KEY = "29dae7feadf6f08c72645a994c125d074673b61a";

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

// Verificación del correo
async function validateEmailWithHunter(email) {
  try {
    const response = await axios.get(
      `https://api.hunter.io/v2/email-verifier`,
      {
        params: {
          email: email,
          api_key: HUNTER_API_KEY,
        },
      }
    );

    console.log("Respuesta de Hunter:", response.data); // Imprime toda la respuesta

    // Verifica si la respuesta tiene la estructura esperada
    if (response.data && response.data.data) {
      const { status, result } = response.data.data;

      // Verifica el estado de la respuesta
      if (status === "valid") {
        return { valid: true, result: "deliverable" };
      } else if (status === "invalid" || result === "undeliverable") {
        return { valid: false, result: "undeliverable" };
      } else if (status === "accept_all") {
        return { valid: true, result: "accept_all" };
      } else if (status === "disposable") {
        return { valid: false, result: "disposable" };
      } else {
        return { valid: false, result: "unknown" };
      }
    } else {
      return { valid: false, error: "Respuesta no válida de la API" };
    }
  } catch (err) {
    console.error("Error al contactar con la API de Hunter:", err);
    return {
      valid: false,
      error: "Error al contactar con el servicio de verificación",
    };
  }
}

app.post("/api/validate-email", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      valid: false,
      error: "Correo no proporcionado",
    });
  }

  try {
    const validationResponse = await validateEmailWithHunter(email);

    // Si el correo es válido, guardarlo en la sesión
    if (validationResponse.valid) {
      req.session.email = email;  // Almacena el correo en la sesión
    }

    return res.status(200).json({
      valid: validationResponse.valid,
      result: validationResponse.result || "unknown",
      error: validationResponse.error || null,
    });
  } catch (err) {
    console.error("Error al validar el correo:", err);
    return res.status(500).json({
      valid: false,
      error: "Error al contactar con el servicio de verificación",
    });
  }
});

// Middleware para Stripe Webhooks
// Middleware para Stripe Webhooks
app.post(
  "/webhook-stripe",
  express.raw({ type: "application/json" }), // Asegúrate de que el cuerpo sea crudo (raw)
  async (req, res) => {
    const endpointSecret = process.env.WEBHOOK_SECRET_KEY;
    const sig = req.headers["stripe-signature"];

    let event;
    try {
      // El cuerpo de la solicitud debe ser un Buffer crudo, así que pasamos req.body directamente
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;

        // Obtener el correo verificado desde la sesión
        const verifiedEmail = req.session.email;
        const email = verifiedEmail || session.customer_email || session.customer_details.email;

        // Si no se encuentra un correo, redirigir para solicitarlo
        if (!email) {
          console.error("Error: No se encontró el correo electrónico.");
          return res
            .status(303)
            .set("Location", `/request-email?sessionId=${session.id}`)
            .send("Redirigiendo para solicitar correo electrónico.");
        }

        // Enviar correo al cliente con el enlace al disco
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
