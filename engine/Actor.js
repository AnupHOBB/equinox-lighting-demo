import * as THREE from 'three'
import { SceneManager, SceneObject } from './SceneManager.js'

/**
 * Represents the floor onto which the louver roof stands. It wraps Threejs Mesh.
 */
export class ShapeActor extends SceneObject
{
    /**
     * @param {String} name name of the object which is used in sending or receiving message
     * @param {THREE.BoxGeometry} geometry threejs geometry class that holds the vertex data 
     * @param {THREE.MeshLambertMaterial} material threejs material class that holds the shader
     * @param {Boolean} supportShadow used to set receiveShadow varible of the mesh
     */
    constructor(name, geometry, material, supportShadow)
    {
        super()
        this.name = name
        this.mesh = new THREE.Mesh(geometry, material)
        this.mesh.receiveShadow = supportShadow
    }

    /**
     * Applies texture on the floor object.
     * @param {THREE.Texture} texture threejs texture object
     */
    applyTexture(texture) { this.mesh.material.map = texture }

    /**
     * Applies color on the floor object.
     * @param {THREE.Color} color threejs color object 
     */
    applyColor(color) { this.mesh.material.color = color }

    /**
     * Sets the position of the floor in world space
     * @param {Number} x x-coordinate in world space
     * @param {Number} y y-coordinate in world space
     * @param {Number} z z-coordinate in world space 
     */
    setPosition(x, y, z) { this.mesh.position.set(x, y, z) }

    /**
     * Returns the list of drawable threejs meshes
     * @returns {Array} array of threejs mesh objects
     */
    getDrawables() { return [{object: this.mesh, isRayCastable: true}] }

    /**
     * Used for notifying the SceneManager if this object should be included in raycasting.
     * @returns {Boolean} drawable status of object
     */
    isDrawable() { return true }
}

/**
 * Wraps MeshActorCore object.
 */
export class MeshActor extends SceneObject
{
    /**
     * @param {String} name name of the object which is used in sending or receiving message
     * @param {any} model 3D model data
     */
    constructor(name, model) 
    {
        super()
        this.name = name 
        this.core = new MeshActorCore(model)
    }

    /**
     * Delegates call to MeshActorCore updateAnimationFrame
     * @param {*} deltaSeconds the time difference of the target animation frame from the current animation frame
     */
    updateAnimationFrame(deltaSeconds) { this.core.updateAnimationFrame(deltaSeconds) } 

    /**
     * Delegates call to MeshActorCore setPosition
     * @param {Number} x x-coordinate in world space
     * @param {Number} y y-coordinate in world space
     * @param {Number} z z-coordinate in world space 
     */
    setPosition(x, y, z) { this.core.setPosition(x, y, z) }

    /**
     * Returns world space position of the mesh
     * @returns {THREE.Vector3} world space position of mesh 
     */
    getPosition() { return this.core.position }

    /**
     * Applies texture on the floor object.
     * @param {THREE.Texture} texture threejs texture object
     */
    applyTexture(texture) { this.core.applyTexture(texture) }

    /**
     * Delegates call to MeshActorCore applyColor
     * @param {THREE.Color} color threejs color object 
     */
    applyColor(color) { this.core.applyColor(color) }

    /**
     * Delegates call to MeshActorCore changeTexture
     * @param {THREE.Color} color threejs color object 
     */
    changeTexture() { this.core.changeTexture() }

    /**
     * Adds a selectable hot spot object in the mesh
     * @param {Hotspot} hotSpot hotspot object to be added as part of mesh
     */
    addHotSpots(hotSpot) { this.core.hotspots.push(hotSpot) }

    /**
     * Called by SceneManager when there is a message for this object posted by any other object registered in SceneManager.
     * @param {SceneManager} sceneManager the SceneManager object
     * @param {String} senderName name of the object who posted the message
     * @param {any} data any object sent as part of the message
     */
    onMessage(sceneManager, senderName, data) { this.core.onMessage(sceneManager, senderName, data) }

    /**
     * Called by SceneManager as soon as the object gets registered in SceneManager.
     * However, this function only delegates call to MeshActorCore's onSceneRender.
     * @param {SceneManager} sceneManager the SceneManager object
     */
    onSceneRender(sceneManager) { this.core.onSceneRender(sceneManager) }

