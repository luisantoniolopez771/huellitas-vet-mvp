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

  // Lógica para Cancelar
async function cancelarCita(idCita) {
    const confirmar = confirm("¿Estás seguro de cancelar esta cita?");
    if (!confirmar) return;

    try {
        const response = await fetch(`http://localhost:3000/api/citas/${idCita}/cancelar`, {
            method: 'POST'
        });

        if (response.ok) {
            // Eliminar elemento de la vista (Criterio de Aceptación)
            document.getElementById(`cita-${idCita}`).remove();
        } else {
            alert("Hubo un error al cancelar la cita.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// Lógica para Reprogramar
async function reprogramarCita(idCita) {
    const nuevaFecha = document.getElementById(`nueva-fecha-${idCita}`).value;
    
    if (!nuevaFecha) {
        alert("Por favor selecciona una nueva fecha y hora.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/citas/${idCita}/reprogramar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nueva_fecha_hora: nuevaFecha })
        });

        const data = await response.json();

        if (response.status === 409) {
            // Se encontró un empalme (Validación VH-3)
            alert(data.error);
        } else if (response.ok) {
            alert("Cita reprogramada correctamente.");
            location.reload(); // Recargar para actualizar la vista
        }
    } catch (error) {
        console.error("Error:", error);
    }
}
});