var container, camera, scene, renderer, controls, geometry, mesh, animate;
function init(){
	scene = new THREE.Scene();

	//Fog for keeping plane edges hidden
	var enableFog = true;
	if (enableFog) scene.fog = new THREE.FogExp2('rgb(0, 0, 0)', 0.005);

	//Add lighting
	myLight = getSpotLight(1);
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
	var r2Transforms = { scale: 0.1, posX: 0, posY: 0, posZ: 0 }
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
	var standee = getPlane(standeeMat, 20);
	standee.name = 'standee';
	standee.position.y = 10;
	standee.position.x = -20;
	standee.position.z = -30;

	//Add geometry to the scene
	scene.add(plane);
	scene.add(myLight);
	scene.add(standee);

	//Create and position camera
	camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 1, 1000);
	camera.position.x = -10.65;
	camera.position.y = 11.97;
	camera.position.z = 32.76;

	controls = new THREE.DeviceOrientationControls(camera);
	camera.enableZoom = false;
	camera.enablePan = false;

	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.getElementById('webgl').appendChild(renderer.domElement);

	animate = function(){
		window.requestAnimationFrame( animate );
		controls.update();
		TWEEN.update();
		renderer.render(scene, camera);
	};
	animate();

	return scene;
}

window.addEventListener('resize', function() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}, false);

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
	new TWEEN.Tween({val: 10}).to({val: 15}, 150).onUpdate(function(){
		animTarget.position.y = this.val;
	}).start();
	new TWEEN.Tween({val: 15}).to({val: 10}, 150).delay(150).onUpdate(function(){
		animTarget.position.y = this.val;
	}).start();
})
