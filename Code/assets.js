const CSS = [
  'html5-boilerplate/dist/css/main.css',
  'html5-boilerplate/dist/css/normalize.css',
  'bootstrap/dist/css/bootstrap.min.css',
  'bootstrap/dist/css/bootstrap.min.css.map',
  'cesium/Build/Cesium/Widgets/widgets.css',
  'cesium/Build/Cesium/Widgets/shared.css'
];

const JS = [
  'html5-boilerplate/dist/js/vendor/modernizr-3.5.0.min.js',
  'bootstrap/dist/js/bootstrap.min.js',
  'jquery/dist/jquery.min.js',
  'three/build/three.min.js',
  'popper.js/dist/umd/popper.min.js',
  'popper.js/dist/umd/popper.min.js.map',  
  'cesium/Build/Cesium/Cesium.js',
  'cesium/Build'
];

module.exports = [...JS, ...CSS];
