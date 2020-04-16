importScripts('assets/vendor/workbox-v5.1.2/workbox-sw.js');

workbox.setConfig({
  debug: false,
  modulePathPrefix: 'assets/vendor/workbox-v5.1.2/'
});

workbox.precaching.precacheAndRoute([
  {url: 'index.html', revision: '04.15.2020.3'},
  {url: './', revision: '04.15.2020.3'},
  {url: 'manifest.json', revision: '04.09.2020.1'},
  {url: 'assets/img/apple-touch-icon.png', revision: '04.09.2020.1'},
  {url: 'assets/img/favicon-32x32.png', revision: '04.09.2020.1'},
  {url: 'assets/img/favicon-16x16.png', revision: '04.09.2020.1'},
  {url: 'assets/img/favicon-512x512.png', revision: '04.09.2020.1'},
  {url: 'assets/img/favicon-192x192.png', revision: '04.09.2020.1'},
  {url: 'assets/img/gps_not_fixed-black-18dp.svg', revision: '04.09.2020.1'},
  {url: 'assets/img/gps_fixed-black-18dp.svg', revision: '04.09.2020.1'},
  {url: 'assets/img/more_horiz-black-18dp.svg', revision: '04.09.2020.1'},
  {url: 'assets/img/settings-white-18dp.svg', revision: '04.15.2020.1'},
  {url: 'assets/img/share-white-18dp.svg', revision: '04.09.2020.1'},
  {url: 'assets/img/zoom_out_map-white-18dp.svg', revision: '04.09.2020.1'},
  {url: 'assets/img/update-white-18dp.svg', revision: '04.15.2020.1'},
  {url: 'assets/img/delete-white-18dp.svg', revision: '04.15.2020.1'},
  {url: 'assets/vendor/leaflet-1.6.0/images/layers.png', revision: '04.09.2020.1'},
  {url: 'assets/vendor/leaflet-1.6.0/images/layers-2x.png', revision: '04.09.2020.1'},
  {url: 'assets/vendor/leaflet-1.6.0/images/marker-icon.png', revision: '04.09.2020.1'},
  {url: 'assets/vendor/leaflet-1.6.0/images/marker-icon-2x.png', revision: '04.09.2020.1'},
  {url: 'assets/vendor/leaflet-1.6.0/images/marker-shadow.png', revision: '04.09.2020.1'},
  {url: 'assets/vendor/leaflet-1.6.0/leaflet.css', revision: '04.09.2020.1'},
  {url: 'assets/vendor/leaflet-1.6.0/leaflet.js', revision: '04.09.2020.1'},
  {url: 'assets/vendor/leaflet-locatecontrol-0.70.0/L.Control.Locate.min.css', revision: '04.09.2020.1'},
  {url: 'assets/vendor/leaflet-locatecontrol-0.70.0/L.Control.Locate.min.js', revision: '04.09.2020.1'},
  {url: 'assets/vendor/Leaflet.TileLayer.Base64/Leaflet.TileLayer.Base64.js', revision: '04.09.2020.1'},
  {url: 'assets/vendor/materialize-1.0.0/css/materialize.min.css', revision: '04.09.2020.1'},
  {url: 'assets/vendor/materialize-1.0.0/js/materialize.min.js', revision: '04.09.2020.1'},
  {url: 'assets/css/app.css', revision: '04.15.2020.3'},
  {url: 'assets/js/app.js', revision: '04.15.2020.3'}
]);

workbox.routing.registerRoute(
  new RegExp('/maps/'),
  new workbox.strategies.CacheFirst({
    cacheName: 'cached-maps'
  })
);