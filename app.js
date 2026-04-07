const form = document.getElementById("form");
const lista = document.getElementById("lista");
const wallpaperInput = document.getElementById("wallpaper");
const resetWallpaperBtn = document.getElementById("resetWallpaper");
const notificationBtn = document.getElementById("notificationBtn");
const calendarBtn = document.getElementById("calendarBtn");
const calendarModal = document.getElementById("calendarModal");
const closeCalendarBtn = document.getElementById("closeCalendar");
const calendarView = document.getElementById("calendarView");
const h1 = document.querySelector("h1");

let medicamentos = JSON.parse(localStorage.getItem("medicamentos")) || [];
let currentThemeColor = "#2196f3";
let notificationTimeouts = []; // Para almacenar los timeouts de notificaciones

// Colores predeterminados de tema
const defaultTheme = {
  primary: "#2196f3",
  secondary: "#1976d2",
  accent: "#4caf50",
  text: "#333"
};

// Cargar fondo guardado al iniciar
function loadWallpaper() {
  const savedWallpaper = localStorage.getItem("appWallpaper");
  if (savedWallpaper) {
    document.body.style.backgroundImage = `url(${savedWallpaper})`;
    detectDominantColor(savedWallpaper);
  }
}

// Detectar color dominante y ajustar tema
function detectDominantColor(imageUrl) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = function() {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let r = 0, g = 0, b = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }
      
      r = Math.floor(r / (data.length / 4));
      g = Math.floor(g / (data.length / 4));
      b = Math.floor(b / (data.length / 4));
      
      // Determinar si el fondo es claro u oscuro
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      const isLight = brightness > 128;
      
      // Calcular color de tema basado en el color dominante
      const themeColor = rgbToHex(r, g, b);
      applyTheme(themeColor, isLight);
    } catch (e) {
      console.error("Error detectando color:", e);
      resetTheme();
    }
  };
  img.onerror = () => resetTheme();
  img.src = imageUrl;
}

// Convertir RGB a Hex
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("").toUpperCase();
}

// Aplicar tema a la interfaz
function applyTheme(color, isLight) {
  const root = document.documentElement;
  currentThemeColor = color;
  
  // Ajustar color del título
  h1.style.color = isLight ? "#000" : "#fff";
  h1.style.textShadow = isLight ? "none" : "0 2px 4px rgba(0,0,0,0.3)";
  
  // Actualizar colores de botones y elementos
  const style = document.createElement("style");
  style.id = "theme-style";
  
  // Remover estilo previo si existe
  const oldStyle = document.getElementById("theme-style");
  if (oldStyle) oldStyle.remove();
  
  style.textContent = `
    button:not(.delete-btn):not(.close-btn):not(.reset-btn) {
      background: linear-gradient(135deg, ${color} 0%, ${shadeColor(color, -20)} 100%) !important;
    }
    
    button:not(.delete-btn):not(.close-btn):not(.reset-btn):hover {
      box-shadow: 0 6px 20px ${color}40 !important;
    }
    
    input:focus {
      border-color: ${color} !important;
      box-shadow: 0 4px 12px ${color}30 !important;
    }
    
    .calendar-day {
      border-left-color: ${color} !important;
    }
    
    .calendar-day-header {
      color: ${color} !important;
    }
  `;
  
  document.head.appendChild(style);
}

// Oscurecer color
function shadeColor(color, percent) {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
}

// Resetear tema a predeterminado
function resetTheme() {
  h1.style.color = "#333";
  h1.style.textShadow = "none";
  const oldStyle = document.getElementById("theme-style");
  if (oldStyle) oldStyle.remove();
}

// Manejar carga de imagen de fondo
wallpaperInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target.result;
      document.body.style.backgroundImage = `url(${imageData})`;
      localStorage.setItem("appWallpaper", imageData);
      detectDominantColor(imageData);
    };
    reader.readAsDataURL(file);
  }
});

