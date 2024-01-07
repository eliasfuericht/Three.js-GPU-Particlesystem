 import * as dat from 'lil-gui'
import * as THREE from 'three';
import {Vector3} from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';
import Stats from "stats.js";
import {CSS2DRenderer, CSS2DObject} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import {compressNormals} from "three/examples/jsm/utils/GeometryCompressionUtils";
import {temp} from "three/examples/jsm/nodes/shadernode/ShaderNodeBaseElements";

/*const gui = new dat.GUI({
    width: 300
})*/

const stats: Stats = new Stats();
//document.body.appendChild(stats.dom);

const renderer: THREE.WebGLRenderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

const scene: THREE.Scene = new THREE.Scene();

const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);

const controls: OrbitControls = new OrbitControls(camera, renderer.domElement);
// controls.enableZoom = false;

//limit rotation
/*controls.maxAzimuthAngle = Math.PI/8;
controls.minAzimuthAngle = -Math.PI/8;
controls.maxPolarAngle = Math.PI/2;
controls.minPolarAngle = Math.PI/10;*/

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.top = '0px';
labelRenderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(labelRenderer.domElement);

const particles: THREE.Object3D[] = [];

const spheres: THREE.Object3D[] = [];

let mouse: THREE.Vector2 = new THREE.Vector2();

let raycaster: THREE.Raycaster = new THREE.Raycaster();

const axesHelper = new THREE.AxesHelper(5);
// scene.add(axesHelper);

let newSphereCenter;

let elapsedTime = 0;

let triggered = false;

camera.position.z = -4;

let particleCount = 20000;


const particleMaterial: THREE.ShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uTime: {value: 0},
        uTime2: {value: 0},
        uScroll: {value: 0},
        uPixelRatio: {value: Math.min(window.devicePixelRatio, 2)},
        uSize: {value: 1},
        uFactor: {value: 3},
        uSpeed: {value: 2},
        uOrigin: {value: new THREE.Vector3(0, 0, 0)},
        uRaycastOrigin: {value: raycaster.ray.origin},
        uRaycastDirection: {value: raycaster.ray.direction},
        uCameraPosition: {value: camera.position},
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: 2
});

window.addEventListener('wheel', e => {
    const change = e.deltaY / 5000;
    if (triggered) {
        // particleMaterial.uniforms.uScroll.value += change;
    }
});

function createPoints(density: number, position: Vector3, labelText: string): void {
    const geometry: THREE.IcosahedronGeometry = new THREE.IcosahedronGeometry(1, density);
    geometry.rotateX(Math.random() * 360);
    geometry.rotateY(Math.random() * 360);
    geometry.rotateZ(Math.random() * 360);
    const positionAttribute = geometry.getAttribute('position') as THREE.BufferAttribute;

    const vertices: THREE.Vector3[] = [];

    const particleGeometry: THREE.BufferGeometry = new THREE.BufferGeometry();
    const particlePositions: number[] = [];
    const particleScale: number[] = [];
    const particleIndex: number[] = [];
    const startPosition: number[] = [];

    for (let i = 0; i < positionAttribute.count * 3; i += 3) {
        const x: number = positionAttribute.array[i];
        const y: number = positionAttribute.array[i + 1];
        const z: number = positionAttribute.array[i + 2];
        vertices.push(new THREE.Vector3(x, y, z));
        particlePositions.push(vertices[i / 3].x + position.x + (Math.random() * 0.05));
        particlePositions.push(vertices[i / 3].y + position.y + (Math.random() * 0.05));
        particlePositions.push(vertices[i / 3].z + position.z + (Math.random() * 0.05));
        particleScale.push(Math.random() * 100);
        particleIndex.push(i / 3);
        startPosition.push(position.x, position.y, position.z)
    }

    const particlePositionsBuffer: Float32Array = new Float32Array(particlePositions);
    const particleStartPositionsBuffer: Float32Array = new Float32Array(particlePositions);
    const particleScaleBuffer: Float32Array = new Float32Array(particleScale);
    const particleIndexBuffer: Float32Array = new Float32Array(particleIndex);
    const startPositionBuffer: Float32Array = new Float32Array(startPosition);

    particleGeometry.setAttribute(
        "aStartPosition",
        new THREE.BufferAttribute(startPositionBuffer, 3)
    );

    particleGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(particlePositionsBuffer, 3)
    );

    particleGeometry.setAttribute(
        "aParticleStartPosition",
        new THREE.BufferAttribute(particleStartPositionsBuffer, 3)
    );

    particleGeometry.setAttribute(
        "aScale",
        new THREE.BufferAttribute(particleScaleBuffer, 1)
    );

    particleGeometry.setAttribute(
        "aIndex",
        new THREE.BufferAttribute(particleIndexBuffer, 1)
    );

    const points: THREE.Points = new THREE.Points(particleGeometry, particleMaterial);

    let sphereGeometry = new THREE.BufferGeometry();

    let material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.01,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        opacity: 0.0,
    });

    let pos = [];
    let addInfo = [];

    const tempPosition = position.clone();
    const newPosition = tempPosition.add(new THREE.Vector3(0,0,0));

    for (let i = 0; i < particleCount; i++) {
        let info = {position: newPosition,
                    rotationAxis: new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1),
                    delay: Date.now() * 2};
        addInfo.push(info.rotationAxis.x, info.rotationAxis.y, info.rotationAxis.z, info.delay);
        pos.push(info.position.x, info.position.y, info.position.z);
    }

    const positionArray = new Float32Array(pos);
    const addInfoArray = new Float32Array(addInfo);

    sphereGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positionArray, 3)
    );

    sphereGeometry.setAttribute(
        "addInfo",
        new THREE.BufferAttribute(addInfoArray, 4)
    );

    let sphere = new THREE.Points(sphereGeometry, material);
    spheres.push(sphere);
    scene.add(sphere);

    //particles.push(points)
    scene.add(points);
    let dirToOrigin = new THREE.Vector3(0, 0, 0).sub(position).normalize();
    //createHtmlElements(position.add(dirToOrigin.multiplyScalar(0.1)), labelText, sphere);
}

