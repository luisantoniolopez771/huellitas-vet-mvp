let allCitas = [];
let currentDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selectedDateKey = null; // Formato YYYY-MM-DD

const monthNames = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
];

document.addEventListener("DOMContentLoaded", () => {
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");

  if (btnPrev) {
    btnPrev.addEventListener("click", () => {
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      renderCalendar();
    });
  }

  if (btnNext) {
    btnNext.addEventListener("click", () => {
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      renderCalendar();
    });
  }

  fetchCitas();
});

async function fetchCitas() {
  const listContainer = document.getElementById("citasList");
  if (listContainer) {
    listContainer.innerHTML = '<p class="empty-msg">Cargando citas...</p>';
  }

  try {
    const res = await fetch('/api/citas');
    if (!res.ok) {
      throw new Error(`Respuesta de error del servidor: ${res.status}`);
    }
    const data = await res.json();
    allCitas = Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Error al obtener citas:", err);
    allCitas = [];
    if (listContainer) {
      listContainer.innerHTML = '<p class="empty-msg">No se pudieron cargar las citas del servidor.</p>';
    }
  } finally {
    renderCalendar();
  }
}

function parseDateSafe(raw) {
  if (!raw) return null;
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d;
  const isoCandidate = String(raw).replace(' ', 'T');
  const dIso = new Date(isoCandidate);
  if (!isNaN(dIso.getTime())) return dIso;
  return null;
}

function formatDateKey(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function renderCalendar() {
  const monthYearText = document.getElementById("monthYearText");
  const daysGrid = document.getElementById("daysGrid");

  if (!monthYearText || !daysGrid) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Actualizar título de Mes y Año
  monthYearText.textContent = `${monthNames[month]} de ${year}`;
  daysGrid.innerHTML = "";

  const firstDay = new Date(year, month, 1).getDay(); // 0 = Domingo, 1 = Lunes, etc.
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Mapear citas por fecha en formato 'YYYY-MM-DD'
  const citasByDate = {};
  allCitas.forEach(cita => {
    const rawDate = cita.FECHA_HORA || cita.fecha_hora;
    const dateObj = parseDateSafe(rawDate);
    if (dateObj) {
      const dateKey = formatDateKey(dateObj);
      if (!citasByDate[dateKey]) citasByDate[dateKey] = [];
      citasByDate[dateKey].push(cita);
    }
  });

  // Días del mes anterior para rellenar
  for (let i = firstDay - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const cell = createDayCell(dayNum, true);
    daysGrid.appendChild(cell);
  }

  // Días del mes actual
  const todayStr = formatDateKey(new Date());
  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(year, month, day);
    const dateKey = formatDateKey(cellDate);

    const cell = createDayCell(day, false);

    if (dateKey === todayStr) {
      cell.classList.add("today");
    }

    if (citasByDate[dateKey] && citasByDate[dateKey].length > 0) {
      cell.classList.add("has-cita");
      cell.title = `${citasByDate[dateKey].length} cita(s) programada(s)`;
    }

    if (selectedDateKey === dateKey) {
      cell.classList.add("selected");
    }

    cell.addEventListener("click", () => {
      selectedDateKey = dateKey;
      renderCalendar();
      renderCitasDetail(dateKey, cellDate, citasByDate[dateKey] || []);
    });

    daysGrid.appendChild(cell);
  }

  // Días del mes siguiente para completar la última semana
  const totalCells = daysGrid.children.length;
  const remainingCells = (7 - (totalCells % 7)) % 7;
  for (let i = 1; i <= remainingCells; i++) {
    const cell = createDayCell(i, true);
    daysGrid.appendChild(cell);
  }

  // Si hay una fecha seleccionada, renderizar sus detalles
  if (selectedDateKey) {
    const [sYear, sMonth, sDay] = selectedDateKey.split("-").map(Number);
    const sDate = new Date(sYear, sMonth - 1, sDay);
    renderCitasDetail(selectedDateKey, sDate, citasByDate[selectedDateKey] || []);
  } else {
    // Seleccionar hoy por defecto
    selectedDateKey = todayStr;
    const todayCitas = citasByDate[todayStr] || [];
    renderCitasDetail(todayStr, new Date(), todayCitas);
  }
}

function createDayCell(dayNumber, isOtherMonth) {
  const div = document.createElement("div");
  div.classList.add("day-cell");
  if (isOtherMonth) div.classList.add("other-month");
  div.textContent = dayNumber;
  return div;
}

// ==========================================
// FUNCIÓN CORREGIDA: Dibuja las citas y los botones
// ==========================================
function renderCitasDetail(dateKey, dateObj, citas) {
  const selectedDateTitle = document.getElementById("selectedDateTitle");
  const listContainer = document.getElementById("citasList");

  if (!selectedDateTitle || !listContainer) return;

  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const dateFormatted = dateObj.toLocaleDateString('es-ES', options);

  selectedDateTitle.textContent = `Citas del ${dateFormatted}`;
  listContainer.innerHTML = "";

  if (citas.length === 0) {
    listContainer.innerHTML = '<p class="empty-msg">No hay citas programadas para este día.</p>';
    return;
  }

  citas.forEach(cita => {
    const rawDate = cita.FECHA_HORA || cita.fecha_hora;
    const dateObj = parseDateSafe(rawDate);
    const timeStr = dateObj
      ? dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      : "--:--";

    const mascota = cita.MASCOTA || cita.mascota || "Sin nombre";
    const dueno = cita.DUENO || cita.dueno || "Sin dueño";
    
    // Capturar el ID de la base de datos (Soporta Oracle en mayúsculas o minúsculas)
    const idCita = cita.ID || cita.id;

    const card = document.createElement("div");
    card.classList.add("cita-card");
    // Le asignamos el ID al HTML para que la función de Borrar lo pueda desaparecer
    card.id = `cita-${idCita}`; 

    card.innerHTML = `
      <div class="cita-info">
        <h4>🐾 ${mascota}</h4>
        <p><strong>⏰ Hora:</strong> ${timeStr} | 👤 <strong>Dueño:</strong> ${dueno}</p>
      </div>
      
      <hr>
      
      <div class="cita-actions">
        <!-- BOTÓN MODIFICAR -->
        <div class="reprogramar-group">
          <label for="nueva-fecha-${idCita}">Nuevo horario:</label>
          <input type="datetime-local" id="nueva-fecha-${idCita}">
          <button onclick="reprogramarCita(${idCita})" class="btn-secondary">Modificar (Reprogramar)</button>
        </div>
        
        <!-- BOTÓN BORRAR -->
        <button onclick="cancelarCita(${idCita})" class="btn-danger">Borrar (Cancelar)</button>
      </div>
    `;
    
    listContainer.appendChild(card);
  });
}