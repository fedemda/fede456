import React, { useState, useEffect, useRef } from "react";
import "./Calificaciones.css";
import axios from "axios";
import Swal from "sweetalert2";
import AnaliticoButton from "../funciones/AnaliticoButton";


const Calificaciones = () => {
  const [dni, setDni] = useState("");
  const [resultados, setResultados] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [curso, setCurso] = useState("");
  const [materia, setMateria] = useState("");
  const [lf, setLf] = useState("");
  const [fechaAprobacion, setFechaAprobacion] = useState("");
  const fechaAprobacionRef = useRef(null);
  const [calificacionNumerica, setCalificacionNumerica] = useState("");
  const [calificacionLetras, setCalificacionLetras] = useState("");
  const [cursosDisponibles, setCursosDisponibles] = useState([]);
  const [materiasDisponibles, setMateriasDisponibles] = useState([]);
  const [carreraSeleccionada, setCarreraSeleccionada] = useState("");
  const [apNombre, setApNombre] = useState("");
  const [resolucion, setResolucion] = useState("");
  const [modoCursada, setModoCursada] = useState(false);
  const [lfLocked, setLfLocked] = useState(false);


  useEffect(() => {
    if (curso) {
      handleCursoChange({ target: { value: curso } });
    }
  }, [curso]);

  const handleSearch = async () => {
    // Verifica que se haya ingresado DNI y que tenga 8 dígitos
    if (!dni || dni.length < 8) {
      Swal.fire({ icon: "error", title: "Error", text: "Ingrese un DNI válido." });
      return;
    }
  
    try {
      const response = await axios.get(`http://localhost:5000/estudiantes/${dni}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      console.log("🔍 Estudiantes:", response.data);
      setResultados(response.data);
  
      if (response.data.length > 0) {
        const estudiante = response.data[0];
        setApNombre(estudiante.nombre);
        setCarreraSeleccionada(estudiante.carrera);
        setResolucion(estudiante.resolucion);
      }
    } catch (error) {
      Swal.fire({ icon: "error", title: "Error", text: "No se encontró información para este DNI." });
      setResultados([]);
    }
  };
  

  const handleCargarNotas = async (carrera, resolucionBusqueda) => {
    console.log("✅ Cargando notas para la carrera:", carrera);
    setCarreraSeleccionada(carrera);
    setResolucion(resolucionBusqueda); // Actualiza la resolución con el valor correcto
    setMostrarFormulario(true);
    await cargarCursos(carrera);
  };
  

  const cargarCursos = async (carrera) => {
    try {
      console.log("📡 Buscando cursos para la carrera:", carrera);
      const response = await axios.get(
        `http://localhost:5000/materias?carrera=${encodeURIComponent(carrera)}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      console.log("✅ Cursos obtenidos:", response.data);

      const añosUnicos = [
        ...new Set(
          response.data
            .filter((materia) => materia.carrera === carrera)
            .map((materia) => materia.anio)
        ),
      ].sort();

      setCursosDisponibles(añosUnicos);
    } catch (error) {
      console.error("❌ Error al obtener cursos:", error);
      setCursosDisponibles([]);
    }
  };

  const handleCursoChange = async (e) => {
    const anioSeleccionado = e.target.value.replace("º", "").trim();
    setCurso(anioSeleccionado);

    console.log(`📡 (handleCursoChange) Año seleccionado: '${anioSeleccionado}'`);
    console.log(`📡 (handleCursoChange) Carrera seleccionada: '${carreraSeleccionada}'`);

    if (!carreraSeleccionada || !anioSeleccionado) {
      console.warn("⚠️ No hay carrera o año seleccionados. No se hará la consulta.");
      return;
    }

    try {
      const response = await axios.get("http://localhost:5000/materias", {
        params: {
          carrera: carreraSeleccionada.trim(),
          anio: anioSeleccionado,
        },
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      console.log("✅ (handleCursoChange) Materias obtenidas antes de filtrar:", response.data);

      const materiasFiltradas = response.data.filter(
        (materia) =>
          materia.carrera.trim().toLowerCase() ===
          carreraSeleccionada.trim().toLowerCase() &&
          materia.anio === anioSeleccionado
      );

      console.log("✅ (handleCursoChange) Materias filtradas en frontend:", materiasFiltradas);

      setMateriasDisponibles(materiasFiltradas.map((m) => m.nombre_materia));
    } catch (error) {
      console.error("❌ (handleCursoChange) Error al obtener materias:", error);
      setMateriasDisponibles([]);
    }
  };

  // Función para limpiar todos los campos del formulario (incluyendo el curso) al presionar Reset
  const resetCamposFormulario = () => {
    setCurso("");
    setMateria("");
    setLf("");
    setFechaAprobacion("");
    setCalificacionNumerica("");
    setCalificacionLetras("");
    setModoCursada(false);

    if (fechaAprobacionRef.current) {
      fechaAprobacionRef.current.type = "text";
    }
  };

  // Función para limpiar el formulario después de guardar, conservando la selección de curso
  const resetCamposPostSave = () => {
    setMateria("");
    setLf("");
    setFechaAprobacion("");
    setCalificacionNumerica("");
    setCalificacionLetras("");
    setModoCursada(false);

    if (fechaAprobacionRef.current) {
      fechaAprobacionRef.current.type = "text";
    }
  };

  // Función para volver a la vista de búsqueda
  const volver = () => {
    setDni("");
    setResultados([]);
    setCurso("");
    setMateria("");
    setLf("");
    setFechaAprobacion("");
    setCalificacionNumerica("");
    setCalificacionLetras("");
    setCarreraSeleccionada("");
    setMateriasDisponibles([]);
    setCursosDisponibles([]);
    setApNombre("");
    setResolucion("");
    setMostrarFormulario(false);
  };

  const numberToWords = (num) => {
    switch (num) {
      case 1:
        return "Uno";
      case 2:
        return "Dos";
      case 3:
        return "Tres";
      case 4:
        return "Cuatro";
      case 5:
        return "Cinco";
      case 6:
        return "Seis";
      case 7:
        return "Siete";
      case 8:
        return "Ocho";
      case 9:
        return "Nueve";
      case 10:
        return "Diez";
      default:
        return "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Validar que todos los campos obligatorios estén completos
    if (!curso || !materia || !lf || !fechaAprobacion || !calificacionNumerica) {
      Swal.fire("Error", "Todos los campos son obligatorios", "error");
      return;
    }
  
    // Preparar los datos a enviar
    const data = {
      dni,
      ap_nombre: apNombre,
      carrera: carreraSeleccionada,
      resolucion,
      materia,
      curso,
      l_f: lf,
      fecha_aprobacion: fechaAprobacion,
      numeros: calificacionNumerica,
      letras: calificacionLetras,
    };
  
    try {
      // Consulta para verificar si ya existe una calificación para ese DNI y materia
      const existeResponse = await axios.get("http://localhost:5000/calificaciones", {
        params: { dni, materia },
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
  
      if (existeResponse.data && existeResponse.data.length > 0) {
        // Extraer el registro existente y su id
        const registroExistente = existeResponse.data[0];
        const idRegistro = registroExistente.id;
        console.log("ID obtenido:", idRegistro);
  
        // Preguntar si se desea sobreescribir
        const confirmacion = await Swal.fire({
          title: "La materia ya se encuentra cargada",
          text: "¿Desea sobreescribir?",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Aceptar",
          cancelButtonText: "Cancelar",
        });
  
        if (confirmacion.isConfirmed) {
          // Ejecutar la actualización (PUT) usando el id obtenido
          await axios.put(`http://localhost:5000/calificaciones/${idRegistro}`, data, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          });
          Swal.fire("¡Éxito!", "La calificación fue actualizada correctamente", "success");
        } else {
          return;
        }
      } else {
        // Si no existe, crear la calificación con POST
        await axios.post("http://localhost:5000/calificaciones", data, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        Swal.fire("¡Éxito!", "Datos almacenados correctamente", "success");
      }
  
      // Reiniciar campos (excepto el curso)
      resetCamposPostSave();
    } catch (error) {
      console.error("Error al almacenar los datos:", error);
      Swal.fire("Error", "No se pudieron almacenar los datos", "error");
    }
  }; 

  return (
    <div className={`calificaciones-component__container ${mostrarFormulario ? "ocultar-fondo" : ""}`}>
      {!mostrarFormulario ? (
        <>
          <div className="calificaciones-component__form-group">
          <input
            type="text"
            id="dni"
            className="calificaciones-component__input"
            placeholder="Ingrese DNI"
            value={dni}
            onChange={(e) => {
              // Reemplaza todo lo que no sea dígito, toma solo los primeros 8 caracteres y actualiza el estado.
              const numericValue = e.target.value.replace(/[^0-9]/g, '').slice(0, 8);
              setDni(numericValue);
            }}
            inputMode="numeric"
            maxLength="8"
          />

            <button
              className="calificaciones-component__btn-primary btn-buscar"
              onClick={handleSearch}
              disabled={!dni}
            >
              Buscar
            </button>
          </div>

          {resultados.length > 0 && (
            <div className="calificaciones-component__result-container visible">
              {resultados.map((resultado, index) => (
            <div key={index} className="calificaciones-component__result-item">
              <div className="calificaciones-component__result-text">
                <p>
                  <strong>Apellido y Nombre:</strong> {resultado.nombre}
                </p>
                <p>
                  <strong>Carrera:</strong> {resultado.carrera}
                </p>
                <p>
                  <strong>Resolución:</strong> {resultado.resolucion}
                </p>
              </div>
              <div className="calificaciones-component__result-buttons">
                <button onClick={() => handleCargarNotas(resultado.carrera, resultado.resolucion)}>
                  Cargar Notas
                </button>
                <AnaliticoButton
                  dni={dni}
                  apNombre={apNombre}
                  carrera={resultado.carrera}  // o bien usar carreraSeleccionada si ya está en el estado
                  resolucion={resultado.resolucion} // o resolucion={resolucion} si se actualiza en el estado
                />
                <button>Porcentaje de Materias</button>
              </div>
            </div>
          ))}

            </div>
          )}
        </>
      ) : (
        <div className="calificaciones-formulario-notas">
          <h2 className="calificaciones-formulario__title">CARGA DE NOTAS</h2>
          <form onSubmit={handleSubmit}>
            <label>
              Carrera:
              <input
                type="text"
                className="form-group__input readonly"
                value={carreraSeleccionada}
                readOnly
              />
            </label>

            <div className="calificaciones-formulario__grid">
              <label>
                Curso
                <select className="form-group__input" value={curso} onChange={handleCursoChange}>
                  <option value="">Seleccione un curso</option>
                  {cursosDisponibles.length === 0 ? (
                    <option value="" disabled>
                      No hay cursos disponibles
                    </option>
                  ) : (
                    cursosDisponibles.map((curso, index) => (
                      <option key={index} value={curso}>
                        {curso}º
                      </option>
                    ))
                  )}
                </select>
              </label>

              <label>
                Materia
                <select
                  className="form-group__input"
                  value={materia}
                  onChange={(e) => setMateria(e.target.value)}
                  disabled={!curso}
                >
                  <option value="">Seleccione una materia</option>
                  {materiasDisponibles.length === 0 ? (
                    <option value="" disabled>
                      No hay materias disponibles
                    </option>
                  ) : (
                    materiasDisponibles.map((materia, index) => (
                      <option key={index} value={materia}>
                        {materia}
                      </option>
                    ))
                  )}
                </select>
              </label>
              
              <label>
              L/F
              <input
                type="text"
                className="form-group__input lf-input"
                value={lf}
                placeholder="Libro/Folio"
                onChange={(e) => {
                  const newValue = e.target.value;
                  const inputType = e.nativeEvent.inputType || "";

                   
                  if (newValue === "") {
                    setLf("");
                    setModoCursada(false);
                    setLfLocked(false);
                    setCalificacionNumerica("");
                    setCalificacionLetras("");
                    setFechaAprobacion("");
                    return;
                  }

                   
                  if ((lf === "Cursada Aprobada" || lf === "Debe Cursar") && inputType.includes("delete")) {
                    setLf("");
                    setModoCursada(false);
                    setLfLocked(false);
                    setCalificacionNumerica("");
                    setCalificacionLetras("");
                    setFechaAprobacion("");
                    return;
                  }

                   
                  const selectionStart = e.target.selectionStart;
                  const selectionEnd = e.target.selectionEnd;
                  const isAllSelected = (selectionStart === 0 && selectionEnd === lf.length);

                  
                  if (isAllSelected && newValue.toUpperCase() === "C") {
                    setModoCursada(true);
                    setLf("Cursada Aprobada");
                    setCalificacionNumerica("---");
                    setCalificacionLetras("---");
                    setFechaAprobacion("");
                    return;
                  }

                   
                  if (isAllSelected && newValue.toUpperCase() === "D") {
                    setModoCursada(true);
                    setLf("Debe Cursar");
                    setLfLocked(true);
                    setFechaAprobacion("---");
                    setCalificacionNumerica("---");
                    setCalificacionLetras("---");
                    return;
                  }

                   
                  if (newValue.toUpperCase() === "C") {
                    setModoCursada(true);
                    setLf("Cursada Aprobada");
                    setCalificacionNumerica("---");
                    setCalificacionLetras("---");
                    setFechaAprobacion("");
                    return;
                  }

                   
                  if (newValue.toUpperCase() === "D") {
                    setModoCursada(true);
                    setLf("Debe Cursar");
                    setLfLocked(true);
                    setFechaAprobacion("---");
                    setCalificacionNumerica("---");
                    setCalificacionLetras("---");
                    return;
                  }

           
                  if (newValue.length < lf.length) {
                    setLf(newValue);
                    if (newValue !== "Cursada Aprobada" && newValue !== "Debe Cursar") {
                      setModoCursada(false);
                      setLfLocked(false);
                      setCalificacionNumerica("");
                      setCalificacionLetras("");
                    }
                    return;
                  }

         
                  const regex = /^(?:[1-9]\d{0,2})(?:\/(?:[1-9]\d{0,2})?)?$/;
                  if (regex.test(newValue)) {
                    setLf(newValue);
                  }
                }}
              />
            </label>

            <label>
              Fecha de aprobación
              <input
                ref={fechaAprobacionRef}
                type="text"
                placeholder="Seleccione fecha"
                className="form-group__input fecha-aprobacion"
                value={fechaAprobacion}
                // Si L/F es "Debe Cursar", la fecha se mantiene bloqueada
                readOnly={lf === "Debe Cursar"}
                onFocus={(e) => {
                  if (lf !== "Debe Cursar") {
                    // Al hacer foco, se cambia a tipo "date" para mostrar el selector
                    e.target.type = "date";
                  }
                }}
                onBlur={(e) => {
                  // Si no se ha seleccionado ningún valor, se vuelve a "text" para mostrar el placeholder
                  if (!e.target.value) {
                    e.target.type = "text";
                  } else {
                    // Si se ingresó una fecha, verificamos el año
                    const partes = e.target.value.split("-");
                    if (partes.length === 3) {
                      const year = parseInt(partes[0], 10);
                      if (year < 2010) {
                        // Si el año es menor a 2010, reiniciamos el input
                        setFechaAprobacion("");
                        e.target.type = "text";
                        // Opcional: Puedes notificar al usuario con un mensaje (por ejemplo, con SweetAlert)
                        return;
                      }
                    }
                  }
                }}
                onChange={(e) => {
                  if (lf !== "Debe Cursar") {
                    let value = e.target.value;
                    // Opcional: si se quiere limitar el año a 4 dígitos
                    const partes = value.split("-");
                    if (partes.length > 0) {
                      if (partes[0].length > 4) {
                        partes[0] = partes[0].slice(0, 4);
                        value = partes.join("-");
                      }
                    }
                    setFechaAprobacion(value);
                  }
                }}
              />
            </label>

              <label>
                Calificación
                {modoCursada ? (
                  <input
                    type="text"
                    className="form-group__input"
                    value="---"
                    readOnly
                  />
                ) : (
                  <input
                    type="number"
                    className="form-group__input"
                    value={calificacionNumerica}
                    placeholder="En números"
                    min="1"
                    max="10"
                    onChange={(e) => {
                      const newValue = e.target.value;
                      if (newValue === "") {
                        setCalificacionNumerica("");
                        setCalificacionLetras("");
                        return;
                      }
                      if (!/^(10|[1-9])$/.test(newValue)) {
                        return;
                      }
                      setCalificacionNumerica(newValue);
                      setCalificacionLetras(numberToWords(parseInt(newValue, 10)));
                    }}
                  />
                )}
              </label>

              <label>
                Calificación
                {modoCursada ? (
                  <input
                    type="text"
                    className="form-group__input"
                    value="---"
                    readOnly
                  />
                ) : (
                  <input
                    type="text"
                    className="form-group__input"
                    placeholder="En letras"
                    value={calificacionLetras}
                    readOnly
                  />
                )}
              </label>
            </div>

            <div className="form-buttons">
            <button type="button" className="calificaciones-component__btn-primary btn-volver" onClick={volver}>
              Volver
            </button>
            <button type="submit" className="calificaciones-component__btn-primary btn-guardar">
              Guardar
            </button>
            <button type="reset" className="calificaciones-component__btn-primary btn-reset" onClick={resetCamposFormulario}>
              Reset
            </button>
          </div>

          </form>
        </div>
      )}
    </div>
  );
};

export default Calificaciones;
