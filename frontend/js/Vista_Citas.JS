async function cargarCitas() {
  const contenedor = document.getElementById('lista-citas');

  try {
    const respuesta = await fetch('/api/citas');
    const citas = await respuesta.json();

    // Criterio de Aceptación: Mensaje si no hay citas
    if (!citas || citas.length === 0) {
      contenedor.innerHTML = '<p class="alerta">No hay citas programadas para hoy</p>';
      return;
    }

    // Dibujar la lista si existen citas
    contenedor.innerHTML = citas.map(cita => `
      <div class="tarjeta-cita">
        <h3>Mascota: ${cita.MASCOTA}</h3>
        <p><strong>Dueño:</strong> ${cita.DUENO}</p>
        <p><strong>Hora:</strong> ${cita.FECHA_HORA}</p>
      </div>
    `).join('');

  } catch (error) {
    console.error('Error al cargar citas:', error);
    contenedor.innerHTML = '<p>Error al conectar con el servidor.</p>';
  }
}

// Ejecutar la función al cargar la página
document.addEventListener('DOMContentLoaded', cargarCitas);
