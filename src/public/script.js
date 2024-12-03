// // //Cick Comprar
// // const botonComprar = document.getElementById("comprar");
// // botonComprar.addEventListener("click", function () {
// //   window.location.href = "https://buy.stripe.com/8wMdUh5hJbyR3GE6oo"; // Redirige a la pasarela de pago
// // });

// //Validador mail
// document
//   .getElementById("emailForm")
//   .addEventListener("submit", async function (event) {
//     event.preventDefault();
//     const email = document.getElementById("email").value;

//     try {
//       const response = await fetch("/api/validate-email", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email }),
//       });

//       const result = await response.json();
//       if (result.valid) {
//         document.getElementById("emailForm").style.display = "none";
//         document.getElementById("textoPre").style.display = "block";
//         document.getElementById("purchaseForm").style.display = "block";
//       } else {
//         alert("Correo no válido. Por favor, inténtalo de nuevo.");
//       }
//     } catch (error) {
//       console.error("Error al validar el correo:", error);
//       alert(
//         "Hubo un problema al validar el correo. Por favor, inténtalo más tarde."
//       );
//     }
//   });
