import * as THREE from 'three'
import { GLTFLoader } from 'gltf-loader'
import { AssetLoader } from './engine/AssetLoader.js'
import { SceneManager } from './engine/SceneManager.js'
import { OrbitalCameraManager } from './engine/camera_managers/OrbitalCameraManager.js'
import { InputManager } from './engine/InputManager.js'
import { MeshActor, ShapeActor } from './engine/Actor.js'
import { AmbientLight, DirectLight } from './engine/Light.js'
import { TextureLoader } from 'three'

let assetLoader = new AssetLoader()
assetLoader.addGLTFLoader('./assets/roof.glb', new GLTFLoader())
assetLoader.addGLTFLoader('./assets/scene.glb', new GLTFLoader())
assetLoader.addGLTFLoader('./assets/envmap.png', new TextureLoader())
assetLoader.execute(p=>{}, onComplete)

/**
 * Called after asset loading is complete.
 * @param {Map} assetMap map consisting of imported assets
 */
function onComplete(assetMap)
{
    let sceneManager = new SceneManager(document.querySelector('canvas'))
    let inputManager = new InputManager('Input', document.querySelector('canvas'))
    sceneManager.register(inputManager)
    let scene = new MeshActor('Scene', assetMap.get('./assets/scene.glb'))
    scene.setPosition(-39, -10.5, 60.4)
    sceneManager.register(scene)
    let roof = new MeshActor('Roof', assetMap.get('./assets/roof.glb'))
    roof.setPosition(2, -2, -3)
    sceneManager.register(roof)
    let ambientLight = new AmbientLight('AmbientLight', 0xffffff, 0.8)
    sceneManager.register(ambientLight)
    let directLight = new DirectLight('DirectLight', new THREE.Vector3(100, 50, 0), 5, new THREE.Vector3(0, 0, -4))
    sceneManager.register(directLight)
    let background = new ShapeActor('Background', new THREE.SphereGeometry(100, 256, 16),  new THREE.MeshBasicMaterial( { color: 0xffffff,  map: assetMap.get('./assets/envmap.png'), side: THREE.BackSide }))
    background.setPosition(2, 0, -5)
    sceneManager.register(background)
    const lookAtPosition = new THREE.Vector3(0, 0, -5)
    let cameraManager = new OrbitalCameraManager('Camera', 90, lookAtPosition)
    sceneManager.register(cameraManager)
    sceneManager.setActiveCamera('Camera')
}