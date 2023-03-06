import { Color } from 'three'
import { Vector3 } from 'three'

export const MISC = 
{
    /**
     * Converts rgb value as string to threejs color object
     * @param {String} str rgb value as string 
     * @returns {THREE.Color} rgb value as threejs color
     */
    toColor : function(str)
    {
        let match = str.match(/rgba?\((\d{1,3}), ?(\d{1,3}), ?(\d{1,3})\)?(?:, ?(\d(?:\.\d?))\))?/)
        return match ? new Color(match[1]/255, match[2]/255, match[3]/255) : new Color()
    },

    /**
     * Converts hexadecimal color value as string to color object
     * @param {String} hex hexadecimal color value as string
     * @returns {THREE.Color} rgb value as threejs color
     */
    hexToColor : function(hex) 
    {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
        return result ? new Color(parseInt(result[1], 16)/255, parseInt(result[2], 16)/255, parseInt(result[3], 16)/255) : new Color()
    },

    /**
     * Converts dimension value in px as string to valid numerical valu without format appended to it.
     * @param {String} pxString 
     */
    pxStringToNumber : function(pxString)
    {
        let pxValue = pxString.substring(0, pxString.length - 2)
        return Number.parseFloat(pxValue, 10)
    },

    /**
     * Checks if the app is running on handheld device or not.
     * @returns {Boolean} true if app is runnign on handheld device, false if otherwise
     */
    isHandHeldDevice : function() { return navigator.userAgent.includes('iPad') || navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('Android') },

    /**
     * Converts vector in json format to threejs vector object
     * @param {any} vectorJson vector in json format
     * @returns {THREE.Vector3} threejs vector object
     */    
    toThreeJSVector : function(vectorJson) { return new Vector3(vectorJson.x, vectorJson.y, vectorJson.z) }
}