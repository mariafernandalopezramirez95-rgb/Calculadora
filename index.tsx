import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Google Sign-In callback
function onGoogleSignIn(response) {
  const data = JSON.parse(atob(response.credential.split('.')[1]));
  console.log('Usuario:', data);
  localStorage.setItem('usuario', JSON.stringify(data));
  alert(`Bienvenido, ${data.name}!`);
}
// Expose function globally for Google Sign-In
window.onGoogleSignIn = onGoogleSignIn;

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
