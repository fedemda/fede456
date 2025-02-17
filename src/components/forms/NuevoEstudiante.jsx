import React, { useState, useEffect } from "react";
import "./NuevoEstudiante.css"; // Estilos para el formulario
import axios from "axios";
import Swal from "sweetalert2"; // Importar SweetAlert

const NuevoEstudiante = () => {
  const [carreras, setCarreras] = useState([]); // Estado para almacenar las carreras
  const [selectedCarrera, setSelectedCarrera] = useState("");
  const [apellidoYNombre, setApellidoYNombre] = useState("");
  const [dni, setDni] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");

  // Obtener las carreras al cargar el componente
  useEffect(() => {
    const fetchCarreras = async () => {
      try {
        const response = await axios.get("http://localhost:5000/carreras", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        // Separar y ordenar las carreras
        const tecnicas = response.data.filter(c => c.subcategoria.includes('Tec.')).sort((a, b) => {
          const numA = parseInt(a.subcategoria.match(/\d+/));
          const numB = parseInt(b.subcategoria.match(/\d+/));
          return numA - numB;
        });

        const otras = response.data.filter(c => !c.subcategoria.includes('Tec.')).sort((a, b) => 
          a.subcategoria.localeCompare(b.subcategoria, "es", { sensitivity: "base" })
        );

        setCarreras([...tecnicas, ...otras]); // Guardar las carreras ordenadas en el estado
      } catch (error) {
        console.error("Error al obtener las carreras:", error);
      }
    };

    fetchCarreras();
  }, []);

  const capitalizeWords = (text) => {
    return text
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleGuardar = async () => {
    if (!selectedCarrera || !apellidoYNombre || !dni || !fechaNacimiento || !email) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Todos los campos son obligatorios",
      });
      return;
    }

    if (dni.length !== 8) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ingrese un DNI válido.",
      });
      return;
    }

    const fecha = new Date(fechaNacimiento);
    const minFecha = new Date("1955-01-01");
    const maxFecha = new Date("2008-12-31");

    if (fecha < minFecha || fecha > maxFecha) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ingrese una fecha válida.",
      });
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{3,}$/;
    if (!emailRegex.test(email)) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Ingrese un email válido.",
      });
      return;
    }

    const formattedNombre = capitalizeWords(apellidoYNombre);

    const nuevoEstudiante = {
      carrera: selectedCarrera,
      apellido_y_nombre: formattedNombre,
      dni,
      fecha_de_nacimiento: fechaNacimiento,
      telefono,
      email,
    };

    try {
      const response = await axios.post(
        "http://localhost:5000/estudiantes",
        nuevoEstudiante,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.status === 201) {
        Swal.fire({
          icon: "success",
          title: "¡Éxito!",
          text: "Estudiante guardado exitosamente.",
        });

        // Limpiar solo los campos específicos, no el selectedCarrera
        setApellidoYNombre("");
        setDni("");
        setFechaNacimiento("");
        setTelefono("");
        setEmail("");
      }
    } catch (error) {
      console.error("Error recibido:", error.response);
      if (
        error.response &&
        error.response.data.message === "Error: DNI duplicado en la base de datos"
      ) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "DNI duplicado. El estudiante ya está registrado en la base de datos.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Ocurrió un error al guardar el estudiante.",
        });
      }
    }    
  };

  const handleDniInput = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, ""); // Eliminar caracteres no numéricos
    setDni(value.slice(0, 8)); // Limitar a 8 caracteres
  };

  const handleTelefonoInput = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, ""); // Eliminar caracteres no numéricos
    setTelefono(value);
  };

  const handleNombreInput = (e) => {
    const value = e.target.value.replace(/[^a-zA-ZÁÉÍÓÚáéíóúÑñ\s]/g, ""); // Eliminar números y caracteres especiales
    setApellidoYNombre(value);
  };

  return (
    <div className="nuevo-estudiante-container">
      <h2>Nuevo Estudiante</h2>

      {/* Seleccionar Carrera */}
      <div className="form-group">
        <label htmlFor="carrera">Seleccionar Carrera:</label>
        <select
          id="carrera"
          name="carrera"
          className="select-small"
          value={selectedCarrera}
          onChange={(e) => setSelectedCarrera(e.target.value)}
        >
          <option value="">Seleccione una carrera</option>
          {carreras.map((carrera) => (
            <option key={carrera.id} value={carrera.subcategoria}>
              {carrera.subcategoria}
            </option>
          ))}
        </select>
      </div>

      {/* Apellido y Nombre */}
      <div className="form-group input-medium">
        <label htmlFor="nombre">Apellido y Nombre:</label>
        <input
          type="text"
          id="nombre"
          placeholder="Ingrese el nombre completo"
          value={apellidoYNombre}
          onChange={handleNombreInput}
        />
      </div>

      {/* DNI y Fecha de Nacimiento */}
      <div className="form-row">
        <div className="form-group input-small">
          <label htmlFor="dni">DNI:</label>
          <input
            type="text"
            id="dni"
            placeholder="Sin puntos"
            value={dni}
            onChange={handleDniInput}
            maxLength="8"
          />
        </div>
        <div className="form-group input-small">
          <label htmlFor="fechaNacimiento">Fecha de Nacimiento:</label>
          <input
            type="date"
            id="fechaNacimiento"
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
            min="1955-01-01" // Fecha mínima
            max="2008-12-31" // Fecha máxima
          />
        </div>
      </div>

      {/* Teléfono y Email */}
      <div className="form-row">
        <div className="form-group input-small">
          <label htmlFor="telefono">Teléfono:</label>
          <input
            type="text"
            id="telefono"
            placeholder="Ingrese el teléfono"
            value={telefono}
            onChange={handleTelefonoInput}
          />
        </div>
        <div className="form-group input-small">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            placeholder="Ingrese el email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      {/* Botón Guardar */}
      <div className="form-buttons">
        <button className="btn-primary" onClick={handleGuardar}>
          Guardar
        </button>
      </div>
    </div>
  );
};

export default NuevoEstudiante;