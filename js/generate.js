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

//Basic Geometry
function getBox(material, w, h = w, d = w) {
	var geometry = new THREE.BoxGeometry(w, h, d);
	var myMaterial = material;
	var obj = new THREE.Mesh(geometry, myMaterial);
	obj.castShadow = true;
	return obj;
}
function getPlane(material, w, h = w) {
	var geometry = new THREE.PlaneGeometry(w, h);
	material.side = THREE.DoubleSide;
	var obj = new THREE.Mesh(geometry, material);
	obj.receiveShadow = true;
	return obj;
}

//Import .OBJ files
function importObj(name, assets, properties, transforms){
	var loader = new THREE.OBJLoader();
	var textureLoader = new THREE.TextureLoader();
	loader.load(assets.model, function(object) {
		var colorMap = textureLoader.load(assets.texture);
		if(assets.matType === undefined) assets.matType = 'standard';
		var objMaterial = getMaterial(assets.matType);

		//Combine sub-objects of import into a group and give them their properties
		object.traverse(function(child){
			if (child.name == 'Merged_Meshes'){
				objMaterial.map = colorMap;
				for (var key in properties){
					objMaterial[key] = properties[key];
				}
				child.castShadow = true;
				child.material = objMaterial;
			}
		});

		//Adjust and store final object
		object.scale.x = object.scale.y = object.scale.z = transforms.scale;
		if(transforms.posX !== undefined){
			object.position.x = transforms.posX;
			object.position.y = transforms.posY;
			object.position.z = transforms.posZ;
		}
		object.name = name;
		scene.add(object);
	});
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
