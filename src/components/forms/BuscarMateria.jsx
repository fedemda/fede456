import React, { useState, useEffect } from "react";
import {
  ModalOverlay,
  ModalContent,
  ModalTitle,
  ModalInput,
  ModalButtons,
  ModalButton,
  ModalLabel
} from "./ModalStyles"; // Ajusta la ruta de importación según corresponda
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import "./BuscarMateria.css";

const MySwal = withReactContent(Swal);

const BuscarMateria = () => {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const [userRole, setUserRole] = useState(localStorage.getItem("userRole")); // Rol del usuario
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Ítems por página

  useEffect(() => {
    const buscarDatos = async () => {
      if (busqueda.trim() !== "") {
        try {
          const response = await fetch(
            `http://localhost:5000/materias?busqueda=${busqueda}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          const data = await response.json();

          // Ordena primero por año (extraído de carrera) y luego por nombre de materia
          const resultadosOrdenados = data.sort((a, b) => {
            const añoA = parseInt(a.carrera.match(/\d+/)) || 0;
            const añoB = parseInt(b.carrera.match(/\d+/)) || 0;
            if (añoA === añoB) {
              return a.nombre_materia.localeCompare(b.nombre_materia);
            }
            return añoA - añoB;
          });

          setResultados(resultadosOrdenados);
        } catch (error) {
          console.error("Error al buscar datos:", error);
        }
      } else {
        setResultados([]);
      }
    };

    buscarDatos();
  }, [busqueda]);

  const abrirModal = (fila) => {
    setFilaSeleccionada({ ...fila });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setFilaSeleccionada(null);
  };

  const guardarCambios = async () => {
    console.log("Ejecutando guardarCambios:", filaSeleccionada);

    if (!filaSeleccionada.nombre_materia || filaSeleccionada.nombre_materia.trim().length < 1) {
      MySwal.fire({
        title: "Error",
        text: "Todos los campos son obligatorios.",
        icon: "error",
        position: "center",
        allowOutsideClick: false,
        backdrop: true
      });
      return;
    }

    // Función para capitalizar el texto
    const capitalize = (text) => {
      const preposiciones = ["y", "o", "en", "de", "a", "con", "para"];
      return text
        .split(" ")
        .map(word =>
          preposiciones.includes(word.toLowerCase())
            ? word.toLowerCase()
            : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join(" ");
    };

    const carreraFormateada = capitalize(filaSeleccionada.carrera);
    const nombreMateriaFormateada = capitalize(filaSeleccionada.nombre_materia);

    try {
      const response = await fetch(
        `http://localhost:5000/materias/${filaSeleccionada.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            carrera: carreraFormateada,
            nombre_materia: nombreMateriaFormateada,
            anio: filaSeleccionada.anio // Enviamos el campo anio también
          }),
        }
      );

      if (response.ok) {
        const actualizados = resultados.map((item) =>
          item.id === filaSeleccionada.id
            ? { ...filaSeleccionada, carrera: carreraFormateada, nombre_materia: nombreMateriaFormateada }
            : item
        );
        setResultados(actualizados);
        cerrarModal();
        MySwal.fire({
          title: "Éxito",
          text: "Datos actualizados correctamente.",
          icon: "success",
        });
      } else {
        MySwal.fire({
          title: "Error",
          text: "Error al actualizar el registro.",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Error en PUT:", error);
      MySwal.fire({
        title: "Error",
        text: "Error al guardar los cambios.",
        icon: "error",
      });
    }
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    if (name === "nombre_materia") {
      if (/^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]*$/.test(value)) {
        setFilaSeleccionada({ ...filaSeleccionada, [name]: value });
      }
    }
  };

  const eliminarRegistro = async (id) => {
    MySwal.fire({
      title: "¿Estás seguro?",
      text: "No podrás revertir esto",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "No, cancelar"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`http://localhost:5000/materias/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });

          if (response.ok) {
            setResultados(resultados.filter((item) => item.id !== id));
          } else {
            MySwal.fire({
              title: "Error",
              text: "Error al eliminar el registro.",
              icon: "error",
            });
          }
        } catch (error) {
          MySwal.fire({
            title: "Error",
            text: "Error al eliminar el registro.",
            icon: "error",
          });
        }
      }
    });
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentResults = resultados.slice(startIndex, endIndex);

  return (
    <div className="buscar-materia-main-container">
      <div className="buscar-materia-container">
        <h2>Buscar Materia</h2>
        <input
          type="text"
          placeholder="Buscar materia"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {resultados.length > 0 && (
        <div className="resultados-container">
          <table className="resultados-busqueda">
            <thead>
              <tr>
                <th>Materia</th>
                <th>Año</th>
                <th>Carrera</th>
                {userRole !== "2" && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {currentResults.map((fila) => (
                <tr key={fila.id}>
                  <td>{fila.nombre_materia}</td>
                  <td>{fila.anio}</td>
                  <td>{fila.carrera}</td>
                  {userRole !== "2" && (
                    <td>
                      <button onClick={() => abrirModal(fila)}>✏️</button>
                      <button onClick={() => eliminarRegistro(fila.id)}>❌</button>
                    </td>
                  )}
                </tr>
              ))}
              <tr>
                <td colSpan={userRole !== "2" ? 4 : 3} className="pagination-row">
                  <div className="pagination-container">
                    {Array.from({ length: Math.ceil(resultados.length / itemsPerPage) }, (_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPage(index + 1)}
                        className={`pagination-btn ${currentPage === index + 1 ? "active" : ""}`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && filaSeleccionada && (
        <ModalOverlay onClick={cerrarModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Editar Registro</ModalTitle>
            <ModalLabel>Carrera:</ModalLabel>
            <ModalInput
              type="text"
              name="carrera"
              value={filaSeleccionada.carrera}
              readOnly
            />
            <ModalLabel>Materia:</ModalLabel>
            <ModalInput
              type="text"
              name="nombre_materia"
              value={filaSeleccionada.nombre_materia}
              onChange={manejarCambio}
              required
            />
            <ModalButtons>
              <ModalButton type="button" onClick={guardarCambios}>
                Guardar
              </ModalButton>
              <ModalButton type="button" onClick={cerrarModal}>
                Cancelar
              </ModalButton>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      )}
    </div>
  );
};

export default BuscarMateria;
