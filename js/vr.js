var camera, scene, renderer, reflectionCube, myLight;
function init() {
	scene = new THREE.Scene();

	//GUI for changing properties with sliders for testing
	var gui = new dat.GUI();

	//Fog for keeping plane edges hidden
	var enableFog = true;
	if (enableFog) scene.fog = new THREE.FogExp2('rgb(0, 0, 0)', 0.005);

	//Add lighting
	myLight = getSpotLight(1);
	myLight.position.x = 0;
	myLight.position.y = 29;
	myLight.position.z = 31;

	//Environment map for generating image-based reflections
	var path = 'assets/cubemap/';
	var format = '.jpg';
	var urls = [
		path + 'px' + format, path + 'nx' + format,
		path + 'py' + format, path + 'ny' + format,
		path + 'pz' + format, path + 'nz' + format
	];
	reflectionCube = new THREE.CubeTextureLoader().load(urls);

	//Floor textures
	var planeMaterial = getMaterial('standard');
	var planeLoader = new THREE.TextureLoader();
	planeMaterial.map = planeMaterial.bumpMap = planeMaterial.roughnessMap = planeLoader.load('assets/textures/sand.jpg');
	// planeMaterial.envMap = reflectionCube;
	// planeMaterial.roughness = 1;
	planeMaterial.metalness = 0;
	planeMaterial.bumpScale = 0.15;

	//Import models and apply textures/transforms
	var r2Props = { envMap: reflectionCube, roughness: 0.28, metalness: 0.1 };
	var r2Transforms = { scale: 0.1, posX: 0, posY: 0, posZ: -40 }
	var r2Assets = { model: 'assets/models/r2d2/r2-d2.obj', texture: 'assets/models/r2d2/R2D2_Diffuse.jpg' }
	importObj('r2', r2Assets, r2Props, r2Transforms);

	//Floor texture mapping & output
	var maps = ['map', 'bumpMap'];
	maps.forEach(function(mapName){
		var texture = planeMaterial[mapName];
		texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(85, 85);
	});
	var plane = getPlane(planeMaterial, 1030);
	plane.name = 'floor';
	plane.rotation.x = Math.PI/2;

	var standeeTex = new THREE.TextureLoader().load('images/standee.png');
	var standeeMat = new THREE.MeshLambertMaterial({ map: standeeTex, color: 0xFFFFFF, transparent: true });
	var standee = getPlane(standeeMat, 15);
	standee.name = 'standee';
	standee.position.y = 8;
	standee.position.x = -20;
	standee.position.z = -50;

	//Add geometry to the scene
	scene.add(plane);
	scene.add(myLight);
	scene.add(standee);

	//Create and position camera
	camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 1, 1000);
	camera.position.set(0, 11, 0);

	//Set up and assign renderer
	renderer = new THREE.WebGLRenderer({alpha: true});
	renderer.shadowMap.enabled = true;
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.getElementById('webgl').appendChild(renderer.domElement);

	//Controls for slider-based manipulation
	var controls = new THREE.OrbitControls(camera, renderer.domElement);

	//Constrain control camera so it doesn't rotate underground
  controls.target.set(camera.position.x + 0.15, camera.position.y, -10);
  controls.enableZoom = false;
  controls.enablePan = false;

  //Check for device orientation access to enable VR
  window.addEventListener('deviceorientation', setOrientationControls, true);
  function setOrientationControls(e){
    if (!e.alpha){
      return;
    }
    controls = new THREE.DeviceOrientationControls(camera, true);
    controls.connect();
    controls.update();
    window.removeEventListener('deviceorientation', setOrientationControls, true);
  }


	//Return initial state
	update(renderer, scene, camera, controls);
	return scene;
}

//Add controls for testing
function addControls(folder, object, properties, rangeIn, rangeOut){
	properties.forEach(function(property){
		folder.add(object, property, rangeIn, rangeOut);
	});
}

function setAttributes(el, attrs) {
  for(var key in attrs) {
    el.setAttribute(key, attrs[key]);
  }
}

//Easy bindings for desktop & mobile
function bindElem(target, getParent, animation){
	var raycaster = new THREE.Raycaster();
	var mouse = new THREE.Vector2();

  //Touch detection
  try{
    document.createEvent("TouchEvent");
    document.addEventListener('touchstart', objTouch, false);
  }
  catch(e){
    document.addEventListener('click', objClick, false);
  }

	function objTouch(e) {
		e.clientX = e.touches[0].clientX;
		e.clientY = e.touches[0].clientY;
		objClick(e);
	}
	function objClick(e) {
		mouse.x = (e.clientX / renderer.domElement.clientWidth) * 2 - 1;
		mouse.y = - (e.clientY / renderer.domElement.clientHeight) * 2 + 1;
		raycaster.setFromCamera(mouse, camera);
		var intersects = raycaster.intersectObjects(scene.children, true);
		if(intersects.length > 0) {
			for(var i = 0; i < intersects.length; i++){
				var intersection = intersects[i];
				if(getParent == true && (intersection.object.parent.name == target || intersection.object.name == target)) animation();
			}
		}
	}
}

//Resize canvas for responsiveness
window.addEventListener('resize', onWindowResize, false);
function onWindowResize(){
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

//Re-render scene
function update(renderer, scene, camera, controls) {
	renderer.render(scene, camera);
	controls.update();
	TWEEN.update();
	var standee = scene.getObjectByName('standee');
	standee.lookAt(camera.position);

	requestAnimationFrame(function() {
		update(renderer, scene, camera, controls);
	});
}

//Start everything up and apply bindings
var scene = init(), audio;
var r2Audio = new Audio('assets/sound/r2.mp3');
r2Audio.volume = 0.1;
bindElem('r2', true, function(){
	r2Audio.play();
	var animTarget = scene.getObjectByName('r2');
	new TWEEN.Tween({val: 0}).to({val: 5}, 150).onUpdate(function(){
		animTarget.position.y = this.val;
	}).start();
	new TWEEN.Tween({val: 5}).to({val: 0}, 150).delay(150).onUpdate(function(){
		animTarget.position.y = this.val;
	}).start();
});

bindElem('standee', true, function(){
	var animTarget = scene.getObjectByName('standee');
	new TWEEN.Tween({val: 8}).to({val: 12}, 150).onUpdate(function(){
		animTarget.position.y = this.val;
	}).start();
	new TWEEN.Tween({val: 12}).to({val: 8}, 150).delay(150).onUpdate(function(){
		animTarget.position.y = this.val;
	}).start();
})