// Resetear fondo a gradiente predeterminado
resetWallpaperBtn.addEventListener("click", () => {
  document.body.style.backgroundImage = "none";
  localStorage.removeItem("appWallpaper");
  wallpaperInput.value = "";
  resetTheme();
});

function render() {
  lista.innerHTML = "";
  medicamentos.forEach((med, i) => {
    const li = document.createElement("li");
    li.className = "med-item";
    
    const textSpan = document.createElement("span");
    textSpan.className = "med-text";
    const fecha = new Date(med.fecha).toLocaleDateString("es-ES");
    const metodo = med.metodo || "Oral"; // Default for old entries
    textSpan.innerText = `${med.nombre} - ${med.dosis} (${metodo})\n${fecha} a las ${med.hora}`;
    
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerText = "✕";
    deleteBtn.type = "button";
    deleteBtn.addEventListener("click", () => deleteMedicamento(i));
    
    li.appendChild(textSpan);
    li.appendChild(deleteBtn);
    lista.appendChild(li);
  });
}

// Eliminar medicamento
function deleteMedicamento(index) {
  medicamentos.splice(index, 1);
  localStorage.setItem("medicamentos", JSON.stringify(medicamentos));
  render();
  scheduleNotifications();
}

// Mostrar calendario
function showCalendar() {
  calendarView.innerHTML = "";
  
  if (medicamentos.length === 0) {
    calendarView.innerHTML = "<p class='calendar-empty'>No hay medicamentos registrados</p>";
    calendarModal.classList.add("active");
    return;
  }
  
  // Agrupar medicamentos por fecha
  const medicamentosPorFecha = {};
  medicamentos.forEach(med => {
    if (!medicamentosPorFecha[med.fecha]) {
      medicamentosPorFecha[med.fecha] = [];
    }
    medicamentosPorFecha[med.fecha].push(med);
  });
  
  // Ordenar fechas
  const fechasOrdenadas = Object.keys(medicamentosPorFecha).sort();
  
  fechasOrdenadas.forEach(fecha => {
    const div = document.createElement("div");
    div.className = "calendar-day";
    
    const fechaFormato = new Date(fecha).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    
    const headerDiv = document.createElement("div");
    headerDiv.className = "calendar-day-header";
    headerDiv.innerText = fechaFormato.charAt(0).toUpperCase() + fechaFormato.slice(1);
    
    const ul = document.createElement("ul");
    ul.className = "calendar-meds-list";
    
    medicamentosPorFecha[fecha].forEach(med => {
      const li = document.createElement("li");
      li.className = "calendar-med-item";
      const metodo = med.metodo || "Oral";
      li.innerHTML = `<div class="calendar-med-time">${med.hora}</div><div class="calendar-med-name">${med.nombre} - ${med.dosis} (${metodo})</div>`;
      ul.appendChild(li);
    });
    
    div.appendChild(headerDiv);
    div.appendChild(ul);
    calendarView.appendChild(div);
  });
  
  calendarModal.classList.add("active");
}

// Eventos del calendario
calendarBtn.addEventListener("click", showCalendar);
closeCalendarBtn.addEventListener("click", () => {
  calendarModal.classList.remove("active");
});

// Cerrar modal al hacer clic afuera
calendarModal.addEventListener("click", (e) => {
  if (e.target === calendarModal) {
    calendarModal.classList.remove("active");
  }
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value;
  const dosis = document.getElementById("dosis").value;
  const metodo = document.getElementById("metodo").value;
  const fecha = document.getElementById("fecha").value;
  const hora = document.getElementById("hora").value;

  medicamentos.push({ nombre, dosis, metodo, fecha, hora });

  localStorage.setItem("medicamentos", JSON.stringify(medicamentos));

  form.reset();
  render();
  scheduleNotifications();
});

// Actualizar visibilidad del botón de notificaciones
function updateNotificationButtonVisibility() {
  if ("Notification" in window && Notification.permission === "default") {
    notificationBtn.style.display = "flex";
  } else {
    notificationBtn.style.display = "none";
  }
}

