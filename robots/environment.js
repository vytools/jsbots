import * as THREE from 'three';
const textureLoader = new THREE.TextureLoader();  

export function environment(scene, CONFIG, ground_geometry) {
  if (!scene) return;
  let env_rgb = 0x000000;

  // Set background and fog
  scene.background = new THREE.Color( env_rgb );
  delete scene.fog; 
  scene.fog = new THREE.FogExp2( env_rgb, 0.01 );

  // Get ground geometry
  let geometry = new THREE.BufferGeometry();  
  geometry.setIndex( ground_geometry.indices );
  geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( ground_geometry.vertices, 3 ) );
  geometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( ground_geometry.uvs, 2 ) );
  geometry.setAttribute( 'uv2', geometry.getAttribute('uv'));
  geometry.setAttribute( 'normal', new THREE.Float32BufferAttribute( ground_geometry.normal, 3 ));
  let material1 = new THREE.MeshPhysicalMaterial({
      metalness: 0.8,
      color:0x333333,
      roughness: 1.0,
      transmission: 0.0,
      transparent: false,
  })

  let mesh = new THREE.Mesh( geometry, material1 );
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = 'ground';
  mesh.userData.bloom = true;
  scene.add(mesh);

  const starGeometry = new THREE.SphereGeometry(3*CONFIG.arena_radius, 64, 64);
  const starImage = textureLoader.load('../jsbots/textures/galaxy1.png');
  const starMaterial = new THREE.MeshBasicMaterial({map: starImage, side: THREE.BackSide, transparent: true});
  const starMesh = new THREE.Mesh(starGeometry, starMaterial);
  mesh.name = 'stars';
  scene.add(starMesh);

  // scene.add(new THREE.AmbientLight(0xffffff, 2.5));
};

