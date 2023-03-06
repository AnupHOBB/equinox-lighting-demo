import * as THREE from 'three'
import { MATHS } from './helpers/maths.js'

/**
 * Wrapper class around OrbitControlCore
 */
export class OrbitControl
{
    /**
     * @param {THREE.Object3D} object3D threejs object that is supposed to orbit around a point
     * @param {THREE.Vector3} lookAtPosition the point around which the object is supposed to revolve
     * @param {Function} shouldMoveFunction callback function that decides if the object position should be updated
     */
    constructor(object3D, lookAtPosition, shouldMoveFunction) { this.core = new OrbitControlCore(object3D, lookAtPosition, shouldMoveFunction) }

    /**
     * Delegates call to OrbitControlCore's orbit if its isOrbit flag is true.
     * @param {THREE.Vector3} axis the axis around which the object will orbit
     * @param {Number} speed the speed at which the object will orbit
     */
    pan(axis, speed)
    {
        if (!this.core.isOrbit)
            this.core.orbit(axis, speed)
    }

    /**
     * Delegates call to OrbitControlCore's auto if its isOrbit flag is true.
     * @param {THREE.Vector3} axis the axis around which the object will orbit
     * @param {Number} speed the speed at which the object will orbit
     */
    start(axis, speed)
    {
        if (!this.core.isOrbit)
        {
            this.core.isOrbit = true
            this.core.auto(axis, speed)
        }
    }

    /**
     * Stops the auto orbit by setting OrbitControlCore's isOrbit flag to false
     */
    stop() { this.core.isOrbit = false }
}

/**
 * Responsible for making an object orbit around a point
 */
class OrbitControlCore
{
    /**
     * @param {THREE.Object3D} object3D threejs object that is supposed to orbit around a point
     * @param {THREE.Vector3} lookAtPosition the point around which the object is supposed to revolve
     * @param {Function} shouldMoveFunction callback function that decides if the object position should be updated
     */
    constructor(object3D, lookAtPosition, shouldMoveFunction)
    {
        this.object3D = object3D
        this.lookAtPosition = lookAtPosition
        this.shouldMoveFunction = (shouldMoveFunction == undefined) ? (v)=>{return true} : shouldMoveFunction
        this.isOrbit = false
    }

    /**
     * Moves the object around the orbit. Call this if the object needs to be moved automatically.
     * @param {THREE.Vector3} axis the axis around which the object will orbit
     * @param {Number} speed the speed at which the object will orbit
     */
    auto(axis, speed)
    {
        if (this.isOrbit)
        {
            this.orbit(axis, 1)
            setTimeout(()=>this.auto(axis, speed), 1000/speed)
        }
    }

    /**
     * Moves the object around the orbit.
     * @param {THREE.Vector3} axis the axis around which the object will orbit
     * @param {Number} speed the speed at which the object will orbit
     */
    orbit(axis, speed)
    {
        let vLookAt2Src = MATHS.subtractVectors(this.object3D.position, this.lookAtPosition)
        let vLookAt2Dest = new THREE.Vector3(vLookAt2Src.x, vLookAt2Src.y, vLookAt2Src.z)
        vLookAt2Dest.applyAxisAngle(axis, MATHS.toRadians(speed))
        let offset = MATHS.subtractVectors(vLookAt2Dest, vLookAt2Src)
        let destination = MATHS.addVectors(this.object3D.position, offset)
        let [shouldMove, newDestination] = this.shouldMoveFunction(destination, this.object3D.position)
        if (shouldMove)
        {
            this.object3D.position.set(newDestination.x, newDestination.y, newDestination.z)
            this.object3D.lookAt(this.lookAtPosition)
        }
    }
}