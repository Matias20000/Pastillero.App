self.addEventListener("install", (e) => {
  console.log("Service Worker instalado");
});

self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "Recordatorio de Medicamento";
  const body = data.body || "Es hora de tomar tu medicamento";
  const icon = "/icon.png";

  const options = {
    body: body,
    icon: icon,
    badge: "/icon.png",
    vibrate: [200, 100, 200],
    data: data
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow("/")
  );
});