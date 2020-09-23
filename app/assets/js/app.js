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
        const loc = controls.locateCtrl._marker.getLatLng();
        return `<div style="text-align: center;">You are within ${Number(options.distance).toLocaleString()} ${options.unit}<br>from <strong>${loc.lat.toFixed(6)}</strong>, <strong>${loc.lng.toFixed(6)}</strong></div>`;
      }
    },
    locateOptions: {
      enableHighAccuracy: true,
      maxZoom: 18
    },
    onLocationError: function(e) {
      document.getElementById("gps-icon").src = "assets/img/gps_not_fixed-black-18dp.svg";
      alert(e.message);
    }
  }).addTo(map),

  scaleCtrl: L.control.scale({
    position: "bottomleft"
  }).addTo(map)
};

// const fileInput = L.DomUtil.create("input", "hidden");
// fileInput.type = "file";
// fileInput.accept = ".mbtiles";
// fileInput.style.display = "none";

// fileInput.addEventListener("change", function () {
//   const file = fileInput.files[0];
//   const name = file.name.split(".").slice(0, -1).join(".");
//   addFile(file, name);
//   this.value = "";
// }, false);

window.addEventListener("hashchange", loadURLparams);

map.once("locationfound", function(e) {
  document.getElementById("gps-btn").disabled = false;
  document.getElementById("gps-icon").src = "assets/img/gps_fixed-black-18dp.svg";
});

map.on("locationfound", function(e) {
  const accuracy = e.accuracy;
  const coordinates = e.latlng;
  document.getElementById("coordinates").innerHTML = `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`
});

map.on("load", function(e) {
  controls.locateCtrl.start();
  document.querySelector(".leaflet-control-scale").classList.add("scale-transition");
  loadURLparams();
});

document.addEventListener("DOMContentLoaded", function() {
  const fabInstances = M.FloatingActionButton.init(document.querySelectorAll(".fixed-action-btn"), {
    direction: "left",
    hoverEnabled: false
  });
  map.on("click", function(e) {
    fabInstances[0].close();
    document.querySelector(".leaflet-control-scale").classList.remove("scale-out");
  });
  
  M.Modal.init(document.querySelectorAll(".modal"), {});
  M.Collapsible.init(document.querySelectorAll(".collapsible"), {accordion: true});

  if (!window.location.hash) {
    listMaps();
    M.Modal.getInstance(document.getElementById("about-modal")).open();
    M.Collapsible.getInstance(document.getElementById("about-collapsible")).open(1);
  }
});

document.getElementById("fab-btn").addEventListener("click", function() {
  const scale = document.querySelector(".leaflet-control-scale");
  if (this.classList.contains("active")) {
    scale.classList.remove("scale-out");
  } else {
    scale.classList.add("scale-out");
  }
});

map.fitWorld();

function zoomToLayer() {
  map.fitBounds(layers.overlay._bounds);
  // map.fitBounds(layers.overlay.options.bounds);
}

function setMapBounds() {
  map.setMaxBounds(layers.overlay._bounds);
  // map.setMaxBounds(layers.overlay.options.bounds);
}

function zoomToLocation() {
  const loc = controls.locateCtrl._circle ? controls.locateCtrl._circle.getLatLng() : null;
  const bounds = layers.overlay._bounds;
  // const bounds = L.latLngBounds(layers.overlay.options.bounds);
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
      //console.log("Thanks for sharing!");
    })
    .catch(err => {
      console.log(`Couldn't share because of`, err.message);
    });
  } else {
    const el = L.DomUtil.create("textarea", "hidden");
    el.value = window.location.href;
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
    M.toast({html: "Link copied to clipboard!", displayLength: 2000});
  }
}

function copyCoordinates() {
  const copyElement = L.DomUtil.create("textarea", "hidden");
  const coordsElement = document.getElementById("coordinates");
  copyElement.value = coordsElement.innerHTML;
  coordsElement.appendChild(copyElement);
  copyElement.select();
  document.execCommand("copy");
  coordsElement.removeChild(copyElement);
  M.toast({html: "Coordinates copied to clipboard!", displayLength: 2000});
}

function loadURLparams() {
  if (window.location.hash) {
    const id = window.location.hash.replace("#", "");
    const url = window.location.origin + window.location.pathname + "maps/" + id + ".json";
    // const url = window.location.origin + window.location.pathname + "maps/" + id + ".mbtiles";
    // checkCache(url);
    loadMap(url);
  }
}