// Solicitar permiso para notificaciones
async function requestNotificationPermission() {
  if ("Notification" in window) {
    const permission = await Notification.requestPermission();
    updateNotificationButtonVisibility();
    if (permission === "granted") {
      console.log("Permiso para notificaciones concedido");
      return true;
    } else {
      console.log("Permiso para notificaciones denegado");
      return false;
    }
  }
  return false;
}

// Event listener para botón de notificaciones
notificationBtn.addEventListener("click", () => {
  requestNotificationPermission().then(() => {
    scheduleNotifications();
  });
});

// Programar notificaciones para medicamentos
function scheduleNotifications() {
  // Limpiar timeouts anteriores (para cuando la app está abierta)
  notificationTimeouts.forEach(timeout => clearTimeout(timeout));
  notificationTimeouts = [];

  const now = new Date();
  medicamentos.forEach((med, index) => {
    const medDateTime = new Date(`${med.fecha}T${med.hora}`);
    const timeDiff = medDateTime - now;

    if (timeDiff > 0) {
      const timeout = setTimeout(() => {
        showNotification(med);
      }, timeDiff);
      notificationTimeouts.push(timeout);
    }
  });
  
  // Sincronizar con Service Worker para background
  syncMedicamentosToServiceWorker();
}

// Sincronizar medicamentos con Service Worker para notificaciones en background
function syncMedicamentosToServiceWorker() {
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "SYNC_MEDICATIONS",
      medicamentos: medicamentos
    });
  }
}

// Mostrar notificación
function showNotification(med) {
  if ("Notification" in window && Notification.permission === "granted") {
    const title = "💊 Recordatorio de Medicamento";
    const metodo = med.metodo || "Oral";
    const body = `${med.nombre} ${med.dosis} (${metodo})`;

    const options = {
      body: body,
      icon: "./icon.png",
      badge: "./icon.png",
      vibrate: [200, 100, 200],
      tag: `med-${med.nombre}-${med.fecha}-${med.hora}`,
      requireInteraction: true,
      data: {
        medicamento: med.nombre,
        dosis: med.dosis,
        metodo: metodo
      }
    };

    try {
      new Notification(title, options);
      console.log("Notificación mostrada:", title);
    } catch (e) {
      console.error("Error mostrando notificación:", e);
    }
  }
}

// Registrar Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js").then(reg => {
    console.log("Service Worker registrado");
    // Verificar medicamentos inmediatamente
    if (reg.active) {
      reg.active.postMessage({
        type: "SYNC_MEDICATIONS",
        medicamentos: medicamentos
      });
    }
  }).catch(err => console.error("Error registrando SW:", err));
}

// Cargar datos al iniciar
loadWallpaper();
render();
updateNotificationButtonVisibility();
scheduleNotifications();

// Verificar medicamentos cada minuto cuando la app está abierta
setInterval(() => {
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "CHECK_MEDICATIONS"
    });
  }
}, 60000); // Cada minuto

// Verificar también cuando la app vuelve a estar activa
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    scheduleNotifications();
  }
});


// Mostrar notificación
function showNotification(med) {
  if ("Notification" in window && Notification.permission === "granted") {
    const title = "Recordatorio de Medicamento";
    const metodo = med.metodo || "Oral";
    const body = `Es hora de tomar: ${med.nombre} - ${med.dosis} (${metodo})`;

    const options = {
      body: body,
      icon: "/icon.png",
      badge: "/icon.png",
      vibrate: [200, 100, 200],
      tag: `med-${med.nombre}-${med.fecha}-${med.hora}` // Evita duplicados
    };

    new Notification(title, options);
  }
}

// Registrar Service Worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js");
}

// Cargar datos al iniciar
loadWallpaper();
render();
updateNotificationButtonVisibility();
scheduleNotifications();