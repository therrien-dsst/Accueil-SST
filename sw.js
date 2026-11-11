// Service worker « réseau d'abord » pour l'app Accueil SST — Therrien
// Objectif : toujours servir la dernière version en ligne (anti-cache),
// avec repli sur une copie locale uniquement si l'appareil est hors ligne.
const CACHE = 'accueil-sst-v1';

self.addEventListener('install', function(e) {
  // Activer la nouvelle version immédiatement, sans attendre.
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  // Nettoyer les anciens caches et prendre le contrôle des onglets ouverts.
  e.waitUntil(
    caches.keys().then(function(noms) {
      return Promise.all(noms.map(function(n) {
        if (n !== CACHE) { return caches.delete(n); }
      }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  const req = e.request;
  if (req.method !== 'GET') { return; }
  // Réseau d'abord : on va chercher la version fraîche, on met à jour la copie
  // locale, et on ne retombe sur le cache que si le réseau échoue (hors ligne).
  e.respondWith(
    fetch(req).then(function(res) {
      const copie = res.clone();
      caches.open(CACHE).then(function(c) { c.put(req, copie); }).catch(function() {});
      return res;
    }).catch(function() {
      return caches.match(req);
    })
  );
});
