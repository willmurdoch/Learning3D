function init() {
  var scene = new THREE.Scene();
  //Create new object with scale 1,1,1 in 3D space
  var box = getBox(1, 1, 1);
  box.position.y = box.geometry.parameters.height/2;
  scene.add(box);

  var plane = getPlane(4);
  plane.rotation.x = Math.PI/2;
  scene.add(plane);

  //FOV, aspect ratio, near clipping plane, far clipping plane (clipping planes are min/max distance for optimization)
  var camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 1, 1000);
  var renderer = new THREE.WebGLRenderer();

  //Position the camera
  camera.position.z = 5;
  camera.position.x = 1;
  camera.position.y = 2;

  //Point the camera
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  //Only render things in the window
  renderer.setSize(window.innerWidth, window.innerHeight);
  //Add renderer to dom
  document.getElementById('webgl').appendChild(renderer.domElement);
  renderer.render(scene, camera);
}

//Generate a box
function getBox(w, h, d){
  var geometry = new THREE.BoxGeometry(w, h, d);
  var material = new THREE.MeshBasicMaterial({
    color: 0x00ff00
  })
  return new THREE.Mesh(geometry, material);
}

function getPlane(size){
  var geometry = new THREE.PlaneGeometry(size, size);
  var material = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    side: THREE.DoubleSide
  })
  return new THREE.Mesh(geometry, material);
}

init();
