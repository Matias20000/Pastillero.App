const STORAGE_KEY = "medicamentos";

self.addEventListener("install", (e) => {
  console.log("Service Worker instalado");
  e.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (e) => {
  console.log("Service Worker activado");
  e.waitUntil(self.clients.claim());
});

// Recibir mensajes desde la app
self.addEventListener("message", (event) => {
  if (event.data.type === "SYNC_MEDICATIONS") {
    // Guardar medicamentos para verificación en background
    self.medicamentos = event.data.medicamentos || [];
    console.log("✓ Medicamentos sincronizados en SW:", self.medicamentos.length);
  }
  
  if (event.data.type === "CHECK_MEDICATIONS") {
    checkAndNotify();
  }
});

// Función para verificar cada minuto
function checkAndNotify() {
  if (!self.medicamentos || self.medicamentos.length === 0) {
    return;
  }
  
  const now = new Date();
  const currentTime = String(now.getHours()).padStart(2, '0') + ':' + 
                     String(now.getMinutes()).padStart(2, '0');
  const currentDate = now.toISOString().split('T')[0];
  
  self.medicamentos.forEach(med => {
    // Si es exactamente la hora, mostrar notificación
    if (med.fecha === currentDate && med.hora === currentTime) {
      showNotificationForMed(med);
    }
  });
}

function showNotificationForMed(med) {
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
    data: med
  };
  
  self.registration.showNotification(title, options);
}

// Verificar cada 30 segundos en background
setInterval(checkAndNotify, 30000);

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Recordatorio de Medicamento";
  const body = data.body || "Es hora de tomar tu medicamento";

  const options = {
    body: body,
    icon: "./icon.png",
    badge: "./icon.png",
    vibrate: [200, 100, 200],
    tag: "med-reminder",
    requireInteraction: true,
    data: data
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (let client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('./');
      }
    })
  );
});