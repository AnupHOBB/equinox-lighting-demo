import { SceneObject } from './SceneManager.js'
import { MISC } from './helpers/misc.js'

/**
 * Responsible for notifying objects whenever user provides a mouse, touch or key input
 */
export class InputManager extends SceneObject
{ 
    /**
     * @param {String} name name of the object which is used in sending or receiving message
     * @param {HTMLCanvasElement} canvas HTML canvas element
     */
    constructor(name, canvas)
    {
        super()
        this.name = name
        this.keyEvent = new KeyEventCore()
        this.mouseEvent = new MouseEventCore(canvas)
    }

    /**
     * Registers key event callbacks
     * @param {Function} callback callback that is called whenever user presses a key in keyboard 
     */
    registerKeyEvent(callback) { this.keyEvent.callbacks.push(callback) }

    /**
     * Delegates call to KeyEventCore notify
     */
    notifyKeyEvent() { this.keyEvent.notify() }

    /**
     * Sets the mouse sensitivity value
     * @param {Number} sensitivity 
     */
    setCursorSensitivity(sensitivity)
    {
        if (sensitivity != null && sensitivity != undefined)
            this.mouseEvent.sensitivity = sensitivity
    }

    /**
     * Registers mouse click callbacks
     * @param {Function} onClick callback that is called whenever user click on mouse
     */
    registerClickEvent(onClick)
    {
        if (onClick != null && onClick != undefined)
            this.mouseEvent.clickCallbacks.push(onClick)
    }

    /**
     * Registers mouse or touch cursor movement callbacks
     * @param {Function} onMoveEvent callback that is called whenever the mouse or touch cursor is relocated
     */
    registerMoveEvent(onMoveEvent)
    {
        if (onMoveEvent != null && onMoveEvent != undefined)
            this.mouseEvent.moveCallbacks.push(onMoveEvent)
    }

    /**
     * Registers mouse double click callbacks
     * @param {Function} onDblClick callback that is called whenever user double clicks on mouse
     */
    registerDoubleClickEvent(onDblClick)
    {
        if (onDblClick != null && onDblClick != undefined)
            this.mouseEvent.dblClickCallbacks.push(onDblClick)
    }

    /**
     * Called by SceneManager when there is a message for this object posted by any other object registered in SceneManager.
     * This function broadcasts itself back to the sender.
     * @param {SceneManager} sceneManager the SceneManager object
     * @param {String} senderName name of the object who posted the message
     * @param {any} data any object sent as part of the message
     */
    onMessage(sceneManager, senderName, data)  { sceneManager.broadcastTo(this.name, senderName, this) }

    /**
     * Called by SceneManager every frame.
     * This function delegates call to KeyEventCore notify
     * @param {SceneManager} sceneManager the SceneManager object
     */
    onSceneRender(sceneManager) { this.keyEvent.notify() }
}

/**
 * Responsible for detecting and notifying key events
 */
class KeyEventCore
{
    constructor()
    {
        this.keyMap = new Map()
        this.callbacks = []
        window.addEventListener("keydown", e=>this.onDown(e))
        window.addEventListener("keyup", e=>this.onUp(e))
    }

    /**
     * Called by window whenever it detects a key press.
     * This function stores the key in keymap
     * @param {KeyboardEvent} event 
     */
    onDown(event)
    {
        let entry = this.keyMap.get(event.key)
        if (entry == null || entry == undefined)
            this.keyMap.set(event.key, true)
    }

    /**
     * Called by window whenever it detects a key release.
     * This function remove the key from keymap
     * @param {KeyboardEvent} event 
     */
    onUp(event)
    {
        let entry = this.keyMap.get(event.key)
        if (entry != null && entry != undefined)
            this.keyMap.delete(event.key)
    }

    /**.
     * This function calls all the keyevent callbacks on every frame
     */
    notify()
    {
        for (let callback of this.callbacks)
            callback(this.keyMap)
    }
}

