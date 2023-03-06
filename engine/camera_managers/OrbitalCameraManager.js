import * as THREE from 'three'
import { PerspectiveCamera, BaseCameraManager } from './BaseCameraManager.js'
import { OrbitControl } from '../OrbitControl.js'
import { MATHS } from '../helpers/maths.js'

/**
 * Wraps OrbitalCameraManagerCore object.
 */
export class OrbitalCameraManager extends BaseCameraManager
{
    /**
     * @param {String} name name of the object which is used in sending or receiving message
     * @param {Number} fov camera field of view
     * @param {THREE.Vector3} axis orbit axis
     * @param {THREE.Vector3} lookAtPosition point to focus on during orbit
     */
    constructor(name, fov, lookAtPosition) 
    { 
        super()
        this.name = name
        this.core = new OrbitalCameraManagerCore(fov, lookAtPosition) 
    }

    /**
     * Sets the aspect ratio value in camera
     * @param {Number} ratio camera aspect ratio
     */
    setAspectRatio(ratio) { this.core.camera.aspect = ratio }

    /**
     * Delegates call to OrbitalCameraManagerCore's updateMatrices
     */
    updateMatrices() { this.core.updateMatrices() }
    
    /**
     * Delegates call to OrbitalCameraManagerCore's worldToRaster
     * @param {THREE.Vector3} worldPosition position of point in world whose raster coordinate is required
     * @returns {[THREE.Vector2, Boolean]} [raster coordinate of the point whose world coordinate was given, 
     * boolean value to indicate whether the raster coordinate is valid or not]
     */
    worldToRaster(worldPosition) { return this.core.worldToRaster(worldPosition) }

    /**
     * Delegates call to OrbitalCameraManagerCore's worldToView
     * @param {THREE.Vector3} worldPosition position of point in world whose view space coordinate is required
     * @returns {THREE.Vector3} position of point in view space whose world coordinate was given
     */
    worldToView(worldPosition) { return this.core.worldToView(worldPosition) }

    /**
     * Returns the threejs camera object stored within
     * @returns {THREE.PerspectiveCamera} threejs camera object
     */
    getCamera() { return this.core.camera }

    /**
     * Called by SceneManager when there is a message for this object posted by any other object registered in SceneManager.
     * However, this function only delegates call to OrbitalCameraManagerCore's onMessage.
     * @param {SceneManager} sceneManager the SceneManager object
     * @param {String} senderName name of the object who posted the message
     * @param {any} data any object sent as part of the message
     */
    onMessage(sceneManager, senderName, data) { this.core.onMessage(sceneManager, senderName, data) }

    /**
     * Called by SceneManager every frame.
     * However, this function only delegates call to OrbitalCameraManagerCore's onSceneRender.
     * @param {SceneManager} sceneManager the SceneManager object
     */
    onSceneRender(sceneManager) { this.core.onSceneRender(sceneManager) }

    /**
     * Called by SceneManager when this camera object is set as active.
     * However, this function only delegates call to OrbitalCameraManagerCore's onActive.
     * @param {SceneManager} sceneManager the SceneManager object
     */
    onActive(sceneManager) { this.core.onActive(sceneManager, this.name) }

    /**
     * Returns a boolean value that indicates whether the camera is zoomed in or not,
     * @returns {Boolean} the zoom status of camera
     */
    isZoomed() { return this.core.zoom }
}

/**
 * Extends the functionality of PerspectiveCameraManager to provide orbital camera feature
 */
class OrbitalCameraManagerCore extends PerspectiveCamera
{
    /**
     * @param {Number} fov camera field of view
     * @param {THREE.Vector3} axis orbit axis
     * @param {THREE.Vector3} lookAt point to focus on during orbit
     */
    constructor(fov, lookAt)
    {
        super(fov)
        this.orbitSpeed = 60
        this.cameraOrbiterYaw = new OrbitControl(this.camera, lookAt, (newPosition) => { return [newPosition.z >= -5, newPosition] })
        this.cameraOrbiterPitch = new OrbitControl(this.camera, lookAt, (newPosition) => { return [newPosition.y >= -1.7 && newPosition.y <= 4.7, newPosition] })
        this.zoom = false
        this.isZooming = false
        this.ogPosition = this.camera.position
        this.vDisplacement = new THREE.Vector3()
        this.sourcePosition = this.camera.position
        this.targetPosition = this.camera.position
        this.targetDistance = 0
        this.autoOrbiting = false
    }