    /**
     * Used for notifying the SceneManager if this object is ready to be included in scene.
     * @returns {Boolean} ready status of object
     */
    isReady() { return true }

    /**
     * Returns the list of drawable threejs meshes
     * @returns {Array} array of threejs mesh objects
     */
    getDrawables() { return this.core.getDrawables() }

    /**
     * Used for notifying the SceneManager if this object is drawable in screen.
     * @returns {Boolean} drawable status of object 
     */
    isDrawable() { return true }
}

/**
 * Core class that represents any GLTF 3D model. Here, it wraps the GLTF model. 
 */
class MeshActorCore
{
    /**
     * @param {any} model 3D model data
     */
    constructor(model)
    {
        this.meshes = []
        model.scene.children.forEach(mesh=>this.meshes.push(mesh))
        this.meshes.forEach(mesh => {
            mesh.children.forEach(child => {
                child.material.shadowSide = THREE.BackSide
                child.material.metalness = 0
                child.receiveShadow = true
                child.castShadow = true
            })
        })
        const clip = model.animations[0]
        this.mixer = null
        if (clip != null && clip != undefined)
        {
            this.mixer = new THREE.AnimationMixer(model.scene)
            this.mixer.clipAction(clip).play()
            this.mixer.update(0.6)
        }
        this.hotspots = []
        this.position = new THREE.Vector3()
        this.roofBound = new THREE.Mesh(new THREE.BoxGeometry(4.75, 0.5, 3.3), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }))
        this.roofBound.position.set(-0.1, 0.5, -4.65)
    }

    /**
     * Renders new animation frame
     * @param {Number} deltaSeconds the time difference of the target animation frame from the current animation frame  
     */
    updateAnimationFrame(deltaSeconds) 
    { 
        if (this.mixer != null)
            this.mixer.update(deltaSeconds)
    } 

    /**
     * Sets the position of the mesh in world space
     * @param {Number} x x-coordinate in world space
     * @param {Number} y y-coordinate in world space
     * @param {Number} z z-coordinate in world space 
     */
    setPosition(x, y, z)
    {
        this.position.x = x
        this.position.y = y
        this.position.z = z
        this.meshes.forEach(mesh => {
            mesh.position.x += this.position.x
            mesh.position.y += this.position.y
            mesh.position.z += this.position.z
        })
    }

    /**
     * Applies texture on the floor object.
     * @param {THREE.Texture} texture threejs texture object
     */
    applyTexture(texture) { this.meshes.forEach(mesh => mesh.children.forEach(child => child.material.map = texture)) }

    /**
     * Stores the new color that needs to be applied
     * @param {THREE.Color} color threejs color object 
     */
    applyColor(color) { this.meshes.forEach(mesh => mesh.children.forEach(child => child.material.color = color)) }

    /**
     * Called by SceneManager when there is a message for this object posted by any other object registered in SceneManager.
     * @param {SceneManager} sceneManager the SceneManager object
     * @param {String} senderName name of the object who posted the message
     * @param {any} data any object sent as part of the message
     */
    onMessage(sceneManager, senderName, data) 
    {
        if (senderName == 'Slider')
            this.updateAnimationFrame(data)
        else if (senderName == 'ColorMenu')
            this.applyColor(data)
        else if (senderName == 'Hotspot')
            this.hotspots.push(data)
    }

    /**
     * Called by OrbitalCameraManager every frame.
     * This function performs the actual zoom in and out process once it has started in onMessage.
     * @param {SceneManager} sceneManager the SceneManager object
     */
    onSceneRender(sceneManager)
    {
        if (this.hotspots.length > 0)
        {
            for (let hotSpot of this.hotspots)
            {
                let [rasterCoord, showHotSpot] = sceneManager.getRasterCoordIfNearest(hotSpot.getWorldPosition())
                if (showHotSpot)
                {    
                    hotSpot.setRasterCoordinates(rasterCoord.x, rasterCoord.y)
                    hotSpot.show()
                }
                else
                    hotSpot.hide()
            }
        }
    }

    /**
     * Returns the list of drawable threejs meshes
     * @returns {Array} array of threejs mesh objects
     */
    getDrawables() 
    {
        let drawables = []
        drawables.push({object: this.roofBound, isRayCastable: true}) 
        this.meshes.forEach(mesh => drawables.push({object: mesh, isRayCastable: false}) )
        return drawables
    }
}