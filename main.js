var camera, scene, renderer, objects = [];
function init() {
	// scene
	scene = new THREE.Scene();
	var gui = new dat.GUI();
	var clock = new THREE.Clock();

	var enableFog = true;
	if (enableFog)
		scene.fog = new THREE.FogExp2('rgb(0, 0, 0)', 0.005);

	scene.background = new THREE.Color('#000');

	//Add lighting
	var myLight = getSpotLight(1, 'rgb(255, 255, 255)');
	myLight.position.x = 0;
	myLight.position.y = 29;
	myLight.position.z = 41;

	// load the environment map
	var path = 'assets/cubemap/';
	var format = '.jpg';
	var urls = [
		path + 'px' + format, path + 'nx' + format,
		path + 'py' + format, path + 'ny' + format,
		path + 'pz' + format, path + 'nz' + format
	];
	var reflectionCube = new THREE.CubeTextureLoader().load(urls);

	//Add floor
	var planeMaterial = getMaterial('standard', 'rgb(255, 255, 255)');
	var plane = getPlane(planeMaterial, 1030);
	plane.name = 'plane-1';
	plane.rotation.x = Math.PI/2;

	//Floor textures
	var planeLoader = new THREE.TextureLoader();
	planeMaterial.map = planeLoader.load('assets/textures/metalFloor.jpg');
	planeMaterial.bumpMap = planeLoader.load('assets/textures/metalFloor.jpg');
	planeMaterial.roughnessMap = planeLoader.load('assets/textures/metalFloor.jpg');
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

	//Camera
	camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 1, 1000);
	camera.position.x = 8.65;
	camera.position.y = 13.97;
	camera.position.z = 24.76;

	//Renderer
	renderer = new THREE.WebGLRenderer();
	renderer.shadowMap.enabled = true;
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setClearColor('rgb(220, 220, 220)');
	document.getElementById('webgl').appendChild(renderer.domElement);

	//Load external geometry
	var loader = new THREE.OBJLoader();
	var textureLoader = new THREE.TextureLoader();

	loader.load('assets/models/r2d2/r2-d2.obj', function (object) {
		var colorMap = textureLoader.load('assets/models/r2d2/R2D2_Diffuse.jpg');
		var reflectionMap = textureLoader.load('assets/models/r2d2/R2D2_Reflection.jpg');
		var faceMaterial = getMaterial('standard', 'rgb(255, 255, 255)');

		object.traverse(function(child) {
			if (child.name == 'Merged_Meshes') {
				child.material = faceMaterial;
				child.castShadow = true;
				faceMaterial.roughness = 0.28;
				faceMaterial.envMap = reflectionCube;
				faceMaterial.map = colorMap;
				faceMaterial.metalness = 0.15;
				faceMaterial.bumpScale = 0.175;

				//Controls for imported model
				var folder3 = gui.addFolder('R2D2');
				folder3.add(faceMaterial, 'roughness', 0, 1);
				folder3.add(faceMaterial, 'metalness', 0, 1);
			}
		});
		object.scale.x = 0.1;
		object.scale.y = 0.1;
		object.scale.z = 0.1;
		object.name = 'r2';
		objects.push(object);
		scene.add(object);
	});

	//Bindings
	function bindElem(target, getParent, anim){
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
			    var intersection = intersects[i],
					obj = [];
					if(getParent == true && intersection.object.parent.name == target){
						obj = intersection.object.parent;
						anim();
					}
					else if(intersection.object.name == target){
						obj = intersection.object;
						anim();
					}
			  }
			}
		}
	}
	bindElem('r2', true, function(){
		var animTarget = scene.getObjectByName('r2');
		new TWEEN.Tween({val: 0}).to({val: 5}, 150).onUpdate(function(){
			animTarget.position.y = this.val;
		}).start();
		new TWEEN.Tween({val: 5}).to({val: 0}, 150).delay(150).onUpdate(function(){
			animTarget.position.y = this.val;
		}).start();
	});


	//Add geometry to the scene
	scene.add(plane);
	scene.add(myLight);

	// controls
	var controls = new THREE.OrbitControls(camera, renderer.domElement);
	controls.minPolarAngle = 0; // radians
	controls.maxPolarAngle = Math.PI / 2 - 0.01; // radians
	controls.target = new THREE.Vector3(0, 7, 0); //rotate camera

	var folder1 = gui.addFolder('light');
	folder1.add(myLight.position, 'x', 0, 360);
	folder1.add(myLight.position, 'y', 0, 360);
	folder1.add(myLight.position, 'z', 0, 360);

	var folder2 = gui.addFolder('floor');
	folder2.add(planeMaterial, 'roughness', 0, 1);
	folder2.add(planeMaterial, 'metalness', 0, 1);

	update(renderer, scene, camera, controls, clock);

	//Resize canvas for responsiveness
	window.addEventListener('resize', onWindowResize, false);
	function onWindowResize(){
	  camera.aspect = window.innerWidth / window.innerHeight;
	  camera.updateProjectionMatrix();
	  renderer.setSize( window.innerWidth, window.innerHeight );
	}

	//Return initial state
	return scene;
}

function getSpotLight(intensity, color) {
	color = color === undefined ? 'rgb(255, 255, 255)' : color;
	var light = new THREE.SpotLight(color, intensity);
	light.castShadow = true;
	light.penumbra = 0.5;
	var shadowMapSize = 550;

	//Set up shadow properties for the light
	light.shadow.mapSize.width = 4096;  // default: 512
	light.shadow.mapSize.height = 4096; // default: 512
	light.shadow.bias = 0.001;

	light.shadow.camera.left = -shadowMapSize;
	light.shadow.camera.bottom = -shadowMapSize;
	light.shadow.camera.right = shadowMapSize;
	light.shadow.camera.top = shadowMapSize;

	return light;
}

function getDirectionalLight() {
	var light = new THREE.myLight(0xffffff, 1.5);
	light.castShadow = true;
	var shadowMapSize = 100;

	//Set up shadow properties for the light
	light.shadow.mapSize.width = 4096;
	light.shadow.mapSize.height = 4096;
	light.shadow.bias = 0.0001;

	//Adjust shadow threshold
	light.shadow.camera.left = -shadowMapSize;
	light.shadow.camera.bottom = -shadowMapSize;
	light.shadow.camera.right = shadowMapSize;
	light.shadow.camera.top = shadowMapSize;

	return light;
}

function getBox(w, h, d) {
	var geometry = new THREE.BoxGeometry(w, h, d);
	var material = new THREE.MeshPhongMaterial({
		color: 'rgb(120, 120, 120)',
	});
	var obj = new THREE.Mesh(geometry, material);
	obj.castShadow = true;

	return obj;
}

function getPlane(material, size) {
	var geometry = new THREE.PlaneGeometry(size, size);
	material.side = THREE.DoubleSide;
	var obj = new THREE.Mesh(geometry, material);
	obj.receiveShadow = true;

	return obj;
}

function getMaterial(type, color) {
	var selectedMaterial;
	var materialOptions = {
		color: color === undefined ? 'rgb(255, 255, 255)' : color,
	};

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
var myCamera;
function update(renderer, scene, camera, controls, clock) {
	renderer.render(scene, camera);
	controls.update();
	var timeElapsed = clock.getElapsedTime();

	TWEEN.update();

	requestAnimationFrame(function() {
		update(renderer, scene, camera, controls, clock);
	});

	myCamera = camera;
}

var scene = init();
