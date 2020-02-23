'use strict';

// Construct the default list of terrain sources.
var terrainModels = Cesium.createDefaultTerrainProviderViewModels();
Cesium.BingMapsApi.defaultKey = "AqsuIszsvS_-1vNwHssX9HmGbhUdQzA5S8mUiQRO70Ym5tLmQ_jdyTfkR4320TBc";

var explorationMode = false;
var radarMode = false;

// Construct the viewer, with a high-res terrain source pre-selected.
var viewer = new Cesium.Viewer('cesiumContainer', {
    terrainProviderViewModels: terrainModels,
    selectedTerrainProviderViewModel: terrainModels[1] // Select STK High-res terrain
});

var selectedEntity = new Cesium.Entity();

$('#explorationMode').click(function () {
    console.log("click Exploration Mode");
    explorationMode = !explorationMode;
});

$('#radarMode').click(function () {
    console.log("click Radar Mode");
    radarMode = !radarMode;
});


function addPoint(longitude, latitude) {
  var x = Cesium.Cartesian3.fromDegrees(longitude, latitude);
  console.log(x);
    viewer.entities.add({
        position : Cesium.Cartesian3.fromDegrees(longitude, latitude),
        point : {
            pixelSize : 14,
            color : Cesium.Color.YELLOW,
            scaleByDistance : new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e7, 0.5)
        }
    });
}

function addPointBlack(coord) {
  console.log(coord);
    viewer.entities.add({
        position : Cesium.Cartesian3.fromRadians(coord.longitude, coord.latitude, 200),
        point : {
            pixelSize : 6,
            color : Cesium.Color.BLACK,
            scaleByDistance : new Cesium.NearFarScalar(1.5, 2.0, 1.5e7, 0.5)
        }
    });
}

function addRect(w, s, e, n) {
  viewer.entities.add({
      rectangle : {
        coordinates: Cesium.Rectangle.fromDegrees(w.lng(), s.lat(), e.lng(), n.lat()),
        // coordinates: new Cesium.Rectangle(west, south, east, north),
        material : Cesium.Color.RED.withAlpha(0.3),
        // fill: false,
        // outline: true,
        // outlineColor: Cesium.Color.RED,
        distanceDisplayCondition: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e7, 0.5)
      }
  });

}

