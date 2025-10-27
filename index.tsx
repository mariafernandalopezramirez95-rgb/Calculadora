import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Type definition for custom properties on the window object
declare global {
  interface Window {
    // onGoogleSignIn está ahora definido en index.html, pero lo declaramos para TypeScript
    onGoogleSignIn: (response: any) => void;
    handleGoogleLogin: (userData: any) => void;
  }
}

// La función onGoogleSignIn ha sido movida a una etiqueta <script> en index.html
// para prevenir una condición de carrera con la librería de Google GSI.
// La app de React ahora solo será responsable de definir 'handleGoogleLogin'
// para que el callback global lo use.

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}
const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);