/**
 * Responsible for detecting and notifying mouse and touch events
 */
class MouseEventCore
{
    /**
     * 
     * @param {HTMLCanvasElement} canvas html canvas element
     */
    constructor(canvas)
    {
        this.mousePress = false
        this.enable = true
        this.firstClick = true
        this.lastXY = { x: 0, y: 0 }
        this.sensitivity = 1
        this.clickCallbacks = []
        this.moveCallbacks = []
        this.dblClickCallbacks = []
        this.dblTapCounter = 0
        this.registerCanvasEvents(canvas)
    }

    /**
     * Registers event listeners to the canvas element that is passed.
     * @param {HTMLCanvasElement} canvas html canvas element
     */
    registerCanvasEvents(canvas)
    {
        canvas.addEventListener('mousedown', e=>this.onPress(e))
        canvas.addEventListener('mouseup', e=>this.onRelease(e))
        canvas.addEventListener('mousemove', e=>this.onMove(e))
        canvas.addEventListener('touchstart', e=>this.onPress(e))
        canvas.addEventListener('touchend', e=>this.onRelease(e))
        canvas.addEventListener('touchmove', e=>this.onMove(e))
    }

    /**
     * Called whenever user presses the mouse button or touches the screen.
     * This function sets the mousePress flag to true and notifies all the registered double click callbacks
     * on detecting double taps.
     * @param {Event} event mouse or touch event object
     */
    onPress(event) 
    { 
        let isDevice = MISC.isHandHeldDevice()
        if ((isDevice && event.type == 'touchstart') || (!isDevice && event.type == 'mousedown'))
        {
            if (event.type == 'touchstart')
                event = event.touches[0]
            this.mousePress = true 
            this.dblTapCounter++
            if (this.dblTapCounter > 2)
                this.dblTapCounter = 2   
            if (this.dblTapCounter == 1)
            {
                setTimeout(()=>{
                    if (this.dblTapCounter > 1)
                    {
                        for (let dblClickCallback of this.dblClickCallbacks)
                            dblClickCallback(event)
                    }
                    else
                    {
                        for (let clickCallback of this.clickCallbacks)
                            clickCallback(event.clientX, event.clientY)
                    }
                    this.dblTapCounter = 0
                }, 250) 
            }
        }  
    }

    /**
     * Called whenever user releases the mouse button or touches the screen.
     * This function sets the mousePress flag to false and firstClick value to true
     * and also resets the value of lastXY object.
     * @param {Event} event mouse or touch event object
     */
    onRelease(event)
    {
        this.mousePress = false
        this.firstClick = true
        this.lastXY = { x: 0, y: 0 }
    }

    /**
     * Called whenever the mouse or touch cursor is relocated.
     * If there are registered move callbacks and if the mousePress is true, then this function will 
     * calculate the displacement of the cursor and call the callbacks by providing the displacement
     * as well as the cursor positions.
     * @param {Event} event mouse or touch event object
     */
    onMove(event)
    {
        if (this.moveCallbacks.length > 0 && this.mousePress)
        {    
            if (event.type == 'touchmove') 
                event = event.touches[0]
            if (this.firstClick)
            {
                this.lastXY = { x: event.clientX, y: event.clientY }
                this.firstClick = false
            }
            this.currentXY = { x: event.clientX, y: event.clientY }
            let deltaX = (this.currentXY.x - this.lastXY.x) * this.sensitivity
            let deltaY = (this.currentXY.y - this.lastXY.y) * this.sensitivity
            for (let moveCallback of this.moveCallbacks)
                moveCallback(deltaX, deltaY, event.clientX, event.clientY)
            this.lastXY = this.currentXY
        }
    }

    /**
     * Called by canvas event listener whenever it detects a mouse double click.
     * This function notifies all the registered double click callbacks.
     * @param {MouseEvent} event mouse event object
     */
    onDblClick(event)
    {
        for (let dblClickCallback of this.dblClickCallbacks)
            dblClickCallback(event)
    }
}