var camera, scene, renderer;
function init() {
	scene = new THREE.Scene();
	scene.background = new THREE.Color('#000');

	//GUI for changing properties with sliders for testing
	var gui = new dat.GUI();

	//Fog for keeping plane edges hidden
	var enableFog = true;
	if (enableFog) scene.fog = new THREE.FogExp2('rgb(0, 0, 0)', 0.005);

	//Add lighting
	var myLight = getSpotLight(1);
	myLight.position.x = 0;
	myLight.position.y = 29;
	myLight.position.z = 41;

	//Environment map for generating image-based reflections
	var path = 'assets/cubemap/';
	var format = '.jpg';
	var urls = [
		path + 'px' + format, path + 'nx' + format,
		path + 'py' + format, path + 'ny' + format,
		path + 'pz' + format, path + 'nz' + format
	];
	var reflectionCube = new THREE.CubeTextureLoader().load(urls);

	//Add floor
	var planeMaterial = getMaterial('standard');
	var plane = getPlane(planeMaterial, 1030);
	plane.name = 'floor';
	plane.rotation.x = Math.PI/2;

	//Floor textures
	var planeLoader = new THREE.TextureLoader();
	planeMaterial.map = planeMaterial.bumpMap = planeMaterial.roughnessMap = planeLoader.load('assets/textures/metalFloor.jpg');
	planeMaterial.envMap = reflectionCube;
	planeMaterial.roughness = 0.7;
	planeMaterial.metalness = 0.2;
	planeMaterial.bumpScale = 0.05;

	//Floor texture mapping
	var maps = ['map', 'bumpMap'];
	maps.forEach(function(mapName){
		var texture = planeMaterial[mapName];
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
		texture.repeat.set(85, 85);
	});

	//Load external model
	var loader = new THREE.OBJLoader();
	var textureLoader = new THREE.TextureLoader();
	loader.load('assets/models/r2d2/r2-d2.obj', function (object) {
		var colorMap = textureLoader.load('assets/models/r2d2/R2D2_Diffuse.jpg');
		var reflectionMap = textureLoader.load('assets/models/r2d2/R2D2_Reflection.jpg');
		var myMaterial = getMaterial('standard');

		//Combine sub-objects of import into a group and give them their properties
		object.traverse(function(child){
			if (child.name == 'Merged_Meshes'){
				child.material = myMaterial;
				child.castShadow = true;
				myMaterial.roughness = 0.28;
				myMaterial.envMap = reflectionCube;
				myMaterial.map = colorMap;
				myMaterial.metalness = 0.15;
				myMaterial.bumpScale = 0.175;
			}
		});

		//Adjust and store final object
		object.scale.x = object.scale.y = object.scale.z = 0.1;
		object.name = 'r2';
		scene.add(object);
	});

	//Add geometry to the scene
	scene.add(plane);
	scene.add(myLight);

	//Create and position camera
	camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 1, 1000);
	camera.position.x = 8.65;
	camera.position.y = 13.97;
	camera.position.z = 24.76;

	//Set up and assign renderer
	renderer = new THREE.WebGLRenderer();
	renderer.shadowMap.enabled = true;
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor('rgb(220, 220, 220)');
	document.getElementById('webgl').appendChild(renderer.domElement);

	//Controls for slider-based manipulation
	var controls = new THREE.OrbitControls(camera, renderer.domElement);

	//Light controls
	var folder1 = gui.addFolder('light');
	var folder1Props = ['x', 'y', 'z'];
	addControls(folder1, myLight.position, folder1Props, 0, 360);

	//Mesh controls
	var folder2 = gui.addFolder('floor');
	var folder2Props = ['roughness', 'metalness'];
	addControls(folder2, planeMaterial, folder2Props, 0, 1);

	//Constrain control camera so it doesn't rotate underground
	controls.minPolarAngle = 0;
	controls.maxPolarAngle = Math.PI / 2 - 0.01;
	controls.target = new THREE.Vector3(0, 7, 0);

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

	document.addEventListener('click', objClick, false);
	document.addEventListener('touchstart', objTouch, false);

	function objTouch(e) {
		e.preventDefault();
		e.clientX = e.touches[0].clientX;
		e.clientY = e.touches[0].clientY;
		objClick(e);
	}
	function objClick(e) {
		e.preventDefault();
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

//Lighting
function getSpotLight(intensity, color = 'rgb(255, 255, 255)'){
	var light = new THREE.SpotLight(color, intensity), color = color;
	light.penumbra = 0.5;

	//Shadow configuration
	var shadowMapSize = 550;
	light.castShadow = true;
	light.shadow.mapSize.width = light.shadow.mapSize.height = 4096;
	light.shadow.bias = 0.001;

	//Range for casting shadows, keep as low as possible
	light.shadow.camera.left = light.shadow.camera.bottom = -shadowMapSize;
	light.shadow.camera.right = light.shadow.camera.top = shadowMapSize;

	return light;
}
function getDirectionalLight() {
	var light = new THREE.myLight(0xffffff, 1.5);

	//Shadow configuration
	var shadowMapSize = 100;
	light.castShadow = true;
	light.shadow.mapSize.width = light.shadow.mapSize.height = 4096;
	light.shadow.bias = 0.001;

	//Range for casting shadows, keep as low as possible
	light.shadow.camera.left = light.shadow.camera.bottom = -shadowMapSize;
	light.shadow.camera.right = light.shadow.camera.top = shadowMapSize;

	return light;
}

/****Basic Geometry****/
//

//Create a basic cube
function getBox(w, h, d, material) {
	var geometry = new THREE.BoxGeometry(w, h, d);
	var myMaterial = material;
	var obj = new THREE.Mesh(geometry, myMaterial);
	obj.castShadow = true;
	return obj;
}
//Create a basic plane
function getPlane(material, size) {
	var geometry = new THREE.PlaneGeometry(size, size);
	material.side = THREE.DoubleSide;
	var obj = new THREE.Mesh(geometry, material);
	obj.receiveShadow = true;
	return obj;
}

//Predefine basic materials for ease of access
function getMaterial(type, myColor = 'rgb(255, 255, 255)') {
	var selectedMaterial;
	var materialOptions = { color: myColor };
	switch (type) {
		case 'basic':
			selectedMaterial = new THREE.MeshBasicMaterial(materialOptions);
			break;
		case 'lambert':
			selectedMaterial = new THREE.MeshLambertMaterial(materialOptions);
			break;
		case 'phong':
			selectedMaterial = new THREE.MeshPhongMaterial(materialOptions);
			break;
		case 'standard':
			selectedMaterial = new THREE.MeshStandardMaterial(materialOptions);
			break;
		default:
			selectedMaterial = new THREE.MeshBasicMaterial(materialOptions);
			break;
	}
	return selectedMaterial;
}

//Re-render scene
function update(renderer, scene, camera, controls) {
	renderer.render(scene, camera);
	controls.update();
	TWEEN.update();
	requestAnimationFrame(function() {
		update(renderer, scene, camera, controls);
	});
}

//Start everything up and apply bindings
var scene = init();
bindElem('r2', true, function(){
	var animTarget = scene.getObjectByName('r2');
	new TWEEN.Tween({val: 0}).to({val: 5}, 150).onUpdate(function(){
		animTarget.position.y = this.val;
	}).start();
	new TWEEN.Tween({val: 5}).to({val: 0}, 150).delay(150).onUpdate(function(){
		animTarget.position.y = this.val;
	}).start();
});
