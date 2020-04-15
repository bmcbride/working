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
    strings: {
      feetUnit: true
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
  }).addTo(map),

  // creditsCtrl: L.controlCredits({
  //   position: "bottomleft",
  //   image: "./assets/vendor/L.Control.Credits-1.2/greeninfo.png",
  //   link: "http://www.greeninfo.org/",
  //   text: "Interactive mapping<br/>by GreenInfo Network"
  // }).addTo(map)
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
    if (navigator.onLine) {
      checkUpdates(false);
    }
  }).addTo(map);
}

function activateModal() {
  var html = `
    <ul class="mui-tabs__bar mui-tabs__bar--justified">
      <li class="mui--is-active"><a data-mui-toggle="tab" data-mui-controls="about-tab">About</a></li>
      <li><a data-mui-toggle="tab" data-mui-controls="saved-maps">Saved Maps</a></li>
    </ul>
    <div class="mui-tabs__pane mui--is-active" id="about-tab">
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam viverra blandit metus, sit amet pretium lectus accumsan ac. Integer suscipit lectus eros, at ornare turpis luctus vel. Donec pharetra dapibus nisi, eget molestie magna imperdiet ut. Mauris molestie lorem sed nisi tristique, a ornare nisl egestas. Sed iaculis condimentum augue, in consequat nunc bibendum ut. Phasellus cursus condimentum justo, non tristique libero facilisis sit amet. Sed orci est, mattis commodo odio sed, cursus aliquet ipsum.</p>
      <p>Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Suspendisse pulvinar quam ipsum, sed consequat nisl blandit at. Vivamus ac malesuada velit. Proin molestie id sem id dictum. Suspendisse at mollis mi, nec elementum est. Ut viverra libero arcu, sit amet aliquam orci porta sit amet. Nunc pharetra et justo eget tincidunt. Etiam tincidunt facilisis nulla et blandit. Suspendisse vitae odio dictum, pellentesque mauris at, eleifend diam. Nulla sodales pretium arcu non varius.</p>
    </div>
    <div class="mui-tabs__pane" id="saved-maps">
      <table class="mui-table mui-table--bordered">
        <thead>
          <tr>
            <th>Name</th>
            <th>Saved</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Cell 1-1</td>
            <td>Cell 1-2</td>
          </tr>
          <tr>
            <td>Cell 2-1</td>
            <td>Cell 2-2</td>
          </tr>
        </tbody>
      </table>
    </div>
    `;

  const modalDiv = L.DomUtil.create("div", "modal-div mui-container");
  modalDiv.innerHTML = html;
  mui.overlay("on", modalDiv);
}

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