let THREE = null, EffectComposer = null, RenderPass = null, ShaderPass = null, UnrealBloomPass = null, OutputPass = null;
import('three').then(exports => { THREE = exports; }).catch(err => {})
import('three/addons/postprocessing/EffectComposer.js').then(exports => { EffectComposer = exports.EffectComposer; }).catch(err => {})
import('three/addons/postprocessing/RenderPass.js').then(exports => { RenderPass = exports.RenderPass; }).catch(err => {})
import('three/addons/postprocessing/ShaderPass.js').then(exports => { ShaderPass = exports.ShaderPass; }).catch(err => {})
import('three/addons/postprocessing/UnrealBloomPass.js').then(exports => { UnrealBloomPass = exports.UnrealBloomPass; }).catch(err => {})
import('three/addons/postprocessing/OutputPass.js').then(exports => { OutputPass = exports.OutputPass; }).catch(err => {})

const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`

const fragmentShader = `
uniform sampler2D baseTexture;
uniform sampler2D bloomTexture;
varying vec2 vUv;
void main() {
    gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );
}`;

const params = {
    bloomThreshold: 0,
    exposure: 1,
    bloomStrength: 1,
    bloomRadius: 0.5
};

export function init(xthree) {
    if (!(xthree && xthree.scene && THREE && EffectComposer && RenderPass && ShaderPass && UnrealBloomPass && OutputPass)) return;

    const darkMaterial = new THREE.MeshBasicMaterial( { color: 'black' } );
    const bloomRenderer = function(scene, renderer, camera) {
        const renderScene = new RenderPass( scene, camera );
        const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
        bloomPass.threshold = params.bloomThreshold;
        bloomPass.strength = params.bloomStrength;
        bloomPass.radius = params.bloomRadius;
    
        const bloomComposer = new EffectComposer( renderer );
        bloomComposer.renderToScreen = false;
        bloomComposer.addPass( renderScene );
        bloomComposer.addPass( bloomPass );
    
        const mixPass = new ShaderPass(
            new THREE.ShaderMaterial( {
                uniforms: {
                    baseTexture: { value: null },
                    bloomTexture: { value: bloomComposer.renderTarget2.texture }
                },
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                defines: {}
            } ), 'baseTexture'
        );
        mixPass.needsSwap = true;
        const finalComposer = new EffectComposer( renderer );
        const outputPass = new OutputPass();
    
        finalComposer.addPass( renderScene );
        finalComposer.addPass( mixPass );
        finalComposer.addPass( outputPass );
        return {bloomComposer, finalComposer}
    }
    
    const bloom = bloomRenderer(xthree.scene, xthree.renderer, xthree.camera);
    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        bloom.bloomComposer.setSize( width, height );
        bloom.finalComposer.setSize( width, height );        
    });
    xthree.render = function() {
        let materials = {};
        xthree.scene.traverse(( obj ) => {
            if ( obj.isMesh && !obj.userData.bloom) {
                materials[ obj.uuid ] = obj.material;
                obj.material = darkMaterial;
            }
        });
        bloom.bloomComposer.render();
        xthree.scene.traverse(( obj ) => {
            if ( materials[ obj.uuid ] ) {
                obj.material = materials[ obj.uuid ];
                delete materials[ obj.uuid ];
            }
        });
        bloom.finalComposer.render();
    }
}
