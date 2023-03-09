import * as THREE from 'three'
import { GLTFLoader } from 'gltf-loader'
import { AssetLoader } from './engine/AssetLoader.js'
import { SceneManager } from './engine/SceneManager.js'
import { OrbitalCameraManager } from './engine/camera_managers/OrbitalCameraManager.js'
import { FirstPersonCameraManager } from './engine/camera_managers/FirstPersonCameraManager.js'
import { InputManager } from './engine/InputManager.js'
import { MeshActor, ShapeActor } from './engine/Actor.js'
import { AmbientLight, DirectLight } from './engine/Light.js'
import { TextureLoader } from 'three'

let assetLoader = new AssetLoader()
assetLoader.addGLTFLoader('./assets/eq_animation.glb', new GLTFLoader())
assetLoader.addGLTFLoader('./assets/scene.glb', new GLTFLoader())
assetLoader.addTextureLoader('./assets/envmap.png', new TextureLoader())
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
    
    let roof = new MeshActor('Roof', assetMap.get('./assets/eq_animation.glb'))
    roof.setPosition(2, -2, -3)
    sceneManager.register(roof)
    
    let ambientLight = new AmbientLight('AmbientLight', 0xffffff, 1)
    sceneManager.register(ambientLight)
    
    let directLight = new DirectLight('DirectLight', new THREE.Vector3(30, 108, -2.8), 5, new THREE.Vector3(0, 0, -4))//80, 78, -0.8
    sceneManager.register(directLight)
    
    let background = new ShapeActor('Background', new THREE.SphereGeometry(200, 256, 16),  new THREE.MeshBasicMaterial( { color: 0xffffff,  map: assetMap.get('./assets/envmap.png'), side: THREE.BackSide }))
    background.setPosition(2, 0, -5)
    sceneManager.register(background)

    const lookAtPosition = new THREE.Vector3(0, 0, -5)
    let cameraManager = new OrbitalCameraManager('Camera', 90, lookAtPosition)
    sceneManager.register(cameraManager)
    sceneManager.setActiveCamera('Camera')

    let prevSliderDirectionValue = 0
    let sliderDirection = document.getElementById('slider-direction')
    sliderDirection.addEventListener('input', ()=>{
        sceneManager.broadcastTo('SliderDirection', 'DirectLight', { delta: sliderDirection.value - prevSliderDirectionValue, percent: sliderDirection.value/sliderDirection.max })
        prevSliderDirectionValue = sliderDirection.value
    })

    let prevSliderDaynight = 0
    let sliderDaynight = document.getElementById('slider-daynight')
    sliderDaynight.addEventListener('input', ()=>{
        sceneManager.broadcastTo('SliderDaynight', 'DirectLight', { delta: sliderDaynight.value - prevSliderDaynight, percent: sliderDaynight.value/sliderDaynight.max } )
        prevSliderDaynight = sliderDaynight.value
    })

    let prevSliderSeason = 0
    let sliderSeason = document.getElementById('slider-season')
    sliderSeason.addEventListener('input', ()=> {
        sceneManager.broadcastTo('SliderSeason', 'DirectLight', { delta: prevSliderSeason - sliderSeason.value, percent: sliderSeason.value/sliderSeason.max })
        prevSliderSeason = sliderSeason.value
    })

    let prevSliderRoof = 0
    let sliderRoof = document.getElementById('slider-roof')
    sliderRoof.addEventListener('input', ()=> {
        sceneManager.broadcastTo('Slider', 'Roof', ((sliderRoof.value - prevSliderRoof)/180))
        prevSliderRoof = sliderRoof.value
    })
}