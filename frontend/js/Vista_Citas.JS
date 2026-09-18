// ==========================================
// 1. MANEJO DEL FORMULARIO DE NUEVA CITA
// ==========================================
document.getElementById('form-cita').addEventListener('submit', async (e) => {
  e.preventDefault(); 

  const dueno = document.getElementById('nombre_dueno').value;
  const mascota = document.getElementById('nombre_mascota').value;
  const fechaHora = document.getElementById('fecha_hora').value;
  const divMensaje = document.getElementById('mensaje-resultado');

  try {
    // CAMBIO AQUÍ: Ruta relativa
    const respuesta = await fetch('/api/citas', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dueno, mascota, fechaHora })
    });
    
    const datos = await respuesta.json();
    
    if (respuesta.ok) {
      divMensaje.innerHTML = `<p style="color: green;">✅ ${datos.mensaje}</p>`;
      document.getElementById('form-cita').reset(); 
      setTimeout(() => location.reload(), 1500);
    } else {
      divMensaje.innerHTML = `<p style="color: red;">❌ ${datos.error}</p>`;
    }
  } catch (error) {
    divMensaje.innerHTML = `<p style="color: red;">Error al conectar con el servidor.</p>`;
  }
});

// ==========================================
// 2. LÓGICA PARA CANCELAR Y REPROGRAMAR (GLOBAL)
// ==========================================

// Lógica para Cancelar
window.cancelarCita = async function(idCita) {
    if (idCita === undefined || idCita === 'undefined') {
        alert("Error: El ID de la cita no se está leyendo bien de la base de datos.");
        return;
    }

    const confirmar = confirm("¿Estás seguro de que deseas cancelar esta cita?");
    if (!confirmar) return;

    try {
        // CAMBIO AQUÍ: Ruta relativa
        const response = await fetch(`/api/citas/${idCita}/cancelar`, {
            method: 'POST'
        });

        if (response.ok) {
            document.getElementById(`cita-${idCita}`).remove();
            alert("Cita cancelada con éxito"); // Agregamos un aviso para que el usuario sepa
        } else {
            alert("Hubo un error al cancelar la cita en el servidor.");
        }
    } catch (error) {
        console.error("Error de conexión:", error);
    }
};

// Lógica para Reprogramar
window.reprogramarCita = async function(idCita) {
    if (idCita === undefined || idCita === 'undefined') {
        alert("Error: El ID de la cita no se está leyendo bien de la base de datos.");
        return;
    }

    const nuevaFechaInput = document.getElementById(`nueva-fecha-${idCita}`).value;
    
    if (!nuevaFechaInput) {
        alert("Por favor, selecciona una nueva fecha y hora antes de hacer clic en Modificar.");
        return;
    }

    try {
        // CAMBIO AQUÍ: Ruta relativa
        const response = await fetch(`/api/citas/${idCita}/reprogramar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nueva_fecha_hora: nuevaFechaInput })
        });

        const data = await response.json();

        if (response.status === 409) {
            alert(data.error); 
        } else if (response.ok) {
            alert("Cita reprogramada con éxito.");
            location.reload(); 
        } else {
            alert("Ocurrió un error en el servidor.");
        }
    } catch (error) {
        console.error("Error de conexión:", error);
    }
};