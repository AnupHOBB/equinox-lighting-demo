import * as THREE from 'three'
import { RayCast } from './RayCast.js'

/**
 * Parent class for all actors, camera managers and any object that appears as part of the scene
 */
export class SceneObject
{
    /**
     * Called by SceneManager when there is a message for this object posted by any other object registered in SceneManager.
     * @param {SceneManager} sceneManager the SceneManager object
     * @param {String} senderName name of the object who posted the message
     * @param {any} data any object sent as part of the message
     */
    onMessage(sceneManager, senderName, data) {}

    /**
     * Called by SceneManager as soon as the object gets registered in SceneManager.
     * @param {SceneManager} sceneManager the SceneManager object
     */
    onSceneStart(sceneManager) {}

    /**
     * Called by SceneManager every frame.
     * @param {SceneManager} sceneManager the SceneManager object
     */
    onSceneRender(sceneManager) {}

    /**
     * Used for notifying the SceneManager if this object is ready to be included in scene.
     * @returns {Boolean}
     */
    isReady() { return true }

    /**
     * Returns the list of drawable threejs meshes
     * @returns {Array} array of threejs mesh objects
     */
    getDrawables() { return [] }

    /**
     * Used for notifying the SceneManager if this object should be included in raycasting.
     * @returns {Boolean}
     */
    isDrawable() { return false }
}

/**
 * Wraps SceneCore object.
 */
export class SceneManager
{
    /**
     * @param {HTMLCanvasElement} canvas HTML canvas element
     */
    constructor(canvas) { this.core = new SceneCore(canvas, this) }

    /**
     * Delegates call to SceneCore's register.
     * @param {SceneObject} sceneObject sceneObject that needs to be registered in the scene manager
     */
    register(sceneObject) { this.core.register(sceneObject) }

    /**
     * Removes the threejs object from the active scene.
     * @param {Object3D} threeJSObject instance of object3D that needs to be removed from the scene
     */
    remove(threeJSObject) { this.core.scene.remove(threeJSObject) }

    /**
     * Delegates call to SceneCore's getRasterCoordIfNearest.  
     * @param {THREE.Vector3} worldPosition position of point in world whose raster coordinate is required
     * @returns {[THREE.Vector2, Boolean]} [raster coordinate of the point whose world coordinate was given, 
     * boolean value to indicate whether the raster coordinate is valid or not]
     */
    getRasterCoordIfNearest(worldPosition) { return this.core.getRasterCoordIfNearest(worldPosition) }

    /**
     * Delegates call to SceneCore's setActiveCamera.  
     * @param {String} name name of the camera to be activated. 
     */
    setActiveCamera(name) { this.core.setActiveCamera(name) }

    /**
     * Delegates call to SceneCore's broadcastTo.  
     * @param {String} from name of the object that broadcasted the data
     * @param {String} to name of the object that should receive the data
     * @param {any} data data to be received by the receiver
     */
    broadcastTo(from, to, data) { this.core.broadcastTo(from, to, data) }

    /**
     * Delegates call to SceneCore's broadcastToAll.   
     * @param {String} from name of the object that broadcasted the data
     * @param {any} data data to be received by all objects
     */
    broadcastToAll(from, data) { this.core.broadcastToAll(from, data) }
}

/**
 * Manages the render loop, notifies the scene objects when they ae registered and on every frame and
 * facilitates messaging between scene objects.
 */
class SceneCore
{
    /**
     * @param {HTMLCanvasElement} canvas HTML canvas element
     * @param {SceneManager} sceneManager the SceneManager object
     */
    constructor(canvas, sceneManager)
    {
        this.renderer = new THREE.WebGLRenderer({canvas, antialias:true})
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        this.scene = new THREE.Scene()
        this.sceneManager = sceneManager
        this.rayCast = new RayCast()
        this.activeCameraManager = null
        this.sceneObjectMap = new Map()
        this.inactiveObjNameMap = new Map()
        this.noticeBoard = []
        window.requestAnimationFrame(()=>this.renderLoop())
    }

    /**
     * Registers the SceneObject into SceneManager.
     * The object provided to this function will receive callbacks but it won't be visible into the threejs scene.
     * @param {SceneObject} sceneObject sceneObject that needs to be registered in the scene manager.
     */
    register(sceneObject)
    {
        this.sceneObjectMap.set(sceneObject.name, sceneObject)
        if (sceneObject.isDrawable() && !sceneObject.isReady())
            this.inactiveObjNameMap.set(sceneObject.name, null)
        else if (sceneObject.isReady())
        {
            this.addToScene(sceneObject.getDrawables())     
            sceneObject.onSceneStart(this.sceneManager)
        }
        this.popNoticeBoard(sceneObject)
    }

    /**
     * Checks any messages for the scene object in the notice board and sends that message to it if there is one.
     * @param {*} sceneObject sceneObject that needs to be notified if a message was posted for it.
     */
    popNoticeBoard(sceneObject)
    {
        for (let notice of this.noticeBoard)
        {
            if (notice.to == sceneObject.name)
            {    
                sceneObject.onMessage(this.sceneManager, notice.from, notice.data)
                this.noticeBoard.splice(this.noticeBoard.indexOf(notice), 1) 
            }
        }
    }

