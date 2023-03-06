export const MATRIX =
{
    /**
     * Multiplies 4x4 matrix with 3D vector
     * @param {Float32Array} m 4x4 matrix
     * @param {THREE.Vector3} v 3D vector
     * @returns {THREE.Vector3} multiplied 3D vector
     */
    mat4XVec3 : function (m, v)
    {
        let x = m[0][0] * v.x + m[0][1] * v.y + m[0][2] * v.z + m[0][3]
        let y = m[1][0] * v.x + m[1][1] * v.y + m[1][2] * v.z + m[1][3]
        let z = m[2][0] * v.x + m[2][1] * v.y + m[2][2] * v.z + m[2][3]
        return { x: x, y: y, z: z }
    },

    /**
     * Multiplies two 4x4 matrices
     * @param {Float32Array} m1 4x4 matrix
     * @param {Float32Array} m2 4x4 matrix
     * @returns {Float32Array} multiplied 4x4 matrix
     */
    mat4Xmat4 : function (m1, m2)
    {
        let m3 = []
        for (let r=0; r<4; r++)
        {
            let row = []
            for (let c=0; c<4; c++)
            {
                let n = 0
                for (let i=0; i<4; i++)
                    n += m1[r][i] * m2[i][c]
                row.push(n)
            }
            m3.push(row)
        }
        return m3
    }
}