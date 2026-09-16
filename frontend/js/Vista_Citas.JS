document.getElementById('form-cita').addEventListener('submit', async (e) => {
  e.preventDefault(); // Evita que la página se recargue

  // Capturar los valores
  const dueno = document.getElementById('nombre_dueno').value;
  const mascota = document.getElementById('nombre_mascota').value;
  const fechaHora = document.getElementById('fecha_hora').value;
  const divMensaje = document.getElementById('mensaje-resultado');

  try {
    // Enviar al backend
    const respuesta = await fetch('/api/citas', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dueno, mascota, fechaHora })
    });
    
    const datos = await respuesta.json();
    
    // Mostrar mensaje dependiendo del resultado
    if (respuesta.ok) {
      divMensaje.innerHTML = `<p style="color: green;">✅ ${datos.mensaje}</p>`;
      document.getElementById('form-cita').reset(); // Limpia el formulario
      
      // Recargar la página después de 1.5 segundos para que el calendario se actualice
      setTimeout(() => location.reload(), 1500);
    } else {
      divMensaje.innerHTML = `<p style="color: red;">❌ ${datos.error}</p>`;
    }
  } catch (error) {
    divMensaje.innerHTML = `<p style="color: red;">Error al conectar con el servidor.</p>`;
  }
});