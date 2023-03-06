import * as THREE from 'three'
import { SceneObject } from '../SceneManager.js'
import { MATHS } from '../helpers/maths.js'
import { MATRIX } from '../helpers/matrix.js'

/**
 * Parent class for all camera managers
 */
export class BaseCameraManager extends SceneObject
{
    /**
     * Returns the threejs camera object stored within
     * @returns {THREE.PerspectiveCamera} threejs camera object
     */
    getCamera() { return null }

    /**
     * Called by SceneManager when this camera object is set as active.
     * @param {SceneManager} sceneManager the SceneManager object
     */
    onActive(sceneManager) {}

    /**
     * Returns a boolean value that indicates whether the camera is zoomed in or not,
     * @returns {Boolean} the zoom status of camera
     */
    isZoomed() { return false }
}

/**
 * Base class for all perspective cameras
 */
export class PerspectiveCamera
{
    /**
     * @param {Number} fov camera field of view
     */
    constructor(fov)
    {
        this.camera = new THREE.PerspectiveCamera(fov, window.innerWidth/window.innerHeight, 0.1, 1000)
        this.camera.rotation.order = 'YXZ'
        this.front = new THREE.Vector3()
        this.right = new THREE.Vector3()
        this.up = new THREE.Vector3()
        this.viewMatrix = this.getViewMatrix()
    }

    /**
     * Converts the world coordinate value of a point in raster coordinate and also returns a boolean to indicate
     * whether that raster coordinate is valid or not 
     * @param {THREE.Vector3} worldPosition position of point in world whose raster coordinate is required
     * @returns {[THREE.Vector2, Boolean]} [raster coordinate of the point whose world coordinate was given, 
     * boolean value to indicate whether the raster coordinate is valid or not]
     */
    worldToRaster(worldPosition)
    {
        let viewPosition = MATRIX.mat4XVec3(this.viewMatrix, worldPosition)
        if (viewPosition.z < this.camera.near || viewPosition.z > this.camera.far)
            return [, false]
        let projectedX = (this.camera.near * viewPosition.x)/viewPosition.z
        let projectedY = (this.camera.near * viewPosition.y)/viewPosition.z
        let screenTopBound = this.camera.near * Math.tan(MATHS.toRadians(this.camera.fov/2))
        let screenBottomBound = -screenTopBound
        let screenRightBound = screenTopBound * this.camera.aspect
        let screenLeftBound = -screenRightBound
        if (projectedX < screenLeftBound || projectedX > screenRightBound)
            return [, false]
        if (projectedY < this.screenBottomBound || projectedY > screenTopBound)
            return [, false]
        let rasterX = (window.innerWidth * (projectedX - screenLeftBound))/(screenRightBound - screenLeftBound)
        let rasterY = (window.innerHeight * (screenTopBound - projectedY))/(screenTopBound - screenBottomBound) 
        return [{ x: rasterX, y: rasterY }, true]
    }

    /**
     * Converts the world coordinate value of a point in view space or camera space coordinate
     * @param {THREE.Vector3} worldPosition position of point in world whose view space coordinate is required
     * @returns {THREE.Vector3} position of point in view space whose world coordinate was given
     */
    worldToView(worldPosition)
    {
        return MATRIX.mat4XVec3(this.viewMatrix, worldPosition)
    }

    /**
     * Called to update the camera view matrix whenever any camera properties is changed
     */
    updateMatrices()
    {
        this.camera.updateProjectionMatrix()
        this.viewMatrix = this.getViewMatrix()
    }

    /**
     * Generates and returns camera view matrix
     * @returns {Float32Array} Multi-dimension float array that stores the view matrix
     */
    getViewMatrix()
    {
        this.camera.getWorldDirection(this.front)
        this.right = MATHS.cross(this.front, new THREE.Vector3(0, 1, 0))
        this.up = MATHS.cross(this.right, this.front)
        return [
            [ this.right.x, this.right.y, this.right.z, -MATHS.dot(this.camera.position, this.right) ],
            [ this.up.x, this.up.y, this.up.z, -MATHS.dot(this.camera.position, this.up) ],
            [ this.front.x, this.front.y, this.front.z, -MATHS.dot(this.camera.position, this.front)],
            [ 0, 0, 0, 1 ]
        ]
    }
}