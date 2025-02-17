import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import "./NuevaMateria.css";

const NuevaMateria = () => {
  const [nombre, setNombre] = useState("");
  const [carrera, setCarrera] = useState(""); 
  const [carreras, setCarreras] = useState([]);
  const [anio, setAnio] = useState(""); 
  const [opcionesAnio, setOpcionesAnio] = useState([]); 

    // Mapeo para mostrar "1º", "2º", etc.
    const anioMap = {
      "1": "1º",
      "2": "2º",
      "3": "3º",
      "4": "4º",
      "5": "5º",
      "6": "6º",
    };

  useEffect(() => {
    const fetchCarreras = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/carreras", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          let data = await response.json();

          data.sort((a, b) => {
            return a.subcategoria.localeCompare(b.subcategoria); 
          });

          setCarreras(data);
        } else {
          console.error("Error al obtener las carreras");
        }
      } catch (error) {
        console.error("Error en la solicitud:", error);
      }
    };

    fetchCarreras();
  }, []);

  const handleCarreraChange = (e) => {
    const selectedCarrera = e.target.value;
    setCarrera(selectedCarrera);
    setAnio(""); // Resetear el año al cambiar la carrera
  
    // Convertir a minúsculas para evitar problemas de comparación
    if (selectedCarrera.toLowerCase().includes("tec.")) {
      setOpcionesAnio(["1", "2", "3"]);
    } else if (selectedCarrera.toLowerCase().includes("prof.")) {
      setOpcionesAnio(["1", "2", "3", "4"]);
    } else {
      setOpcionesAnio([]); // Si no se encuentra coincidencia, no mostrar opciones
    }
  };
  

  const handleNombreChange = (e) => {
    const value = e.target.value;
    if (/^[^0-9]*$/.test(value)) {
      setNombre(value);
    }
  };

  const handleGuardar = async () => {
    if (!nombre || !carrera || !anio) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Todos los campos son obligatorios.",
      });
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/materias", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ carrera, nombre_materia: nombre, anio }),
      });
  
      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Éxito",
          text: "Materia guardada correctamente.",
        });
        // Solo se reinicia el input de nombre
        setNombre("");
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Error al guardar la materia.",
        });
      }
    } catch (error) {
      console.error("Error al guardar la materia:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error al conectar con el servidor.",
      });
    }
  }; 

  return (
    <div className="nueva-materia-container">
      <h2>Nueva Materia</h2>

      <div className="form-group">
        <label className="label-seleccionar-carrera">Seleccionar carrera</label>
        <select
          value={carrera}
          onChange={handleCarreraChange}
          className="select-field"
        >
          <option value="">Seleccione una carrera</option>
          {carreras.map((c) => (
            <option key={c.id} value={c.subcategoria}>
              {c.subcategoria}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group-horizontal">
        <div className="form-group">
          <label className="label-anio">Año</label>
          <select
            value={anio}
            onChange={(e) => setAnio(e.target.value)}
            className="select-reducido"
            disabled={!carrera}  // Deshabilita si carrera no está seleccionada
          >
            <option value="">Seleccione un año</option>
            {opcionesAnio.length > 0 ? (
              opcionesAnio.map((opcion, index) => (
                <option key={index} value={opcion}>
                  {anioMap[opcion]} {/* Aquí aplicamos el mapeo */}
                </option>
              ))
            ) : (
              <option disabled>No hay opciones disponibles</option>
            )}
          </select>
        </div>

        <div className="form-group">
          <label className="label-nombre-materia">Nombre de la materia</label>
          <input
            type="text"
            className="input-reducido"
            value={nombre}
            placeholder="Ingrese el nombre"
            onChange={handleNombreChange}
          />
        </div>
      </div>

      <div className="form-buttons">
        <button className="btn-primary" onClick={handleGuardar}>
          Guardar
        </button>
      </div>
    </div>
  );
};

export default NuevaMateria;
