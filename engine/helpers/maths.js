export const MATHS =
{
    /**
     * Adds two vectors
     * @param {THREE.Vector3} v1 first 3D vector
     * @param {THREE.Vector3} v2 second 3D vector
     * @returns {THREE.Vector3} sum of the two vectors as 3D vector
     */
    addVectors : function(v1, v2) { return { x: v1.x + v2.x, y: v1.y + v2.y, z: v1.z + v2.z } },

    /**
     * Subtracts two vectors
     * @param {THREE.Vector3} v1 first 3D vector
     * @param {THREE.Vector3} v2 second 3D vector
     * @returns {THREE.Vector3} difference of the two vectors as 3D vector
     */
    subtractVectors : function(v1, v2) { return { x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z } },

    /**
     * Scales vector
     * @param {THREE.Vector3} v 3D vector 
     * @param {Number} s scalar
     * @returns {THREE.Vector3} scaled 3D vector
     */
    scaleVector : function(v, s) { return { x: v.x * s, y: v.y * s, z: v.z * s } },

    /**
     * Converts angle from degrees to radians
     * @param {Number} degrees angle in degrees
     * @returns {Number} angle in radians
     */
    toRadians : function(degrees) { return (degrees * 22) / (7 * 180) },

    /**
     * Calculates the length of input 3D vector
     * @param {THREE.Vector3} v 3D vector 
     * @returns {Number} length of vector
     */
    length: function(v) { return Math.sqrt((v.x * v.x)+(v.y * v.y)+(v.z * v.z)) },

    /**
     * Calculates the cross product of two 3D vectors
     * @param {THREE.Vector3} v1 first 3D vector
     * @param {THREE.Vector3} v2 second 3D vector
     * @returns {THREE.Vector3} cross product as 3D vector
     */
    cross : function(v1, v2) { return this.normalize({ x: v1.y * v2.z - v1.z * v2.y, y: v1.z * v2.x - v1.x * v2.z, z: v1.x * v2.y - v1.y * v2.x}) },

    /**
     * Normalizes the input 3D vector
     * @param {THREE.Vector3} v 3D vector
     * @returns {THREE.Vector3} normalized 3D vector
     */
    normalize : function(v)
    {
        let len = this.length(v)
        return { x: v.x/len, y: v.y/len, z: v.z/len}
    },

    /**
     * Converts angle from radians to degrees 
     * @param {Number} radians angle in radians
     * @returns {Number} angle in degrees
     */
    toDegrees : function(radians) { return (radians * 7 * 180)/22 },

    /**
     * 
     * @param {THREE.Vector3} v1 first 3D vector
     * @param {THREE.Vector3} v2 second 3D vector
     * @returns {Number} dot product of two input 3D vectors 
     */
    dot : function (v1, v2) { return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z  }
}