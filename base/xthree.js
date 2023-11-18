import * as THREE from 'https://unpkg.com/three@0.127.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.127.0/examples/jsm/controls/OrbitControls.js'; // later versions

window.THREE = THREE;

export function createXthree(divin) {
  let xthree = {}

  xthree.ORBITCONTROLS = true;
  xthree.ACTIVE = false;
  xthree.scene = null;
  xthree.camera = null;
  xthree.renderer = null;
  xthree.controls = null;
  xthree.div = null;
  
  xthree.render = function() {
      if (this.cubeCamera) this.cubeCamera.update(this.renderer, this.scene);
      this.renderer.render( this.scene, this.camera );
  }
  
  let animate = function() {
    if (!xthree.ACTIVE) {
      setTimeout(animate,500);
    } else {
      requestAnimationFrame( animate );
      if (xthree.ORBITCONTROLS) xthree.controls.update();
      xthree.render();
    }
  }

  xthree.init = function(div) {
    if (div.offsetWidth === 0 || div.offsetHeight === 0) {
      let self = this;
      setTimeout(function() {  self.init(div);  },1000); // wait til loaded
      return;
    }
    let width = div.offsetWidth;
    let height = div.offsetHeight;
    var fov = 70;
    var near = 0.1;
    var far = 10000;
    this.div = div;
    this.camera = new THREE.PerspectiveCamera( fov, (height !== 0) ? width / height : 1, near, far);
    this.camera.position.z = 1800;
    this.camera.up.set( 0, 0, 1 );
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( 0x000000 );
    this.renderer = new THREE.WebGLRenderer( { antialias: true } );
    this.renderer.shadowMap.enabled = true;
    this.renderer.setClearColor(0x000000, 0.0);

    this.renderer.setSize( width, height );
    this.renderer.setPixelRatio( window.devicePixelRatio );
    div.innerHTML = '';
    div.appendChild(this.renderer.domElement);
    if (this.ORBITCONTROLS) {
      this.controls = new OrbitControls( this.camera,  this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.25;
    }
    animate();
    
    this.cubeRenderTarget = new THREE.WebGLCubeRenderTarget( 256 );
    this.cubeRenderTarget.texture.type = THREE.HalfFloatType;
    this.cubeCamera = new THREE.CubeCamera( 1, 1000, this.cubeRenderTarget );


    let self = this;
    let resize_three = function() {
      let w = div.offsetWidth; // window.innerWidth
      let h = div.offsetHeight; // window.innerHeight
      self.camera.aspect = w / h;
      self.camera.updateProjectionMatrix();
      self.renderer.setSize( w, h );
    };
    window.addEventListener('resize', resize_three);
    
  }
  xthree.init(divin);
  return xthree;
}
