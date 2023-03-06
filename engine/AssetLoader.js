/**
 * Wraps AssetLoaderCore
 */
export class AssetLoader
{
    constructor() { this.core = new AssetLoaderCore() }

    /**
     * Delegates call to AssetLoaderCore addTextureLoader
     * @param {String} url asset url
     * @param {THREE.Loader} loader loader through which the asset is to be loaded
     */
    addTextureLoader(url, loader) { this.core.addTextureLoader(url, loader) }
    
    /**
     * Delegates call to AssetLoaderCore addGLTFLoader
     * @param {String} url asset url
     * @param {THREE.Loader} loader loader through which the asset is to be loaded
     */
    addGLTFLoader(url, loader) { this.core.addGLTFLoader(url, loader) }

    /**
     * Delegates call to AssetLoaderCore load
     * @param {Function} onProgress callback that is called while the assets are loading
     * @param {Function} onComplete callback that is called after all assets are loaded
     */
    execute(onProgress, onComplete) { this.core.load(0, onProgress, onComplete) }
}

/**
 * Responsible for downloading assets
 */
class AssetLoaderCore
{
    constructor()
    {
        this.textureLoaderMap = new Map()
        this.gltfModelLoaderMap = new Map()
        this.urls = []
        this.assetMap = new Map()
    }

    /**
     * Adds the url and the loader to the texture loader map
     * @param {String} url asset url
     * @param {THREE.Loader} loader loader through which the asset is to be loaded
     */
    addTextureLoader(url, loader)
    {
        this.textureLoaderMap.set(url, loader)
        this.urls.push({ url: url, type: 'texture' })
    }
    
    /**
     * Adds the url and the loader to the gltf loader map
     * @param {String} url asset url
     * @param {THREE.Loader} loader loader through which the asset is to be loaded
     */
    addGLTFLoader(url, loader)
    {
        this.gltfModelLoaderMap.set(url, loader)
        this.urls.push({ url: url, type: 'gltf' })
    }

    /**
     * Starts loading assets.
     * @param {Number} index index of asset url in urls array.
     * @param {Function} onProgress callback that is called while the assets are loading
     * @param {Function} onComplete callback that is called after all assets are loaded
     */
    load(index, onProgress, onComplete)
    {
        if (index >= this.urls.length)
            onComplete(this.assetMap)
        else if (this.urls[index].type == 'texture')
        {
            let loader = this.textureLoaderMap.get(this.urls[index].url)
            loader.load(this.urls[index].url, (asset)=>{
                this.assetMap.set(this.urls[index].url, asset)
                onProgress(Math.round(((index + 1)/this.urls.length) * 100))
                this.load(++index, onProgress, onComplete)
            })
        }
        else if (this.urls[index].type == 'gltf')
        {
            let loader = this.gltfModelLoaderMap.get(this.urls[index].url)
            loader.load(this.urls[index].url, (asset)=>{
                this.assetMap.set(this.urls[index].url, asset)
                onProgress(Math.round(((index + 1)/this.urls.length) * 100))
                this.load(++index, onProgress, onComplete)
            }, (xhr)=>{
                let localProgress = Math.round((xhr.loaded/ xhr.total) * 100)
                let globalProgress = index * 100
                onProgress(Math.round((localProgress + globalProgress)/this.urls.length))
            })
        }
    }
}