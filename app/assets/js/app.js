const map = L.map("map", {
  zoomSnap: 0,
  maxZoom: 22,
  zoomControl: false
});
map.attributionControl.setPrefix(null);

const layers = {
  basemaps: {
    "Streets": L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.@2xpng", {
      maxNativeZoom: 18,
      maxZoom: map.getMaxZoom(),
      attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, © <a href="https://carto.com/attribution">CARTO</a>',
    })/*.addTo(map)*/,
    "None": L.tileLayer("", {
      maxZoom: map.getMaxZoom()
    })
  }
};

const controls = {
  layerCtrl: L.control.layers(layers.basemaps, null, {
    collapsed: true,
    position: "topright"
  })/*.addTo(map)*/,

  locateCtrl: L.control.locate({
    icon: "gps_fixed",
    setView: false,
    cacheLocation: true,
    position: "topleft",
    flyTo: false,
    keepCurrentZoomLevel: false,
    circleStyle: {
      interactive: false
    },
    markerStyle: {
      interactive: true
    },
    metric: false,
    strings: {
      popup: function(options) {
        return `You are within ${options.distance} ${options.unit} from ${controls.locateCtrl._circle.getLatLng().lat.toFixed(6)},${controls.locateCtrl._circle.getLatLng().lng.toFixed(6)}`;
      }
    },
    locateOptions: {
      enableHighAccuracy: true,
      maxZoom: 18
    },
    onLocationError: function(e) {
      document.getElementById("gps-icon").data = "assets/img/gps_not_fixed-black-18dp.svg";
      alert(e.message);
    }
  }).addTo(map),

  scaleCtrl: L.control.scale({
    position: "bottomleft"
  }).addTo(map)
};

window.addEventListener("hashchange", loadURLparams);

map.once("locationfound", function(e) {
  document.getElementById("gps-btn").disabled = false;
  document.getElementById("gps-icon").data = "assets/img/gps_fixed-black-18dp.svg";
});

map.on("load", function(e) {
  controls.locateCtrl.start();
  loadURLparams();
});

document.addEventListener("DOMContentLoaded", function() {
  const elems = document.querySelectorAll(".fixed-action-btn");
  const instances = M.FloatingActionButton.init(elems, {
    direction: "left",
    hoverEnabled: false
  });
});

document.addEventListener("DOMContentLoaded", function() {
  const elems = document.querySelectorAll(".modal");
  const instances = M.Modal.init(elems, {});
});

map.fitWorld();

function zoomToLayer() {
  map.fitBounds(layers.overlay._bounds);
}

function setMapBounds() {
  map.setMaxBounds(layers.overlay._bounds);
}

function zoomToLocation() {
  const loc = controls.locateCtrl._circle.getLatLng();
  const bounds = layers.overlay._bounds;
  if (loc && bounds.contains(loc)) {
    map.setView(loc); 
  } else {
    alert("Your location is not on the map!");
  }
}

function shareLink() {
  if (navigator.share) {
    navigator.share({
      title: "OTM",
      text: "On The Map",
      url: window.location.href
    }).then(() => {
      console.log('Thanks for sharing!');
    })
    .catch(err => {
      console.log(`Couldn't share because of`, err.message);
    });
  } else {
    console.log('web share not supported');
  }
}

function loadURLparams() {
  if (window.location.hash) {
    const id = window.location.hash.replace("#", "");
    const url = window.location.origin + window.location.pathname + "maps/" + id + ".json";
    loadMap(url);
  }
}

function loadMap(url) {
  layers.overlay = L.tileLayer.base64(url, {
    tms: true,
    updateWhenIdle: false
  }).once("loaded", function(e) {
    zoomToLayer();
    setMapBounds();
    listMaps();
  }).addTo(map);
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/*
function checkUpdates(prompt) {
  const url = layers.overlay._url;
  caches.open("cached-maps").then(cache => {
    cache.match(url).then(response => {
      if (response) {
        const cachedTimestamp = new Date(response.headers.get("date"));
        console.log(`This map was downloaded at ${cachedTimestamp.toLocaleString()}`);
        // if (Date.now() > cachedTimestamp.getTime() + 1000 * 60 * 60 * 6) { // 6 hours
        if (Date.now() > cachedTimestamp.getTime() + 1000 * 60 * 20) { // 20 minutes
          document.querySelector(".fab-alert").classList.remove("mui--hide");
          if (prompt) {
            const cfm = confirm(`This map was saved on ${cachedTimestamp.toDateString()} at ${cachedTimestamp.toLocaleTimeString()}. Would you like to check for updates?`);
            if (cfm) {
              cache.delete(url).then(function(response) {
                loadMap(url);
                document.querySelector(".fab-alert").classList.add("mui--hide");
                alert("Map successfully updated and saved!");
              });
            }
          }
        }
      }
    })
  })
}
*/

function listMaps() {
  let table = `<table><thead>
    <tr>
      <th>Map</th>
      <th>Date</th>
      <th>Size</th>
      <th>Update</th>
    </tr>
  </thead>
  <tbody>`;
  caches.open("cached-maps").then(cache => {
    cache.matchAll().then(response => {
      response.forEach(element => {
        const date = new Date(element.headers.get("Date"));
        const size = element.headers.get("Content-Length");
        const url = element.url;
        const id = url.substring(
          url.lastIndexOf("maps/") + 5, 
          url.lastIndexOf(".json")
        );
        table += `
          <tr>
            <td>
              <a href="#${id}" onclick="M.Modal.getInstance(document.getElementById('maps-modal')).close()">${id.toUpperCase().replace("_", " ")}</a>
            </td>
            <td>${date.toLocaleDateString()}</td>
            <td>${formatBytes(size, 1)}</td>
            <td>
              <a class="btn-floating waves-effect waves-light blue" onclick="updateMap('${url}');">
                <object class="fab-icon-small" data="assets/img/update-white-18dp.svg"></object>
              </a>
              <!--<a class="btn-floating waves-effect waves-light red" onclick="deleteMap();">
                <object class="fab-icon-small" data="assets/img/delete-white-18dp.svg"></object>
              </a>-->
            </td>
          </tr>
        `;
      });
      table += `</tbody></table>`;
      return table;
    }).then(table => {
      document.getElementById("map-list-container").innerHTML = table;
    });
  });
}

function updateMap(url) {
  if (navigator.onLine) {
    caches.open("cached-maps").then(cache => {
      cache.match(url).then(response => {
        if (response) {
          const cfm = confirm("Update this map?");
          if (cfm) {
            cache.delete(url).then(function(response) {
              cache.add(url).then(function() {
                loadMap(url);
                listMaps();
              });
              M.toast({html: "Map successfully updated and saved!"});
            });
          }
        }
      })
    })
  } else {
    M.toast({html: "Cannot update map while offline!"});
  }
}