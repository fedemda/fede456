import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";


// Cargar fuentes de Material Symbols y Google Fonts
const materialIconsLink = document.createElement("link");
materialIconsLink.href =
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined";
materialIconsLink.rel = "stylesheet";

const googleFontsLink = document.createElement("link");
googleFontsLink.href =
  "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;700&display=swap";
googleFontsLink.rel = "stylesheet";

// Agregar enlaces al documento
document.head.appendChild(materialIconsLink);
document.head.appendChild(googleFontsLink);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
