import React, { useState, useEffect, useCallback } from "react";
import Swal from "sweetalert2";
import debounce from "lodash.debounce";
import {
  ModalOverlay,
  ModalContent,
  ModalTitle,
  ModalInput,
  ModalButtons,
  ModalButton,
  ModalLabel,
} from "./ModalStyles"; // Adjust the import path as necessary
import "./BuscarEstudiante.css";

const BuscarEstudiante = () => {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filaSeleccionada, setFilaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dniError, setDniError] = useState(null);
  const [fechaError, setFechaError] = useState(null);
  const [emailError, setEmailError] = useState(null);

  // Función para capitalizar cada palabra
  const capitalizeWords = (str) => {
    return str
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const buscarDatos = useCallback(
    debounce(async (query) => {
      if (query.trim() !== "") {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(
            `http://localhost:5000/estudiantes?busqueda=${query}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          const data = await response.json();
          setResultados(data);
        } catch (error) {
          setError("Error al buscar datos");
        } finally {
          setLoading(false);
        }
      } else {
        setResultados([]);
      }
    }, 500),
    []
  );

  useEffect(() => {
    buscarDatos(busqueda);
  }, [busqueda, buscarDatos]);

  // Función de validación con debounce (mantén debounce para no saturar el endpoint)
  const validarDniDuplicadoEdicion = useCallback(
    debounce(async (dni, id) => {
      if (dni.trim() === "" || dni.length !== 8) {
        setDniError("Ingrese un DNI válido");
        return;
      }
      try {
        const response = await fetch(
          `http://localhost:5000/estudiantes/validar-dni?dni=${dni}&id=${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        const data = await response.json();
        if (data.duplicado) {
          setDniError("DNI duplicado en la base de datos");
        } else {
          setDniError(null);
        }
      } catch {
        setDniError("Error al validar el DNI");
      }
    }, 500),
    []
  );

  // Actualizamos el DNI sin llamar a la validación directamente
  const manejarCambioDNI = (e) => {
    const nuevoDni = e.target.value.replace(/[^0-9]/g, "");
    setFilaSeleccionada((prev) => ({
      ...prev,
      dni: nuevoDni,
    }));
  };

  // useEffect para disparar la validación cuando cambie el DNI o el id
  useEffect(() => {
    if (filaSeleccionada && filaSeleccionada.dni && filaSeleccionada.id) {
      validarDniDuplicadoEdicion(filaSeleccionada.dni, filaSeleccionada.id);
    }
  }, [filaSeleccionada?.dni, filaSeleccionada?.id, validarDniDuplicadoEdicion]);

  const manejarCambioFecha = (e) => {
    const nuevaFecha = e.target.value;
    const fechaMinima = new Date("1955-01-01");
    const fechaMaxima = new Date("2008-12-31");
    const fechaIngresada = new Date(nuevaFecha);

    setFilaSeleccionada((prev) => ({
      ...prev,
      fecha_nacimiento: nuevaFecha,
    }));

    if (isNaN(fechaIngresada) || fechaIngresada < fechaMinima || fechaIngresada > fechaMaxima) {
      setFechaError("Ingrese una fecha válida");
    } else {
      setFechaError(null);
    }
  };

  const manejarCambioEmail = (e) => {
    const nuevoEmail = e.target.value;
    setFilaSeleccionada((prev) => ({
      ...prev,
      email: nuevoEmail,
    }));

    // Validar formato de email
    const regexEmail = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{3,}$/;
    if (!regexEmail.test(nuevoEmail.trim())) {
      setEmailError("Ingrese un email válido");
    } else {
      setEmailError(null);
    }
  };

  const abrirModal = (fila) => {
    setFilaSeleccionada({ ...fila });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setFilaSeleccionada(null);
    setDniError(null);
    setFechaError(null);
    setEmailError(null);
  };

  const guardarCambios = async () => {
    let { nombre, dni, fecha_nacimiento, telefono, email, carrera } = filaSeleccionada;

    // Validaciones generales
    if (!nombre || !dni || !fecha_nacimiento || !email || !carrera) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Todos los campos son obligatorios.",
      });
      return;
    }

    nombre = capitalizeWords(nombre);

    // En lugar de mostrar un Sweet Alert para dniError, simplemente abortamos
    if (dniError) {
      return;
    }
    if (fechaError) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: fechaError,
      });
      return;
    }
    if (emailError) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: emailError,
      });
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/estudiantes/${filaSeleccionada.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            apellido_y_nombre: nombre,
            dni,
            fecha_de_nacimiento: fecha_nacimiento,
            telefono,
            email,
            carrera,
          }),
        }
      );

      if (response.ok) {
        const actualizados = resultados.map((item) =>
          item.id === filaSeleccionada.id ? { ...filaSeleccionada, nombre } : item
        );
        setResultados(actualizados);
        cerrarModal();
        Swal.fire({
          title: "Éxito",
          text: "Datos actualizados correctamente.",
          icon: "success",
        });
      } else {
        throw new Error("Error al actualizar los datos.");
      }
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: "Ocurrió un error al guardar los cambios.",
        icon: "error",
      });
    }
  };

  const eliminarRegistro = async (id) => {
    try {
      const confirmacion = await Swal.fire({
        title: "¿Estás seguro?",
        text: "No podrás revertir esta acción.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Sí, eliminar",
      });

      if (confirmacion.isConfirmed) {
        const response = await fetch(`http://localhost:5000/estudiantes/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          const nuevosResultados = resultados.filter((fila) => fila.id !== id);
          setResultados(nuevosResultados);
        } else {
          throw new Error("Error al eliminar el registro");
        }
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo eliminar el registro.",
      });
    }
  };

  return (
    <div className="buscar-estudiante-main-container">
      <div className="buscar-estudiante-container">
        <h2>Buscar Estudiante</h2>
        <input
          type="text"
          placeholder="Buscar estudiante"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {error && <p>{error}</p>}

      {resultados.length > 0 && (
        <div className="resultados-busqueda">
          <table>
            <thead>
              <tr>
                <th>Apellido y Nombre</th>
                <th>DNI</th>
                <th>Fecha de Nacimiento</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Carrera</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((fila) => (
                <tr key={fila.id}>
                  <td>{fila.nombre}</td>
                  <td>{fila.dni}</td>
                  <td>
                    {new Date(fila.fecha_nacimiento).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  <td>{fila.telefono}</td>
                  <td>{fila.email}</td>
                  <td>{fila.carrera}</td>
                  <td>
                    <button onClick={() => abrirModal(fila)}>✏️</button>
                    <button onClick={() => eliminarRegistro(fila.id)}>❌</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && (
        <ModalOverlay onClick={cerrarModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Editar Registro</ModalTitle>
            <ModalLabel>Apellido y Nombre:</ModalLabel>
            <ModalInput
              type="text"
              value={filaSeleccionada.nombre}
              onChange={(e) =>
                setFilaSeleccionada((prev) => ({
                  ...prev,
                  nombre: e.target.value.replace(/[^a-zA-ZÁÉÍÓÚáéíóúÑñ\s]/g, ""),
                }))
              }
            />
            <ModalLabel>DNI:</ModalLabel>
            <div style={{ position: "relative" }}>
              <ModalInput
                className={dniError ? "error" : ""}
                type="text"
                value={filaSeleccionada.dni}
                onChange={manejarCambioDNI}
              />
              {dniError && <span className="modal-error-message">{dniError}</span>}
            </div>

            <ModalLabel>Fecha de Nacimiento:</ModalLabel>
            <div style={{ position: "relative" }}>
              <ModalInput
                className={fechaError ? "error" : ""}
                type="date"
                value={filaSeleccionada.fecha_nacimiento.split("T")[0]}
                min="1955-01-01"
                max="2008-12-31"
                onChange={manejarCambioFecha}
              />
              {fechaError && <span className="modal-error-message">{fechaError}</span>}
            </div>

            <ModalLabel>Teléfono:</ModalLabel>
            <ModalInput
              type="text"
              value={filaSeleccionada.telefono}
              onChange={(e) => {
                const nuevoValor = e.target.value.replace(/[^0-9]/g, "");
                setFilaSeleccionada((prev) => ({
                  ...prev,
                  telefono: nuevoValor,
                }));
              }}
            />

            <ModalLabel>Email:</ModalLabel>
            <div style={{ position: "relative" }}>
              <ModalInput
                className={emailError ? "error" : ""}
                type="email"
                value={filaSeleccionada.email}
                onChange={manejarCambioEmail}
              />
              {emailError && <span className="modal-error-message">{emailError}</span>}
            </div>

            <ModalLabel>Carrera:</ModalLabel>
            <ModalInput type="text" value={filaSeleccionada.carrera} readOnly />
            <ModalButtons>
              <ModalButton
                onClick={guardarCambios}
                disabled={!!dniError || !!fechaError || !!emailError}
                style={{
                  backgroundColor: dniError || fechaError || emailError ? "#ccc" : "#007bff",
                  cursor: dniError || fechaError || emailError ? "not-allowed" : "pointer",
                }}
              >
                Guardar
              </ModalButton>
              <ModalButton onClick={cerrarModal}>Cancelar</ModalButton>
            </ModalButtons>
          </ModalContent>
        </ModalOverlay>
      )}
    </div>
  );
};

export default BuscarEstudiante;
