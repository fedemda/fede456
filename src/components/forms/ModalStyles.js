import styled, { keyframes } from 'styled-components';

// Animación de aparición
const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

// Animación de deslizamiento
const slideDown = keyframes`
  from {
    opacity: 0;
    transform: translate(-50%, -60%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%);
  }
`;

// Fondo del modal
export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7); /* Fondo más oscuro */
  z-index: 10000;
  animation: ${fadeIn} 0.3s ease-out;
`;

// Contenido del modal
export const ModalContent = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #ffffff;
  padding: 20px; /* Más espacio interno */
  border-radius: 16px; /* Bordes más suaves */
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3); /* Sombra más moderna */
  z-index: 10001;
  width: 90%; /* Ancho adaptable */
  max-width: 400px; /* Ancho máximo */
  animation: ${slideDown} 0.3s ease-out;

  @media (max-width: 768px) {
    width: 95%;
    padding: 20px; /* Reducir padding en pantallas pequeñas */
  }
`;

// Título del modal
export const ModalTitle = styled.h3`
  margin-bottom: 15px; /* Reducir el margen inferior */
  text-align: center;
  font-size: 24px; /* Texto más grande */
  font-weight: bold;
  color: #333;
`;

// Labels del modal
export const ModalLabel = styled.label`
  display: block;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 5px; /* Espacio entre label y input */
  color: #555;
  position: relative;
  left: 10px; /* Mueve 10px hacia la derecha */
`;


// Inputs del modal
export const ModalInput = styled.input`
  width: calc(100% - 40px); /* Ajustar el ancho para que no se salga del contenedor */
  padding: 10px;
  margin: 8px 6px; /* Centrar el input */
  border: 1px solid #ccc;
  border-radius: 8px;
  outline: none;
  font-size: 16px; /* Tamaño de fuente mayor */
  color: #333;
  transition: all 0.3s ease;

  &:focus {
    border-color: #007bff;
    box-shadow: 0 0 8px rgba(0, 123, 255, 0.6);
  }
`;

// Contenedor de botones
export const ModalButtons = styled.div`
  display: flex;
  justify-content: center; /* Centra los botones */
  align-items: center; /* Alinea verticalmente */
  margin-top: 15px; /* Espacio superior */
  gap: 10px; /* Espaciado entre botones */
  width: 100%; /* Ocupa todo el ancho disponible */
`;

// Botones del modal
export const ModalButton = styled.button`
  padding: 10px 15px; /* Tamaño ajustado */
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px; /* Tamaño más pequeño */
  transition: all 0.3s ease;

  &:first-child {
    background-color: #007bff;
    color: white;
    box-shadow: 0 4px 6px rgba(0, 123, 255, 0.3); /* Sombra */
  }

  &:first-child:hover {
    background-color: #0056b3;
    box-shadow: 0 4px 12px rgba(0, 123, 255, 0.4); /* Sombra */
  }

  &:last-child {
    background-color: #dc3545;
    color: white;
    box-shadow: 0 4px 6px rgba(220, 53, 69, 0.3); /* Sombra */
  }

  &:last-child:hover {
    background-color: #c82333;
    box-shadow: 0 4px 12px rgba(220, 53, 69, 0.4); /* Sombra */
  }
`;