// function checkCache(url) {
//   caches.open("cached-maps").then(cache => {
//     cache.match(url).then(function(match) {
//       if (match) {
//         loadMap(url);
//       } else {
//         cache.add(url).then(function() { 
//           loadMap(url);
//         });
//       }
//     });
//   });
// }

function loadMap(url, name) {
  if (layers.overlay) {
    layers.overlay.removeFrom(map);
  }
  layers.overlay = L.tileLayer.base64(url, {
    tms: true,
    updateWhenIdle: false
  }).once("loaded", function(e) {
    zoomToLayer();
    setMapBounds();
    setTitle();
    listMaps();
  }).addTo(map);

  // layers.overlay = L.tileLayer.mbTiles(url, {
  //   autoScale: true,
  //   fitBounds: true,
  //   updateWhenIdle: false,
  //   attribution: ""
  // }).on("databaseloaded", function(e) {
  //   setMapBounds();
  //   setTitle(name);
  //   listMaps();
  // }).addTo(map);

  // M.Modal.getInstance(document.getElementById("about-modal")).close();
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

function setTitle(fileName) {
  let name = fileName ? fileName : window.location.hash.replace("#", "");
  if (name.includes("/")) {
    name = name.substring(
      name.lastIndexOf("/") + 1, 
      name.length
    );
  }
  document.getElementById("title").innerHTML = formatName(name);
}

function listMaps() {
  caches.open("cached-maps").then(cache => {
    cache.matchAll().then(response => {
      if (response.length > 0) {
        var collection = "<ul class='collection'>";
        response.forEach(element => {
          const date = new Date(element.headers.get("Date"));
          const size = element.headers.get("Content-Length");
          const url = element.url;
          const id = url.substring(
            url.lastIndexOf("maps/") + 5, 
            url.lastIndexOf(".json")
            // url.lastIndexOf(".mbtiles")
          );
          const name = url.substring(
            url.lastIndexOf("/") + 1, 
            url.lastIndexOf(".json")
            // url.lastIndexOf(".mbtiles")
          );
          collection += `
            <li class="collection-item" oncontextmenu="deleteMap('${url}', '${formatName(name)}'); return false;" style="user-select: none;">
              <div class="row valign-wrapper" style="margin: 0px">
                <div class="col s8">
                  <a href="#${id}" onclick="M.Modal.getInstance(document.getElementById('about-modal')).close()">${formatName(name)}</a><br>
                  ${date.toLocaleDateString()}, ${formatBytes(size, 1)}
                </div>
                <div class="col s4 right-align">
                  <a class="btn-small waves-effect waves-light blue" onclick="updateMap('${url}', '${formatName(name)}');">Update</a>
                </div>
              </div>
            </li>`;
        });
        collection += "</ul>";
      } else {
        var collection = `<div style="padding: 1.2em;">No maps available. You may need to reload to see saved maps...</div>`;
      }
      
      return {
        list: collection,
        count: response.length
      };
    }).then(maps => {
      document.getElementById("map-list-container").innerHTML = maps.list;
      return maps.count;
    });
  });
}

function updateMap(url, name) {
  if (navigator.onLine) {
    caches.open("cached-maps").then(cache => {
      cache.match(url).then(response => {
        if (response) {
          const cfm = confirm(`Update ${name}?`);
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

function deleteMap(url, name) {
  caches.open("cached-maps").then(cache => {
    cache.match(url).then(response => {
      if (response) {
        const cfm = confirm(`Delete ${name}?`);
        if (cfm) {
          cache.delete(url).then(function(response) {
            if (layers.overlay) {
              layers.overlay.removeFrom(map);
            }
            listMaps();
          });
        }
      }
    })
  })
}

// function addFile(file, name) {
//   if (file.name.endsWith(".mbtiles")) {
//     const reader = new FileReader();
//     reader.onload = function(e) {
//       loadMap(reader.result, name);
//     }
//     reader.readAsArrayBuffer(file);
//   } else {
//     alert("MBTiles files supported.");
//   }
// }

// initSqlJs({
//   locateFile: function() {
//     return "assets/vendor/sqljs-1.3.0/sql-wasm.wasm";
//   }
// }).then(function(SQL){
  
// });