    /**
     * Called by OrbitalCameraManager when there is a message for this object posted by any other object registered in SceneManager.
     * This function registers input to the input manager as soon as it receives input manager's instance as message from input manager and
     * starts zooms in and out process to louvered roof on receiving hotspot location as message from MeshActor object that hold the louvered roof model.
     * @param {SceneManager} sceneManager the SceneManager object
     * @param {String} senderName name of the object who posted the message
     * @param {any} data any object sent as part of the message
     */
    onMessage(sceneManager, senderName, data) 
    {
        if (senderName == 'Input')
        {
            let inputManager = data
            inputManager.registerMoveEvent((dx, dy) => this.onMoveEvent(dx, dy))
            inputManager.setCursorSensitivity(0.5)
        }
        else if (senderName == 'Roof')
        {       
            if (!this.isZooming)
            {
                if(!this.zoom)
                {
                    let objectPosition = data
                    let front = new THREE.Vector3()
                    this.camera.getWorldDirection(front)
                    this.ogPosition = new THREE.Vector3(this.camera.position.x, this.camera.position.y, this.camera.position.z)
                    this.targetPosition = MATHS.subtractVectors(objectPosition, front)
                    this.zoom = true 
                }
                else
                {
                    this.targetPosition = this.ogPosition
                    this.zoom = false            
                }
                this.sourcePosition = new THREE.Vector3(this.camera.position.x, this.camera.position.y, this.camera.position.z)
                let vDisplacementActual = MATHS.subtractVectors(this.targetPosition, this.sourcePosition)
                this.targetDistance = MATHS.length(vDisplacementActual)
                this.vDisplacement = MATHS.scaleVector(MATHS.normalize(vDisplacementActual), 0.1)
                this.isZooming = true
            }
        }
    }

    /**
     * Called by OrbitalCameraManager every frame.
     * This function performs the actual zoom in and out process once it has started in onMessage.
     * @param {SceneManager} sceneManager the SceneManager object
     */
    onSceneRender(sceneManager) 
    {
        if (this.isZooming)
        {
            let newPosition = MATHS.addVectors(this.camera.position, this.vDisplacement)
            let travelDistance = MATHS.length(MATHS.subtractVectors(newPosition, this.sourcePosition))
            if (travelDistance <= this.targetDistance)   
                this.camera.position.set(newPosition.x, newPosition.y, newPosition.z)
            else
                this.isZooming = false
        }
    }

    /**
     * Called by OrbitCameraManager when this camera object is set as active.
     * Once its active, it broadcasts message to input manger demanding for its instance.
     * @param {SceneManager} sceneManager the SceneManager object
     */
    onActive(sceneManager, myName) { sceneManager.broadcastTo(myName, 'Input', null) }

    /**
     * Called by InputManager whenever it detects mouse movement. This function is only called
     * when the user holds LMB or RMB and moves the mouse.
     * This function rotates the the camera around based on mouse movement.
     * @param {Number} deltaX displacement of cursor in x-direction
     * @param {Number} deltaY displacement of cursor in y-direction
     * @param {Number} x position of cursor in x-axis
     * @param {Number} y position of cursor in y-axis
     */
    onMoveEvent(deltaX, deltaY, x, y) 
    { 
        if (!this.zoom && !this.isZooming)
        {    
            this.cameraOrbiterYaw.pan(new THREE.Vector3(0, 1, 0), -deltaX) 
            this.cameraOrbiterPitch.pan(this.right, -deltaY)
        }
    }
}