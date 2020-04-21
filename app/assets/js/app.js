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

let tabs = null;

window.addEventListener("hashchange", loadURLparams);

map.once("locationfound", function(e) {
  document.getElementById("gps-btn").disabled = false;
  document.getElementById("gps-icon").data = "assets/img/gps_fixed-black-18dp.svg";
});

map.on("load", function(e) {
  controls.locateCtrl.start();
  document.querySelector(".leaflet-control-scale").classList.add("scale-transition");
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
  const instances = M.Modal.init(elems, {
    onOpenEnd: function(modal, trigger) { // Callback for Modal open. Modal and trigger parameters available.
      if (modal.id == "about-modal" && !tabs) {
        tabs = M.Tabs.init(document.querySelectorAll(".tabs"), {swipeable: true});
      }
    }
  });
});

document.getElementById("fab-btn").addEventListener("click", function() {
  const scale = document.querySelector(".leaflet-control-scale");
  if (this.classList.contains("active")) {
    scale.classList.remove("scale-out")
  } else {
    scale.classList.add("scale-out");
  }
});

map.fitWorld();

function zoomToLayer() {
  map.fitBounds(layers.overlay._bounds);
}

function setMapBounds() {
  map.setMaxBounds(layers.overlay._bounds);
}

function zoomToLocation() {
  const loc = controls.locateCtrl._circle ? controls.locateCtrl._circle.getLatLng() : null;
  const bounds = layers.overlay._bounds;
  if (loc && bounds.contains(loc)) {
    map.setView(loc); 
  } else {
    M.toast({html: "Your current location is not on the map!", displayLength: 2000});
  }
}

function shareLink() {
  if (navigator.share) {
    navigator.share({
      title: "On The Map",
      text: document.getElementById("title").innerHTML,
      url: window.location.href
    }).then(() => {
      console.log("Thanks for sharing!");
    })
    .catch(err => {
      console.log(`Couldn't share because of`, err.message);
    });
  } else {
    console.log("web share not supported");
  }
}

function loadURLparams() {
  if (window.location.hash) {
    const id = window.location.hash.replace("#", "");
    const url = window.location.origin + window.location.pathname + "maps/" + id + ".json";
    checkCache(url);
  }
}

function checkCache(url) {
  caches.open("cached-maps").then(cache => {
    cache.match(url).then(function(match) {
      if (match) {
        loadMap(url);
      } else {
        cache.add(url).then(function() { 
          loadMap(url);
        });
      }
    });
  });
}

function loadMap(url) {
  layers.overlay = L.tileLayer.base64(url, {
    tms: true,
    updateWhenIdle: false
  }).once("loaded", function(e) {
    zoomToLayer();
    setMapBounds();
    setTitle();
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

function formatName(str) {
  str = str.split("_");
  for (var i = 0, x = str.length; i < x; i++) {
    str[i] = str[i][0].toUpperCase() + str[i].substr(1);
  }
  return str.join(" ");
}

function setTitle() {
  let name = window.location.hash.replace("#", "");
  if (name.includes("/")) {
    name = name.substring(
      name.lastIndexOf("/") + 1, 
      name.length
    );
  }
  document.getElementById("title").innerHTML = formatName(name);
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
  let table = `<table class="centered"><thead>
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
        const name = url.substring(
          url.lastIndexOf("/") + 1, 
          url.lastIndexOf(".json")
        );
        table += `
          <tr>
            <td>
              <a href="#${id}" onclick="M.Modal.getInstance(document.getElementById('maps-modal')).close()">${formatName(name)}</a>
            </td>
            <td>${date.toLocaleDateString()}</td>
            <td>${formatBytes(size, 1)}</td>
            <td>
              <a class="btn-floating waves-effect waves-light grey darken-3" onclick="updateMap('${url}');">
                <object class="fab-icon-small" data="assets/img/update-white-18dp.svg"></object>
              </a>
              <!--<a class="btn-small waves-effect waves-light blue" onclick="updateMap('${url}');">Update</a>-->
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