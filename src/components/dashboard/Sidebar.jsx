import React, { useState, useEffect } from "react";
import "./Sidebar.css";
import axios from "axios";
import FormularioCarrera from "../forms/FormularioCarrera"; 
import BuscarCarrera from "../forms/BuscarCarrera";
import NuevaMateria from "../forms/NuevaMateria";
import BuscarMateria from "../forms/BuscarMateria";
import NuevoEstudiante from "../forms/NuevoEstudiante";
import BuscarEstudiante from "../forms/BuscarEstudiante"; // Nuevo componente
import Calificaciones from "../forms/Calificaciones"; // Nuevo componente

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState(null); // Estado para almacenar el rol
  const [activeMenu, setActiveMenu] = useState(null);
  const [activeSubMenu, setActiveSubMenu] = useState(null);

  // Alternar barra lateral
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setActiveMenu(null);
      setActiveSubMenu(null);
    }
  };

  const toggleMenu = (menu) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleNuevaCarrera = () => {
    setActiveSubMenu("nuevaCarrera");
  };

  const handleBuscarCarrera = () => {
    setActiveSubMenu("buscarCarrera");
  };

  const handleNuevaMateria = () => {
    setActiveSubMenu("nuevaMateria");
  };

  const handleBuscarMateria = () => {
    setActiveSubMenu("buscarMateria");
  };

  const handleBuscarEstudiante = () => {
    setActiveSubMenu("buscarEstudiante");
  };

  const handleMatricular = () => {
    setActiveSubMenu("matricularEstudiante");
  };

  const handleCalificaciones = () => {
    setActiveSubMenu("calificacionesEstudiante");
  };

  // Obtener información del usuario al cargar la página
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          localStorage.clear();
          window.location.href = "/";
          return;
        }

        const response = await axios.post(
          "http://localhost:5000/getUserInfo",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const formattedName =
          response.data.name.charAt(0).toUpperCase() +
          response.data.name.slice(1).toLowerCase();

        setUserName(formattedName);
        setUserRole(response.data.rol_id); // Guardar el rol en el estado
        localStorage.setItem("userRole", response.data.rol_id); // Guardar el rol en localStorage
      } catch (error) {
        localStorage.clear();
        window.location.href = "/";
      }
    };
    fetchUserInfo();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <button onClick={toggleSidebar} className="menu-button">
            <span className="material-symbols-outlined">
              {isOpen ? "close" : "menu"}
            </span>
          </button>
          <span className="admin-text">{userName || "Cargando..."}</span>
        </div>

        <div className="sidebar-menu">
          {/* Carreras */}
          <div className="menu-item" onClick={() => toggleMenu("carreras")}>
            <span className="material-symbols-outlined">edit</span>
            <span>Carreras</span>
          </div>
          {activeMenu === "carreras" && (
            <div className="submenu">
              {userRole !== 2 && (
                <div className="submenu-item" onClick={handleNuevaCarrera}>
                  <span className="material-symbols-outlined">add</span> Nueva Carrera
                </div>
              )}
              <div className="submenu-item" onClick={handleBuscarCarrera}>
                <span className="material-symbols-outlined">search</span> Buscar Carrera
              </div>
            </div>
          )}

          {/* Materias */}
          <div className="menu-item" onClick={() => toggleMenu("materias")}>
            <span className="material-symbols-outlined">book</span>
            <span>Materias</span>
          </div>
          {activeMenu === "materias" && (
            <div className="submenu">
              {userRole !== 2 && (
                <div className="submenu-item" onClick={handleNuevaMateria}>
                  <span className="material-symbols-outlined">add</span> Nueva Materia
                </div>
              )}
              <div className="submenu-item" onClick={handleBuscarMateria}>
                <span className="material-symbols-outlined">search</span> Buscar Materia
              </div>
            </div>
          )}

          {/* Estudiantes */}
          <div className="menu-item" onClick={() => toggleMenu("estudiantes")}>
            <span className="material-symbols-outlined">group</span>
            <span>Estudiantes</span>
          </div>
          {activeMenu === "estudiantes" && (
            <div className="submenu">
              <div
                className="submenu-item"
                onClick={() => setActiveSubMenu("nuevoEstudiante")}
              >
                <span className="material-symbols-outlined">add</span> Nuevo Estudiante
              </div>
              <div
                className="submenu-item"
                onClick={handleBuscarEstudiante}
              >
                <span className="material-symbols-outlined">search</span> Buscar Estudiante
              </div>
              <div
                className="submenu-item"
                onClick={handleMatricular}
              >
                <span className="material-symbols-outlined">note_add</span> Matricular
              </div>
              <div
                className="submenu-item"
                onClick={handleCalificaciones}
              >
                <span className="material-symbols-outlined">check_circle</span> Calificaciones
              </div>
            </div>
          )}

          {/* Cerrar Sesión */}
          <div className="menu-item logout" onClick={handleLogout}>
            <span className="material-symbols-outlined">logout</span>
            <span>Cerrar Sesión</span>
          </div>
        </div>

        {/* Sección del logo */}
        <div className="logo-container">
          <img
            src="/WhatsApp-Image-2023-06-01-at-4.34.04-PM-500x500-removebg-preview.png"
            alt="Logo"
            className="logo"
          />
        </div>
      </aside>

      {/* Contenedor Principal */}
      <main style={{ flex: 1, padding: "20px", backgroundColor: "#f4f4f4" }}>
        {activeSubMenu === "nuevaCarrera" && <FormularioCarrera />}
        {activeSubMenu === "buscarCarrera" && <BuscarCarrera />}
        {activeSubMenu === "nuevaMateria" && <NuevaMateria />}
        {activeSubMenu === "buscarMateria" && <BuscarMateria />}
        {activeSubMenu === "nuevoEstudiante" && <NuevoEstudiante />}
        {activeSubMenu === "buscarEstudiante" && <BuscarEstudiante />}
        {activeSubMenu === "calificacionesEstudiante" && <Calificaciones />}
      </main>
    </div>
  );
};

export default Sidebar;
