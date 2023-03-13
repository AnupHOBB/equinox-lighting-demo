import * as THREE from 'three'
import { EffectComposer } from '../node_modules/three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from '../node_modules/three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from '../node_modules/three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { PixelAdderPass, FXAAPass } from './CustomPasses.js'

export class SceneRenderer
{
    constructor(canvas) { this.core = new SceneRendererCore(canvas) }

    add(name, threeJsObject, isLuminant) { this.core.add(name, threeJsObject, isLuminant) }

    remove(name) { this.core.remove(name) }

    changeCamera(threeJsCamera) 
    { 
        this.core.changeCamera(threeJsCamera)
        if (!this.core.isSetupComplete)
            this.core.setup(threeJsCamera)
    }

    shouldPause(pause) { this.core.shouldPause(pause) }

    render() { this.core.render() }
}

class SceneRendererCore
{
    constructor(canvas)
    {
        this.threeJsCamera = null
        this.isSetupComplete = false
        this.shouldRender = false

        this.scene = new THREE.Scene()
        this.renderer = new THREE.WebGLRenderer({canvas, alpha: true})
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
        this.bloomComposer = new EffectComposer(this.renderer)
        this.bloomComposer.renderToScreen = false
        this.bloomComposer.addPass(new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 3, 1, 0))

        this.finalComposer = new EffectComposer(this.renderer)
        this.finalComposer.addPass(new PixelAdderPass(this.bloomComposer.renderTarget2.texture))
        this.finalComposer.addPass(new FXAAPass(this.renderer))

        this.bloomObjects = []
        this.mainSceneObjects = []
        this.materialMap = new Map()
    }

    add(threeJsObject, isLuminant)
    {
        if (threeJsObject.isLight != undefined)  
            this.addToScene(threeJsObject)
        else
        {
            if (isLuminant)
                this.bloomObjects.push(threeJsObject)
            else
            {    
                this.mainSceneObjects.push(threeJsObject)
                this.addToScene(threeJsObject)
                this.iterateRecursively(threeJsObject, obj=>this.materialMap.set(obj.uuid, obj.material.clone()))
            }
        }
    }

    remove(threeJsObject)
    {
        if (threeJsObject.isLight)
            this.removeFromScene(threeJsObject)
        else
        {
            let index = this.bloomObjects.indexOf(threeJsObject)
            if (index < 0)
            {    
                index = this.mainSceneObjects.indexOf(threeJsObject)
                if (index >= 0)
                {    
                    this.removeFromScene(threeJsObject)
                    this.mainSceneObjects.splice(index, 1)
                }
            }
            this.removeFromScene(threeJsObject)
            this.bloomObjects.splice(index, 1)
        }
    }

    changeCamera(threeJsCamera) { this.threeJsCamera = threeJsCamera }

    setup(threeJsCamera)
    {
        this.threeJsCamera = threeJsCamera
        this.bloomComposer.insertPass(new RenderPass(this.scene, this.threeJsCamera), 0)
        this.finalComposer.insertPass(new RenderPass(this.scene, this.threeJsCamera), 0)
        this.shouldRender = true
        this.isSetupComplete = true
    }

    shouldPause(pause) { this.shouldRender = pause }

    render()
    {
        if (this.shouldRender)
        {
            this.prepareForBloomPass()
            this.renderer.setSize(window.innerWidth, window.innerHeight)
            this.bloomComposer.setSize(window.innerWidth, window.innerHeight)
            this.bloomComposer.render()
            this.prepareForFinalPass()
            this.finalComposer.setSize(window.innerWidth, window.innerHeight)
            this.finalComposer.render()
        }
    }

    prepareForBloomPass()
    {
        for (let mainSceneObject of this.mainSceneObjects)
            this.iterateRecursively(mainSceneObject, obj=>this.blacken(obj))
        for (let bloomSceneObject of this.bloomObjects)
            this.iterateRecursively(bloomSceneObject, obj=>this.addToScene(obj))
    }

    prepareForFinalPass()
    {
        for (let mainSceneObject of this.mainSceneObjects)
            this.iterateRecursively(mainSceneObject, obj=>this.unblacken(obj))
        for (let bloomSceneObject of this.bloomObjects)
            this.iterateRecursively(bloomSceneObject, obj=>this.removeFromScene(obj))
    }

    blacken(threeJsObject)
    {
        if (threeJsObject.isLight == undefined || !threeJsObject.isLight)
            threeJsObject.material = new THREE.MeshBasicMaterial({color: new THREE.Color(0, 0, 0)})
    }

    unblacken(threeJsObject) 
    { 
        if (threeJsObject.isLight == undefined || !threeJsObject.isLight)
            threeJsObject.material = this.materialMap.get(threeJsObject.uuid).clone()
    }

    addToScene(threeJsObject) { this.scene.add(threeJsObject) }

    removeFromScene(threeJsObject) { this.scene.remove(threeJsObject) }

    iterateRecursively(threeJsObject, onIterationEnd)
    {
        if (threeJsObject.children.length > 0)
            threeJsObject.children.forEach(child => this.iterateRecursively(child, onIterationEnd))
        else
            onIterationEnd(threeJsObject)
    }
}