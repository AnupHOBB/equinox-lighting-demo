import { MISC } from './helpers/misc.js'

/**
 * Represents the hotspots that appera attached onto a 3D model
 */
export class Hotspot
{
    /**
     * @param {THREE.Vector3} worldPosition position of the hotspot in world space
     */
    constructor(worldPosition)
    {
        this.div = document.createElement('div')
        this.div.className = 'hotspot'
        this.isVisible = false
        this.lastRasterCoord = { x: -1, y: -1 }
        this.worldPosition = worldPosition
        this.input = new HotspotInput(this.div)
        this.shouldRender = ()=>{ return true }
    }

    /**
     * Sets the click callback
     * @param {Function} onClick callback function that is called when the user clicks on the hot spot 
     */
    setOnClick(onClick) { this.input.onClick = onClick }

    /**
     * Sets the double click callback
     * @param {Function} onDblClick callback function that is called when the user double clicks on the hot spot 
     */
    setOnDblClick(onDblClick) { this.input.onDoubleClick = onDblClick }

    /**
     * Sets the mouse move callback
     * @param {Function} onMove callback function that is called when the mouse or touch cursor is moved 
     */
    setOnMove(onMove) { this.input.onMove = onMove }

    /**
     * Sets the mouse or touch hold callback
     * @param {Function} onHold callback function that is called when the user clicks on the hot spot 
     */
    setOnHold(onHold) { this.input.onHold = onHold }

    /**
     * Sets the function callback that is used to check whether the hotspot should be rendered or not.
     * @param {Function} shouldRender function that returns true if the conditions are met
     */
    setRenderCondition(shouldRender) 
    {
        if (shouldRender != undefined && shouldRender != null)
            this.shouldRender = shouldRender
    }

    /**
     * Returns the world space position of hot spot
     * @returns {THREE.Vector3} position of the hot spot in world space
     */
    getWorldPosition() { return this.worldPosition }

    /**
     * Sets the raster coordinate of hotspot. This function is called by the actor that the hotspot belongs to
     * @param {Number} x x-coordinate of hotspot in raster space 
     * @param {Number} y y-coordinate of hotspot in raster space 
     */
    setRasterCoordinates(x, y)
    {
        let aspect = window.innerWidth/window.innerHeight
        if (aspect < 1)
            this.div.style = 'position: absolute; top: '+y+'; left: '+x+';'// width: auto; height: 4%; user-select: none;'
        else
            this.div.style = 'position: absolute; top: '+y+'; left: '+x+';'// width: 3%; height: auto; user-select: none;'
        if (this.lastRasterCoord.x != x || this.lastRasterCoord.y != y)
        {    
            this.input.onMove()
            this.input.press = false
        }
        this.lastRasterCoord = { x: x, y: y }
    }

    /**
     * Displays the hotspot
     */
    show()
    {
        if (!this.isVisible && this.shouldRender())
        {
            document.body.appendChild(this.div)
            this.isVisible = true
        }
    }

    /**
     * Hides the hotspot
     */
    hide()
    {
        if (this.isVisible)
        {
            document.body.removeChild(this.div)
            this.isVisible = false
        }
    }
}

/**
 * Responsible for managing hotspot inputs
 */
class HotspotInput
{
    /**
     * @param {HTMLImageElement} imageElement the image element that hols the hot spot icon
     */
    constructor(imageElement)
    {
        this.imageElement = imageElement
        this.imageElement.onmousedown = e=>this.onPress(e)
        this.imageElement.onmouseup = e=>this.onRelease(e)
        this.imageElement.ontouchstart = e=>this.onPress(e)
        this.imageElement.ontouchend = e=>this.onRelease(e)
        this.onClick = ()=>{}
        this.onMove = ()=>{}
        this.onHold = ()=>{}
        this.onDoubleClick = ()=>{}
        this.press = false
        this.clickCount = 0
    }

    /**
     * Called whenever the image element detects a mouse down or touch start event
     * @param {Event} event mouse or touch event
     */
    onPress(event)
    {
        let isDevice = MISC.isHandHeldDevice()
        if ((isDevice && event.type == 'touchstart') || (!isDevice && event.type == 'mousedown'))
        {
            if (event.type == 'touchstart')
                event = event.touches[0]
            this.press = true
            this.clickCount++
            if (this.clickCount > 2)
                this.clickCount = 2
            if (this.clickCount == 1)
            {
                setTimeout(()=>{
                    if (this.clickCount > 1)
                        this.onDoubleClick(event)
                    else
                        this.onClick(event)
                    this.clickCount = 0
                }, 250)
            }
        }        
    }

    /**
     * Called whenever the image element detects a mouse up or touch end event
     * @param {Event} event mouse or touch event
     */
    onRelease(event) { this.press = false }
}