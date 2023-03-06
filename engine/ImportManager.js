/**
 * This file SHOULD NOT contain any import statement that references either any external libraries
 * or any files within the project.
 */

export const ImportManager =
{
    execute : function(pathMap, onProgress, onComplete)
    {
        if (onProgress == undefined)
            onProgress = (p, s)=>{}
        if (onComplete == undefined)
            onComplete = (m)=>{}
        let names = pathMap.keys()
        let progress = 0
        for (let name of names)
        {    
            import(pathMap.get(name)).then((module)=>{
                onProgress(name, module, Math.round((progress++/pathMap.size) * 100))
                if (progress == pathMap.size)
                    onComplete()
            })
        }
    }
}