import "./LoginRegister.css";
import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

// Configurar SweetAlert2 para React
const MySwal = withReactContent(Swal);

// Importa el logo desde la carpeta assets
import logo from "../assets/logo.png";

function LoginRegister({ onLogin }) {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [showLogin, setShowLogin] = useState(true); // Alternar entre Login y Registro
  const [showToggleButton, setShowToggleButton] = useState(false); // Controlar visibilidad del botón, por defecto oculto

  // Alternar entre formularios
  const toggleForm = () => {
    setShowLogin(!showLogin);
    setFormData({ name: "", email: "", password: "" }); // Limpia los campos al alternar
  };

  // Manejar cambios en los campos del formulario
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (showLogin) {
        // Inicio de sesión
        const response = await axios.post("http://localhost:5000/login", {
          email: formData.email,
          password: formData.password,
        });

        // Guardar el token y el nombre en localStorage
        localStorage.setItem("token", response.data.token); // Guarda el token
        localStorage.setItem("userName", response.data.name); // Guarda el nombre

        // Mostrar alerta de inicio de sesión exitoso
        MySwal.fire({
          title: "Éxito",
          text: response.data.message,
          icon: "success",
        }).then(() => {
          // Llama a la función `onLogin` pasando el nombre del usuario
          onLogin(response.data.name);
        });

      } else {
        // Registro de usuario
        const response = await axios.post("http://localhost:5000/register", {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });

        MySwal.fire({
          title: "Éxito",
          text: response.data.message,
          icon: "success",
        });
        setFormData({ name: "", email: "", password: "" }); // Limpia los campos del formulario
        setShowLogin(true); // Cambia al formulario de Login
      }
    } catch (error) {
      MySwal.fire({
        title: "Error",
        text: error.response?.data?.message || "Error en la solicitud. Por favor, intenta de nuevo.",
        icon: "error",
      });
    }
  };

  return (
    <div className="form-container">
      <img src={logo} alt="Logo" /> {/* Logo */}
      <h1>{showLogin ? "Iniciar Sesión" : "Registrarse"}</h1>
      <form onSubmit={handleSubmit}>
        {/* Campo de nombre solo para registro */}
        {!showLogin && (
          <input
            type="text"
            name="name"
            placeholder="Ingresa tu nombre"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        )}
        <input
          type="email"
          name="email"
          placeholder="Ingresa tu correo"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Ingresa tu contraseña"
          value={formData.password}
          onChange={handleInputChange}
          required
        />
        <button type="submit">{showLogin ? "Iniciar Sesión" : "Registrarse"}</button>
      </form>
      {showToggleButton && (
        <button className="toggle" onClick={toggleForm}>
          {showLogin ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia Sesión"}
        </button>
      )}
    </div>
  );
}

export default LoginRegister;