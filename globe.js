const globe = Globe()
    .globeImageUrl('https://unpkg.com/browse/three-globe@2.31.1/example/img/earth-topology.png')
    .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
    .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
    (document.getElementById('globeViz'));

// Auto-rotate
globe.controls().autoRotate = true;
globe.controls().autoRotateSpeed = 0.5;

// Random data points
const N = 300;
const gData = [...Array(N).keys()].map(() => ({
    lat: (Math.random() - 0.5) * 180,
    lng: (Math.random() - 0.5) * 360,
    size: Math.random() / 3,
    color: ['red', 'white', 'blue', 'green'][Math.round(Math.random() * 3)]
}));

globe
    .pointsData(gData)
    .pointAltitude('size')
    .pointColor('color');

// Add atmosphere effect
const geometry = new THREE.SphereGeometry(globe.getGlobeRadius() * 1.01, 64, 64);
const material = new THREE.ShaderMaterial({
    uniforms: {},
    vertexShader: `
        varying vec3 vNormal;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        varying vec3 vNormal;
        void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            gl_FragColor = vec4(0.2, 0.8, 0.2, 1.0) * intensity;
        }
    `,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true
});

const mesh = new THREE.Mesh(geometry, material);
globe.scene().add(mesh);

// Post-processing setup
const composer = new THREE.EffectComposer(globe.renderer());
const renderPass = new THREE.RenderPass(globe.scene(), globe.camera());
composer.addPass(renderPass);

// LUT shader pass (Night Vision)
const lutLoader = new THREE.TextureLoader();
lutLoader.load('https://threejs.org/manual/examples/resources/images/lut/nightvision-s8.png', (texture) => {
    const lutPass = new THREE.ShaderPass({
        uniforms: {
            tDiffuse: { value: null }, // Scene texture
            lut: { value: texture }    // Night vision LUT texture
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform sampler2D tDiffuse;
            uniform sampler2D lut;
            varying vec2 vUv;
            
            void main() {
                vec4 color = texture2D(tDiffuse, vUv);   // Sample the scene
                vec4 lutColor = texture2D(lut, vec2(color.r, 0.5));  // Sample LUT
                gl_FragColor = lutColor;  // Apply LUT effect
            }
        `
    });
    composer.addPass(lutPass);
});

// Render with composer
// Render with composer
function animate() {
    requestAnimationFrame(animate);
    composer.render();  // Use composer to render with post-processing
}

animate();

// Ensure proper rendering on window resize
window.addEventListener('resize', () => {
    const globeElement = document.getElementById('globeViz');
    globeElement.style.width = '100%';
    globeElement.style.height = '100%';

    // Adjust the renderer size
    globe.renderer().setSize(globeElement.clientWidth, globeElement.clientHeight);

    // Adjust the camera aspect ratio and projection matrix
    globe.camera().aspect = globeElement.clientWidth / globeElement.clientHeight;
    globe.camera().updateProjectionMatrix();
    
    // Re-render the scene
    composer.setSize(globeElement.clientWidth, globeElement.clientHeight);
});

// Trigger resize event to initialize sizes correctly
window.dispatchEvent(new Event('resize'));