viewer.canvas.addEventListener('dblclick', function (e) {
    var mousePosition = new Cesium.Cartesian2(e.clientX, e.clientY);
    var currentHeight;

    selectedEntity.name = "Coordinates";
    selectedEntity.description = 'Loading <div class="cesium-infoBox-loading"></div>';
    viewer.selectedEntity = selectedEntity;
    var ellipsoid = viewer.scene.globe.ellipsoid;
    var cartesian = viewer.camera.pickEllipsoid(mousePosition, ellipsoid);
    if (cartesian) {
        var cartographic = ellipsoid.cartesianToCartographic(cartesian);
        var longitudeString = Cesium.Math.toDegrees(cartographic.longitude).toFixed(2);
        var latitudeString = Cesium.Math.toDegrees(cartographic.latitude).toFixed(2);
        /*
        This section is for task 3 of assign
        */
        viewer.entities.removeAll();
        addPoint(longitudeString, latitudeString);


        var pointOfInterest = Cesium.Cartographic.fromDegrees(
            longitudeString, latitudeString, 5000, new Cesium.Cartographic());

        Cesium.sampleTerrain(viewer.terrainProvider, 9, [pointOfInterest])
            .then(function (samples) {
                currentHeight = samples[0].height;
                console.log("Longitude: " + longitudeString + ', ' + "Latitude: " + latitudeString);
                console.log('Height in meters is: ' + samples[0].height);
                selectedEntity.description = '<table class="cesium-infoBox-defaultTable"><tbody>' +
                '<tr><th>Longitude</th><td>' + longitudeString + '</td></tr>' +
                '<tr><th>Latitude</th><td>' + latitudeString + '</td></tr>' +
                '<tr><th>Height (m)</th><td>' + currentHeight + '</td></tr>' +
                '</tbody></table>';
            });
        /*
        This section is for task 5 of assign
        */
        if (radarMode){
          var fractionX;
          var fractionY;
          var additionFactor = 0.01; // this controls how much accuracy we want in interpolation
          var radius = $('#radarInput').val();
          console.log(radius);
          // var radius = 20000; // this controls the size of area under consideration in meters
          if (radius < 10){
            return;
          }
          var center = new google.maps.LatLng({
              lat: parseFloat(latitudeString),
              lng: parseFloat(longitudeString)
          })
          var latlongs = [];

          var north = google.maps.geometry.spherical.computeOffset(center, radius * Math.sqrt(2.0), 0);
          var east = google.maps.geometry.spherical.computeOffset(center, radius * Math.sqrt(2.0), 90);
          var west = google.maps.geometry.spherical.computeOffset(center, radius * Math.sqrt(2.0), 270);
          var south = google.maps.geometry.spherical.computeOffset(center, radius * Math.sqrt(2.0), 180);

          addRect(west, south, east, north);

          for (fractionY = additionFactor; fractionY < 1.0; fractionY += additionFactor) { // up -> down movement
              var startingCoordinate = google.maps.geometry.spherical.interpolate(north, east, fractionY);
              var endingCoordinate = google.maps.geometry.spherical.interpolate(west, south, fractionY);
              latlongs.push(Cesium.Cartographic.fromDegrees(
                  startingCoordinate.lng(), startingCoordinate.lat(), 5000, new Cesium.Cartographic()));
              latlongs.push(Cesium.Cartographic.fromDegrees(
                  endingCoordinate.lng(), endingCoordinate.lat(), 5000, new Cesium.Cartographic()));
              for (fractionX = additionFactor; fractionX < 1.0; fractionX += additionFactor) { // left -> right movement
                  var midwayCoorindate = google.maps.geometry.spherical.interpolate(startingCoordinate, endingCoordinate, fractionX);
                  latlongs.push(Cesium.Cartographic.fromDegrees(
                      midwayCoorindate.lng(), midwayCoorindate.lat(), 5000, new Cesium.Cartographic()));
              }
          }

          var promise = Cesium.sampleTerrain(viewer.terrainProvider, 9, latlongs);
          Cesium.when(promise, function (updatedPositions) {
              var maxHeight = Math.max.apply(Math, updatedPositions.map(function (o) {
                  return o.height;
              }))
              console.log("Max height: " + maxHeight);
              var coordinates = latlongs.find(x=>x.height == maxHeight);
              addPointBlack(coordinates);
        })

      }
      /*
      This section is for task 4 of assign
      */
        if (explorationMode) {
            var fractionX;
            var fractionY;
            var additionFactor = 0.01; // this controls how much accuracy we want in interpolation
            var radius = 20000; // this controls the size of area under consideration in meters
            var latlongs = [];

            var center = new google.maps.LatLng({
                lat: parseFloat(latitudeString),
                lng: parseFloat(longitudeString)
            })
            // get four coordinates for corners of the search area
            var northwest = google.maps.geometry.spherical.computeOffset(center, radius * Math.sqrt(2.0), 135);
            var northeast = google.maps.geometry.spherical.computeOffset(center, radius * Math.sqrt(2.0), 45);
            var southwest = google.maps.geometry.spherical.computeOffset(center, radius * Math.sqrt(2.0), 225);
            var southeast = google.maps.geometry.spherical.computeOffset(center, radius * Math.sqrt(2.0), 315);


            // now we have to make a nested for loop and interpolate to find latitudes and longitudes inside the search area

            // this function takes two coordinates as input and returns coordinates that are specified fraction from the starting
            // so we need to change fraction from 0 to 1 and call this function inside the nested loop
            // we need two fractions, one for y direction and one for x

            // interpolation will occur left to right similar to how a printer prints
            for (fractionY = additionFactor; fractionY < 1.0; fractionY += additionFactor) { // up -> down movement
                var startingCoordinate = google.maps.geometry.spherical.interpolate(northwest, southwest, fractionY);
                var endingCoordinate = google.maps.geometry.spherical.interpolate(northeast, southeast, fractionY);
                latlongs.push(Cesium.Cartographic.fromDegrees(
                    startingCoordinate.lng(), startingCoordinate.lat(), 5000, new Cesium.Cartographic()));
                latlongs.push(Cesium.Cartographic.fromDegrees(
                    endingCoordinate.lng(), endingCoordinate.lat(), 5000, new Cesium.Cartographic()));
                for (fractionX = additionFactor; fractionX < 1.0; fractionX += additionFactor) { // left -> right movement
                    var midwayCoorindate = google.maps.geometry.spherical.interpolate(startingCoordinate, endingCoordinate, fractionX);
                    latlongs.push(Cesium.Cartographic.fromDegrees(
                        midwayCoorindate.lng(), midwayCoorindate.lat(), 5000, new Cesium.Cartographic()));
                }
            }

            var promise = Cesium.sampleTerrain(viewer.terrainProvider, 9, latlongs);
            Cesium.when(promise, function (updatedPositions) {
                var maxHeight = Math.max.apply(Math, updatedPositions.map(function (o) {
                    return o.height;
                }))
                console.log("Max height: " + maxHeight)
                var minHeight = Math.min.apply(Math, updatedPositions.map(function (o) {
                    return o.height;
                }))
                console.log("Min height: " + minHeight)
                var avgHeight = updatedPositions.reduce(function (a, b) {
                    return a + b.height;
                }, 0) / updatedPositions.length
                console.log("Average height: " + avgHeight)

                selectedEntity.description = '<table class="cesium-infoBox-defaultTable"><tbody>' +
                    '<tr><th>Longitude</th><td>' + longitudeString + '</td></tr>' +
                    '<tr><th>Latitude</th><td>' + latitudeString + '</td></tr>' +
                    '<tr><th>Height (m)</th><td>' + currentHeight + '</td></tr>' +
                    '<tr><th>Maximum height (m)</th><td>' + maxHeight + '</td></tr>' +
                    '<tr><th>Minimum height (m)</th><td>' + minHeight + '</td></tr>' +
                    '<tr><th>Average height (m)</th><td>' + avgHeight + '</td></tr>' +
                    '</tbody></table>';
            });

        }

    } else {
        console.log('Globe was not picked');
    }
}, false);

