import * as THREE from 'three'
import { SceneObject } from './SceneManager.js'

/**
 * Responsible for raycasting. Ray casting is done here in world space.
 */
export class RayCast
{
    constructor()
    {
        this.raycastObjects = []
        this.rayCaster = new THREE.Raycaster()
    }

    /**
     * Adds scene objects for ray casting
     * @param {SceneObject} raycastObject 
     */
    add(raycastObject) { this.raycastObjects.push(raycastObject) }

    /**
     * Raycasts among objects and returns the hit point.
     * @param {THREE.Vector2} rasterCoord raster coordinate that is used as the ray cast origin point
     * @param {BaseCameraManager} cameraManager BaseCameraManager object
     * @returns {THREE.Vector3} hit point in world space
     */
    raycast(rasterCoord, cameraManager)
    {
        let screenSpaceX = (rasterCoord.x / window.innerWidth) *  2 - 1
        let screenSpaceY = -(rasterCoord.y / window.innerHeight) *  2 + 1
        this.rayCaster.setFromCamera({ x: screenSpaceX, y: screenSpaceY }, cameraManager.getCamera())
        let hitObjects = this.rayCaster.intersectObjects(this.raycastObjects)
        return (hitObjects.length > 0) ? hitObjects[0].point : undefined
    }
}