    /**
     * Converts the world coordinate value of a point in raster coordinate and also returns a boolean to indicate
     * whether that raster coordinate is valid or not.
     * The raster value will only be returned if the world position given is the nearest and is not occluded by any other object 
     * in the scene. This is checked by performing a ray cast at that point. 
     * @param {THREE.Vector3} worldPosition position of point in world whose raster coordinate is required
     * @returns {[THREE.Vector2, Boolean]} [raster coordinate of the point whose world coordinate was given, 
     * boolean value to indicate whether the raster coordinate is valid or not]
     */
    getRasterCoordIfNearest(worldPosition)
    {
        let [rasterCoord, isValid] = this.activeCameraManager.worldToRaster(worldPosition)
        if (isValid)
        {        
            let hitPointWorld = this.rayCast.raycast(rasterCoord, this.activeCameraManager)
            isValid &&= hitPointWorld != undefined
            if (isValid)
            {
                let viewPosition = this.activeCameraManager.worldToView(worldPosition)
                let hitPointView = this.activeCameraManager.worldToView(hitPointWorld)
                isValid &&= viewPosition.z <= hitPointView.z
            }
        } 
        return [rasterCoord, isValid]
    }

    /**
     * Sets that camera as active whose name is given.
     * @param {String} name name of the camera to be activated. 
     */
    setActiveCamera(name) 
    {
        let cameraManager = this.sceneObjectMap.get(name)
        if (cameraManager != null && cameraManager != undefined)
        {
            this.activeCameraManager = cameraManager
            this.activeCameraManager.onActive(this.sceneManager)
        } 
    }

    /**
     * Allows scene objects to send message to a particular scene object.
     * @param {String} from name of the object that broadcasted the data
     * @param {String} to name of the object that should receive the data
     * @param {any} data data to be received by the receiver
     */
    broadcastTo(from, to, data)
    {
        let sceneObject = this.sceneObjectMap.get(to)
        if (sceneObject != undefined)
            sceneObject.onMessage(this.sceneManager, from, data)
        else
            this.noticeBoard.push({ from: from, to: to, data: data })
    }

    /**
     * Allows scene objects to send message to all scene objects.
     * @param {String} from name of the object that broadcasted the data
     * @param {any} data data to be received by all objects
     */
    broadcastToAll(from, data)
    {
        let sceneObjectKeys = this.sceneObjectMap.keys()
        for (let sceneObjectKey of sceneObjectKeys)
            if (sceneObjectKey != from)
                this.sceneObjectMap.get(sceneObjectKey).onMessage(this.sceneManager, from, data)     
    }

    /**
     * The loop that renders all drawable objects into the screen.
     * This functions resizes camera based on screen aspect ratio, checks if there are any new objects ready to be part of scene,
     * and notifies thos objects at the end of each iteration of render loop.
     */
    renderLoop()
    {
        if (this.activeCameraManager != null && this.activeCameraManager != undefined)
        {
            this.activeCameraManager.setAspectRatio(window.innerWidth/window.innerHeight)
            this.activeCameraManager.updateMatrices()
            this.queryReadyObjects()
            this.renderer.setSize(window.innerWidth, window.innerHeight)
            this.renderer.render(this.scene, this.activeCameraManager.getCamera())
            this.notifyObjects()
        }
        window.requestAnimationFrame(()=>this.renderLoop())
    }

    /**
     * Notifies scene object at the end of every iteration of the render loop.
     */
    notifyObjects()
    {
        let sceneObjects = this.sceneObjectMap.values()
        for (let sceneObject of sceneObjects)
            sceneObject.onSceneRender(this.sceneManager)
    }

    /**
     * Checks if any inactive but registered scene objects are ready to be part of the scene
     */
    queryReadyObjects()
    {
        if (this.inactiveObjNameMap.size > 0) 
        {
            let inactiveObjNames = this.inactiveObjNameMap.keys()
            for (let sceneObjectName of inactiveObjNames)
            {
                let sceneObject = this.sceneObjectMap.get(sceneObjectName)
                if (sceneObject.isReady())
                {   
                    this.addToScene(sceneObject.getDrawables())
                    sceneObject.onSceneStart(this.sceneManager)
                    this.inactiveObjNameMap.delete(sceneObjectName)
                } 
            }
        }
    }

    /**
     * Adds a threejs object into the threejs scene within SceneCore and ragisters that same object as ray castable if rayCastable value is true.
     * @param {Array} drawables array of drawable object in this format : {object: THREE.Object3D, isRayCastable: Boolean}
     */
    addToScene(drawables) 
    { 
        for (let drawable of drawables)
        {
            this.scene.add(drawable.object) 
            if (drawable.isRayCastable)
                this.rayCast.add(drawable.object)
        }
    } 
}