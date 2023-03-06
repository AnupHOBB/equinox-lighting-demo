import * as THREE from 'three'
import { SceneObject } from './SceneManager.js'
import { MATHS } from './helpers/maths.js'
import { MISC } from './helpers/misc.js'
import { OrbitControl } from './OrbitControl.js'

/**
 * Wraps the threejs ambient light object
 */
export class AmbientLight extends SceneObject
{
    constructor(name, color, intensity) 
    {
        super()
        this.name = name 
        this.light = new THREE.AmbientLight(color, intensity) 
    }

    /**
     * Used for notifying the SceneManager if this object is ready to be included in scene.
     * @returns {Boolean} ready status of object
     */
    isReady() { return true }

    /**
     * Returns the list of drawable threejs meshes
     * @returns {Array} array of threejs mesh objects
     */
    getDrawables() { return [{object: this.light, isRayCastable: false}] }

    /**
     * Used for notifying the SceneManager if this object is drawable in screen.
     * @returns {Boolean} drawable status of camera
     */
    isDrawable() { return true }
}

/**
 * Wraps the threejs direct light object
 */
export class DirectLight extends SceneObject
{
    constructor(name, position, size, lookAt) 
    { 
        super()
        this.name = name 
        this.enableGizmo = false
        this.enabled = false
        this.light = new THREE.DirectionalLight(0xffffff, 0.2)
        this.light.position.set(position.x, position.y, position.z)  
        this.light.castShadow = true
        this.light.shadow.mapSize.width = 1024
        this.light.shadow.mapSize.height = 1024
        this.light.shadow.camera.near = 0.1
        this.light.shadow.camera.far = 200
        this.light.shadow.camera.left = -10
        this.light.shadow.camera.right = 10
        this.light.shadow.camera.bottom = -10
        this.light.shadow.camera.top = 10
        this.light.shadow.bias = -0.0005
        this.gizmo = new THREE.CameraHelper(this.light.shadow.camera) 
        this.mesh = new THREE.Mesh(new THREE.SphereGeometry(size, 64, 32), new THREE.MeshBasicMaterial({color: 0xFCE570}))
        this.mesh.position.set(position.x, position.y, position.z)
        this.lightOrbiter = new OrbitControl(this.light, lookAt)
        this.meshOrbiter = new OrbitControl(this.mesh, lookAt)
        this.lookAt = lookAt
    }

    /**
     * Sets the enableGizmo flag to true,
     * @param {Boolean} enableGizmo boolean value that is used for displaying the light gizmo
     */
    showGizmo(enableGizmo) { this.enableGizmo = enableGizmo }

    /**
     * Moves the light and the sphere mesh around an orbit 
     * @param {Number} speed float value used for controlling the orbit speed.
     */
    orbit(speed) 
    { 
        this.lightOrbiter.pan(new THREE.Vector3(0, 1, 0), speed)
        this.meshOrbiter.pan(new THREE.Vector3(0, 1, 0), speed)
    }

    /**
     * Moves the light from east to west
     * @param {Number} speed float value used for controlling the movement speed.
     */
    moveEastToWest(speed)
    {
        let vRoofToLight = MISC.toThreeJSVector(MATHS.subtractVectors(this.light.position, this.lookAt))
        vRoofToLight.applyAxisAngle(new THREE.Vector3(0, 0, 1), MATHS.toRadians(speed))
        let newPosition = MATHS.addVectors(this.lookAt, vRoofToLight)
        this.light.position.set(newPosition.x, newPosition.y, newPosition.z)
        this.mesh.position.set(newPosition.x, newPosition.y, newPosition.z)
    }

    /**
     * Called by SceneManager when there is a message for this object posted by any other object registered in SceneManager.
     * @param {SceneManager} sceneManager the SceneManager object
     * @param {String} senderName name of the object who posted the message
     * @param {any} data any object sent as part of the message
     */
    onMessage(sceneManager, senderName, data) 
    { 
        if (senderName == 'Slider')
            this.moveEastToWest(data)
    }

    /**
     * Called by SceneManager every frame.
     * If enableGizmo is true, then this function will add the gizmo into the scene for display.
     * If enableGizmo is false, then this function will remove the gizmo from the scene.
     * @param {SceneManager} sceneManager the SceneManager object
     */
    onSceneRender(sceneManager) 
    {
        if (this.enableGizmo && !this.enabled)
        {    
            sceneManager.add(this.gizmo, false)
            this.enabled = true
        }
        else if (!this.enableGizmo && this.enabled) 
        {    
            sceneManager.remove(this.gizmo)
            this.enabled = false
        }
    }

    /**
     * Used for notifying the SceneManager if this object is ready to be included in scene.
     * @returns {Boolean} ready status of object
     */
    isReady() { return true }
    /**
     * Returns the list of drawable threejs meshes
     * @returns {Array} array of threejs mesh objects
     */
    getDrawables() { return [{object: this.light, isRayCastable: false}, {object: this.mesh, isRayCastable: false}] }

    /**
     * Used for notifying the SceneManager if this object is drawable in screen.
     * @returns {Boolean} drawable status of object 
     */
    isDrawable() { return true }
}