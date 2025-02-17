import React from "react";
import axios from "axios";

const AnaliticoButton = ({ dni, apNombre, carrera, resolucion }) => {
  const handleDescargarAnalitico = async () => {
    try {
      const plantilla = carrera && carrera.toLowerCase().includes("prof")
        ? "Analitico_Profesorado.xlsx"  // Para Profesorado
        : "Analitico_Tecnicatura.xlsx"; // Para Tecnicatura

      const response = await axios.get("http://localhost:5000/generar-analitico", {
        params: { dni, apNombre, archivo: plantilla, resolucion, carrera },
        responseType: "blob", // Para manejar la respuesta como archivo
      });

      // Extraer el nombre del archivo desde la cabecera Content-Disposition
      const disposition = response.headers["content-disposition"];
      let fileName = "";
      if (disposition) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          fileName = matches[1].replace(/['"]/g, "");
        }
      }
      // Si no se obtuvo el nombre, se crea uno usando el formato deseado
      if (!fileName) {
        const apNombreSafe = apNombre.trim();
        const carreraSafe = carrera.trim();
        fileName = `Analitico Parcial_${apNombreSafe}_${carreraSafe}.xlsx`;
      }

      // Crear URL del Blob y simular clic para descargar
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error al descargar el analítico:", error);
    }
  };

  return <button onClick={handleDescargarAnalitico}>Analítico Parcial</button>;
};

export default AnaliticoButton;
