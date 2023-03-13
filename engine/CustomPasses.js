import * as THREE from 'three'
import { ShaderPass } from '../node_modules/three/examples/jsm/postprocessing/ShaderPass.js'
import { FXAAShader } from '../node_modules/three/examples/jsm/shaders/FXAAShader.js'

const PixelAdderShader = 
{
    vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() 
    {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,

    fragmentShader: /* glsl */`
    uniform sampler2D baseTexture;
    uniform sampler2D bloomTexture;
    varying vec2 vUv;
    void main() 
    {
        gl_FragColor = texture2D(baseTexture, vUv) + texture2D(bloomTexture, vUv);
    }`
}

export class PixelAdderPass extends ShaderPass
{
    constructor(targetTexture)
    {
        super(new THREE.ShaderMaterial({
            uniforms: {
                baseTexture: { value: null },
                bloomTexture: { value: targetTexture }
            },
            vertexShader : PixelAdderShader.vertexShader,
            fragmentShader : PixelAdderShader.fragmentShader,
        }), 'baseTexture')
    }
}

export class FXAAPass extends ShaderPass
{
    constructor(renderer)
    {
        super(new THREE.ShaderMaterial(FXAAShader))
        setInterval(()=>{
            this.material.uniforms['resolution'].value.x = 1/(window.innerWidth * renderer.getPixelRatio())
            this.material.uniforms['resolution'].value.y = 1/(window.innerHeight * renderer.getPixelRatio())
        }, 16)
    }
}