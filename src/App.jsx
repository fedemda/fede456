import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginRegister from "./pages/LoginRegister";
import Sidebar from "./components/dashboard/Sidebar";


function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Estado para verificar si está logueado
  const [userEmail, setUserEmail] = useState(""); // Estado para el email del usuario

  // Verifica el estado de inicio de sesión al cargar la aplicación
  useEffect(() => {
    const token = localStorage.getItem("token"); // Verifica si existe el token en localStorage
    const email = localStorage.getItem("userEmail"); // Recupera el email guardado
    if (token && email) {
      setIsLoggedIn(true); // Mantiene la sesión activa
      setUserEmail(email); // Restaura el email del usuario
    }
  }, []);

  // Manejar inicio de sesión
  const handleLogin = (email) => {
    localStorage.setItem("userEmail", email); // Guarda el email en localStorage
    setUserEmail(email); // Actualiza el estado
    setIsLoggedIn(true); // Marca como logueado
  };

  // Manejar cierre de sesión
  const handleLogout = () => {
    localStorage.clear(); // Borra todos los datos guardados
    setIsLoggedIn(false); // Cierra sesión
  };

  return (
    <Router>
      <Routes>
        {/* Ruta para Login/Registro */}
        <Route
          path="/"
          element={
            !isLoggedIn ? (
              <LoginRegister onLogin={handleLogin} />
            ) : (
              <Navigate to="/dashboard" />
            )
          }
        />
        {/* Ruta para el Dashboard */}
        <Route
          path="/dashboard"
          element={
            isLoggedIn ? (
              <div style={{ 
                display: "flex", 
                height: "100vh", // Altura completa
                width: "66.11vw"  // Ancho completo del navegador
              }}>
                {/* Sidebar */}
                <Sidebar userEmail={userEmail} onLogout={handleLogout} />
              
                {/* Contenedor principal más ancho */}
                <div style={{ 
                    flex: 1, 
                    display: "flex", 
                    justifyContent: "center", // Centrado horizontalmente
                    alignItems: "flex-start", // Alineado al inicio vertical
                    backgroundColor: "#f4f4f4", // Fondo claro
                    padding: "20px" // Espaciado interno
                  }}>
                  <div style={{ 
                  width: "95%", 
                  maxWidth: "1800px", 
                  textAlign: "center", 
                  position: "relative", // Permite usar top para ajustar la posición
                  top: "-28px" // Mueve el título hacia arriba
                }}>
                  <h1 style={{ fontSize: "3rem", fontWeight: "bold", marginTop: "0" }}>
                    Sistema de Gestión Institucional
                  </h1>
                </div>
                </div>
                </div>
                         
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
