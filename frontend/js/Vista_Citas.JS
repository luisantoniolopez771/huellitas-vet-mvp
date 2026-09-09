async function cargarCitas() {
    const contenedor = document.getElementById('lista-citas');
    try {
        const response = await fetch('/api/citas');
        const citas = await response.json();

        if (!citas || citas.length === 0) {
            contenedor.innerHTML = '<div class="alerta-vacia">No hay citas programadas para hoy</div>';
            return;
        }

        contenedor.innerHTML = citas.map(cita => `
            <div class="tarjeta-cita">
                <div class="hora">🕒 ${cita.FECHA_HORA || cita.fecha_hora}</div>
                <div class="mascota">🐾 Mascota: <strong>${cita.MASCOTA || cita.mascota}</strong></div>
                <div class="dueno">👤 Dueño: ${cita.DUENO || cita.dueno}</div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error al cargar citas:', error);
        contenedor.innerHTML = '<div class="alerta-vacia">Error al cargar el calendario de citas</div>';
    }
}

document.addEventListener('DOMContentLoaded', cargarCitas);