// ---------------------------Task 6--------------------------------------------

var options = {
    camera : viewer.scene.camera,
    canvas : viewer.scene.canvas
};

var check = false;
var tour = null;
var index = 0;

var names = [
  "(PAK vs. ZIM)",
  "(PAK vs. AUS)",
  "(PAK vs. SRL)",
  "(PAK vs. NZL)",
  "(PAK vs. NZL)",
  "(PAK vs. ENG)"
];

var descriptions = [
  "7th match of the series played at Bellerive Oval, Australia. Pakistan won by 53 runs.",
  "26th match of the series played at WACA Ground, Australia. Pakistan won by 48 runs.",
  "33rd match of the series played at WACA Ground, Australia. Pakistan won by 4 wickets.",
  "34th match of the series played at AMI Stadium, New Zealand. Pakistan won by 7 wickets.",
  "37th match of the series played at Eden Park,  New Zealand. Pakistan won by 4 wickets.",
  "39th match of the series played at Melbourne Cricket Ground, Australia. Pakistan won by 22 runs."
];

var images = [
  "1.jpg",
  "2.jpg",
  "3.jpg",
  "4.jpg",
  "5.jpg",
  "6.jpg"
];

viewer.dataSources.add(
    Cesium.KmlDataSource.load('SampleData/cricket-world-cups.kml', options))
.then(function(dataSource) {
    tour = dataSource.kmlTours[0];
    tour.tourStart.addEventListener(function() {
        console.log('Start tour');
    });
    tour.tourEnd.addEventListener(function(terminated) {
        console.log((terminated ? 'Terminate' : 'End') + ' tour');
        viewer.selectedEntity = undefined;
        index = 0;
    });
    tour.entryStart.addEventListener(function(entry) {
        // console.log('Play ' + entry.type + ' ('+ entry.duration + ')');
        if (entry.type == "KmlTourFlyTo" && check) {
          viewer.selectedEntity = undefined;
          check = false;
        }

    });
    tour.entryEnd.addEventListener(function(entry, terminated) {
        if (!terminated && entry.type == "KmlTourFlyTo") {
          selectedEntity.name = names[index];
          selectedEntity.description = '<table class="cesium-infoBox-defaultTable"><tbody>' +
          '<tr> <img src="images/' + images[index] + '" style="float:right;width:125px;height:100px;"> ' +
          descriptions[index] + ' </tr>' +
          '</tbody></table>';
          viewer.selectedEntity = selectedEntity;
          console.log("Image Loaded");

          check = true;
          index++;
        }
    });
});

$('#playTour').click(function () {
  tour.play(viewer);
});

$('#stopTour').click(function () {
  tour.stop();
});