function update() {
    for (let i = 0; i < spheres.length; i++) {
        let itter = 0;
        const positions = spheres[i].geometry.attributes.position.array;
        const addInfo = spheres[i].geometry.attributes.addInfo.array;

        for (let j = 0; j < particleCount * 3; j += 3) {
            const particle = new THREE.Vector3(positions[j], positions[j + 1], positions[j + 2]);
            const rotationAxis = new THREE.Vector3(addInfo[j], addInfo[j + 1], addInfo[j + 2]);
            const delay = addInfo[itter];
            if (Date.now() > delay) {

            }

            particle.applyAxisAngle(rotationAxis, 0.005);

            positions[j] = particle.x;
            positions[j + 1] = particle.y;
            positions[j + 2] = particle.z;

            itter += 4;
        }

        // spheres[i].geometry.attributes.position.needsUpdate = true;
    }
}


function createHtmlElements(position: THREE.Vector3, labelText: string, obj) {
    const p = document.createElement('p');
    p.textContent = labelText;
    p.style.color = 'White';
    p.style.fontFamily = 'Roboto';
    const cPointLabel = new CSS2DObject(p);
    scene.add(cPointLabel);
    cPointLabel.position.set(position.x, position.y, position.z);
    transformHtmlElements(position, cPointLabel, obj);
}

function transformHtmlElements(position: THREE.Vector3, label: CSS2DObject, obj) {

    //recreate animation from shader for CPU
    const uTime = particleMaterial.uniforms.uTime.value;
    const uSpeed = particleMaterial.uniforms.uSpeed.value;
    const uFactor = particleMaterial.uniforms.uFactor.value;
    // const uScroll = particleMaterial.uniforms.uScroll.value;

    const startPosition = position;

    let dirStartToOrigin = (new THREE.Vector3(0, 0, 0).sub(startPosition)).normalize();
    // let movementTowardOrigin = dirStartToOrigin.multiplyScalar((0.85 * Math.sin(uTime / uSpeed + uScroll) / uFactor));
    let movementTowardOrigin = dirStartToOrigin.multiplyScalar((0.85 * Math.sin(uTime / uSpeed) / uFactor));

    // let rotation = 0.5 * Math.sin(uTime / uSpeed + uScroll) - 0.55;
    let rotation = 0.5 * Math.sin(uTime / uSpeed) - 0.55;

    let axis = new THREE.Vector3(1, 1, 1);
    let quaternion = new THREE.Quaternion();
    quaternion.setFromAxisAngle(axis, rotation);

    newSphereCenter = startPosition.clone();
    newSphereCenter.add(movementTowardOrigin);
    newSphereCenter.applyQuaternion(quaternion);
    label.position.set(newSphereCenter.x, newSphereCenter.y, newSphereCenter.z);
    obj.position.set(newSphereCenter.x,newSphereCenter.y,newSphereCenter.z)
    // label.element.style.opacity = Math.sin(uTime / uSpeed + uScroll) * 0.75;
    label.element.style.opacity = Math.sin(uTime / uSpeed) * 0.75;
    requestAnimationFrame(() => transformHtmlElements(startPosition, label, obj));
}

window.addEventListener('resize', () => {
    // Update sizes
    const width: number = window.innerWidth;
    const height: number = window.innerHeight;

    // Update camera
    camera.aspect = width / height
    camera.updateProjectionMatrix()

    labelRenderer.setSize(width, height);
    // Update renderer
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Update particleMaterial
    particleMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
})

// Add a mousemove event listener to the window object
window.addEventListener('mousemove', (event: MouseEvent) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    console.log(mouse);
    //raycaster.setFromCamera(mouse, camera);
});

const clock = new THREE.Clock()

const tick = () => {
    // Update materials
    elapsedTime = clock.getElapsedTime();

    particleMaterial.uniforms.uTime.value = elapsedTime + 10;
    particleMaterial.uniforms.uTime2.value = elapsedTime + 10;

    if (particleMaterial.uniforms.uTime.value >= 15.75) {
        particleMaterial.uniforms.uTime.value = 15.75;
        triggered = true;
    }


    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

function animate(): void {

    update();

    stats.update();

    controls.update();

    labelRenderer.render(scene, camera);

    renderer.render(scene, camera);

    requestAnimationFrame(animate);
}

/*gui.add(particleMaterial.uniforms.uSize, 'value', 0, 10)
gui.add(particleMaterial.uniforms.uFactor, 'value', 0, 20)
gui.add(particleMaterial.uniforms.uSpeed, 'value', 0, 10)*/

createPoints(20, new THREE.Vector3(0.8, 0.6, 0), 'DESIGN');
createPoints(20, new THREE.Vector3(-0.8, 0.6, 0), 'TECHNOLOGY');
createPoints(20, new THREE.Vector3(0, -1.0, 0), 'CONTENT');
animate();

tick();