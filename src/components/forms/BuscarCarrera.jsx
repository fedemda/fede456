import React, { useState, useEffect } from "react";
import {
  ModalOverlay,
  ModalContent,
  ModalTitle,
  ModalInput,
  ModalButtons,
  ModalButton,
  ModalLabel
} from "./ModalStyles"; // Adjust the import path as necessary
import "./BuscarCarrera.css";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

// Configurar SweetAlert2 para React
const MySwal = withReactContent(Swal);

const BuscarCarrera = () => {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const [userRole, setUserRole] = useState(localStorage.getItem("userRole")); 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const buscarDatos = async () => {
      if (busqueda.trim() !== "") {
        try {
          const response = await fetch(
            `http://localhost:5000/carreras?busqueda=${busqueda}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          const data = await response.json();
          setResultados(data);
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

  const handleResolucionChange = (value) => /^[0-9/]*$/.test(value);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    if (value.trim() !== "") {
      setFilaSeleccionada({ ...filaSeleccionada, [name]: value });
    }
  };

  const validarCampos = () => {
    const { subcategoria, resolucion, cohorte, duracion, carga_horaria } = filaSeleccionada;

    if (!subcategoria || !resolucion || !cohorte || !duracion || !carga_horaria) {
      MySwal.fire({
        title: "Error",
        text: "Todos los campos son obligatorios.",
        icon: "error",
      });
      return false;
    }

    if (duracion <= 0 || carga_horaria <= 0) {
      MySwal.fire({
        title: "Error",
        text: "La duración y la carga horaria deben ser valores positivos.",
        icon: "error",
      });
      return false;
    }

    if (!handleResolucionChange(resolucion)) {
      MySwal.fire({
        title: "Error",
        text: "Resolución inválida. Solo se permiten números y barras (/).",
        icon: "error",
      });
      return false;
    }

    return true;
  };

  const guardarCambios = async () => {
    if (!filaSeleccionada || !filaSeleccionada.id) {
      MySwal.fire({
        title: "Error",
        text: "Error: El ID del registro no está definido.",
        icon: "error",
      });
      return;
    }

    if (!validarCampos()) {
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/carreras/${filaSeleccionada.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            subcategoria: filaSeleccionada.subcategoria,
            resolucion: filaSeleccionada.resolucion,
            cohorte: filaSeleccionada.cohorte,
            duracion: filaSeleccionada.duracion,
            carga_horaria: filaSeleccionada.carga_horaria,
          }),
        }
      );

      if (response.ok) {
        const actualizados = resultados.map((item) =>
          item.id === filaSeleccionada.id ? filaSeleccionada : item
        );
        setResultados(actualizados);
        cerrarModal();
        MySwal.fire({
          title: "Éxito",
          text: "Datos actualizados correctamente.",
          icon: "success",
        });
      } else {
        const errorText = await response.text();
        MySwal.fire({
          title: "Error",
          text: `Error al guardar los cambios: ${errorText}`,
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Error al guardar cambios:", error);
      MySwal.fire({
        title: "Error",
        text: "Error al guardar los cambios.",
        icon: "error",
      });
    }
  };

  const eliminarRegistro = async (id) => {
    MySwal.fire({
      title: "¿Estás seguro?",
      text: "No podrás revertir esto",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "No, cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`http://localhost:5000/carreras/${id}`, {
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
              text: "Error al eliminar registro.",
              icon: "error",
            });
          }
        } catch (error) {
          console.error("Error al eliminar registro:", error);
          MySwal.fire({
            title: "Error",
            text: "Error al eliminar registro.",
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
    <div className="buscar-carrera-main-container">
      <div className="buscar-carrera-container">
        <h2>Buscar Carrera</h2>
        <input
          type="text"
          placeholder="Buscar carrera"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {resultados.length > 0 && (
        <div className="resultados-container">
          <table className="resultados-busqueda">
            <thead>
              <tr>
                <th>Carrera</th>
                <th>Resolución</th>
                <th>Cohorte</th>
                <th>Duración</th>
                <th>Carga Horaria</th>
                {userRole !== "2" && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {currentResults.map((fila) => (
                <tr key={fila.id}>
                  <td>{fila.subcategoria}</td>
                  <td>{fila.resolucion}</td>
                  <td>{fila.cohorte}</td>
                  <td>{fila.duracion}</td>
                  <td>{fila.carga_horaria}</td>
                  {userRole !== "2" && (
                    <td>
                      <button onClick={() => abrirModal(fila)}>✏️</button>
                      <button onClick={() => eliminarRegistro(fila.id)}>❌</button>
                    </td>
                  )}
                </tr>
              ))}
              <tr>
                <td colSpan={userRole !== "2" ? 6 : 5} className="pagination-row">
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

      {modalAbierto && (
        <ModalOverlay onClick={cerrarModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Editar Registro</ModalTitle>
            <ModalLabel htmlFor="subcategoria">Carrera:</ModalLabel>
            <ModalInput
              type="text"
              name="subcategoria"
              value={filaSeleccionada.subcategoria}
              readOnly
            />
            <ModalLabel htmlFor="resolucion">Resolución:</ModalLabel>
            <ModalInput
              type="text"
              name="resolucion"
              value={filaSeleccionada.resolucion}
              onChange={(e) => {
                if (handleResolucionChange(e.target.value) && e.target.value.trim() !== "") manejarCambio(e);
              }}
            />
            <ModalLabel htmlFor="cohorte">Cohorte:</ModalLabel>
            <ModalInput
              type="number"
              name="cohorte"
              value={filaSeleccionada.cohorte}
              onChange={(e) => {
                if (e.target.value > 0 && e.target.value.trim() !== "") manejarCambio(e);
              }}
              placeholder="Ej: 2025"
              required
            />
            <ModalLabel htmlFor="duracion">Duración:</ModalLabel>
            <ModalInput
              type="number"
              name="duracion"
              value={filaSeleccionada.duracion}
              onChange={(e) => {
                if (e.target.value > 0 && e.target.value.trim() !== "") manejarCambio(e);
              }}
            />
            <ModalLabel htmlFor="carga_horaria">Carga Horaria:</ModalLabel>
            <ModalInput
              type="number"
              name="carga_horaria"
              value={filaSeleccionada.carga_horaria}
              onChange={(e) => {
                if (e.target.value > 0 && e.target.value.trim() !== "") manejarCambio(e);
              }}
            />
            <ModalButtons>
              <ModalButton onClick={guardarCambios}>Guardar</ModalButton>
              <ModalButton onClick={cerrarModal}>Cancelar</ModalButton>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      )}
    </div>
  );
};

export default BuscarCarrera;