export function environment(XTHREE, CONFIG, ground_geometry) {
  if (!XTHREE || !XTHREE.scene) return;
  let env_rgb = 0x000000;

  // Set background and fog
  XTHREE.scene.background = new THREE.Color( env_rgb );
  // delete XTHREE.scene.fog; 
  // XTHREE.scene.fog = new THREE.FogExp2( env_rgb, 0.01 );

  // Get ground geometry
  let geometry = new THREE.BufferGeometry();  
  geometry.setIndex( ground_geometry.indices );
  geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( ground_geometry.vertices, 3 ) );
  geometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( ground_geometry.uvs, 2 ) );
  geometry.setAttribute( 'uv2', geometry.getAttribute('uv'));
  geometry.setAttribute( 'normal', new THREE.Float32BufferAttribute( ground_geometry.normal, 3 ));

  const textureLoader = new THREE.TextureLoader();  
  const baseColor = textureLoader.load('../jsbots/textures/metalTile/basecolor.jpg');
  const normalMap = textureLoader.load('../jsbots/textures/metalTile/normal.jpg');
  const heightMap = textureLoader.load('../jsbots/textures/metalTile/height.png');
  const roughness = textureLoader.load('../jsbots/textures/metalTile/roughness.jpg');
  const metallic = textureLoader.load('../jsbots/textures/metalTile/metallic.jpg');
  const ambOcc = textureLoader.load('../jsbots/textures/metalTile/ambientOcclusion.jpg');
  let material1 = new THREE.MeshStandardMaterial({
    map: baseColor,
    normalMap: normalMap,
    roughnessMap:roughness,
    roughness:0.5,
    aoMap: ambOcc
  });
  // let material1 = new THREE.MeshStandardMaterial({depthTest:true, depthWrite:true, color:0xFF00FF})
  // let material1 = new THREE.MeshPhongMaterial({depthTest:true, depthWrite:true, color:0xFF00FF})

  let mesh = new THREE.Mesh( geometry, material1 );
  // mesh.castShadow = true;
  // mesh.receiveShadow = true;
  mesh.name = 'ground';
  XTHREE.scene.add(mesh);

  const starGeometry = new THREE.SphereGeometry(3*CONFIG.arena_radius, 64, 64);
  const starImage = textureLoader.load('../jsbots/textures/galaxy1.png');
  const starMaterial = new THREE.MeshBasicMaterial({map: starImage, side: THREE.BackSide, transparent: true});
  const starMesh = new THREE.Mesh(starGeometry, starMaterial);
  mesh.name = 'stars';
  XTHREE.scene.add(starMesh);

  // XTHREE.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
};

