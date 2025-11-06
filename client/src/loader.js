import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { config } from './config.js'

export const meshMap = {} //dict that stores template for all puzzle pieces
export const snapSound = new Audio("/sounds/snap.mp3")

//loads the model pieces into meshMap and updates their uv maps to match their expected mapping 
export function loadMeshes() {
    return new Promise((resolve) => {
        const gltfLoader = new GLTFLoader()
        gltfLoader.load('/models/JIGSAW_PIECES_FINAL.glb', (gltf) => {
            const children = [...gltf.scene.children] //shallow copy because operating on the original array was messing things up due to reparenting stuff
            
            for (let i = 0; i < children.length; i++) { //iterate through children in the scene 
                const child = children[i]
                
                if (child.isMesh) { 
                    const geometry = child.geometry
                    const uvAttribute = geometry.attributes.uv 
                    
                    child.geometry.computeBoundingBox()
                    const bbox = child.geometry.boundingBox
                    const width = bbox.max.x - bbox.min.x
                    const height = bbox.max.z - bbox.min.z //computes actual dimensions of piece 
                    
                    const bodyWidth = 2.0
                    const bodyHeight = 2.0 //the dimensions of the square bit in the middle of the piece where the tabs jut into and out of 
                    
                    const name = child.name
                    const tabMask = name.split('').map(d => d === '1' ? 1 : 0).join('') //gets the piece permutation via the file name. from top clockwise, 1= tab out, 2= straight edge, 0 = tab in
                    
                    const uvConfig = { //determines hashmap for correcting uv textures. blender exports the uvmaps squishing the non-square pieces into a square, so they have to be unsquished based on which sides have a tab sticking out
                        '0000': [0.5, 0.5, false, false],
                        '1000': [0.5, 0.0, false, true],
                        '0100': [0.0, 0.5, true, false],
                        '0010': [0.5, 1.0, false, true],
                        '0001': [1.0, 0.5, true, false],
                        '1010': [0.5, 0.5, false, true],
                        '0101': [0.5, 0.5, true, false],
                        '1100': [0.0, 0.0, true, true],
                        '0110': [0.0, 1.0, true, true],
                        '0011': [1.0, 1.0, true, true],
                        '1001': [1.0, 0.0, true, true],
                        '0111': [0.5, 1.0, true, true],
                        '1011': [1.0, 0.5, true, true],
                        '1101': [0.5, 0.0, true, true],
                        '1110': [0.0, 0.5, true, true],
                        '1111': [0.5, 0.5, true, true]
                    }
                    
                    const [pivotPointX, pivotPointY, enableScaleX, enableScaleY] = uvConfig[tabMask] || [0.5, 0.5, true, true]
                    
                    const scaleX = enableScaleX ? width / bodyWidth : 1.0
                    const scaleY = enableScaleY ? height / bodyHeight : 1.0
                    
                    for (let j = 0; j < uvAttribute.count; j++) { //i heart uv mapping 
                        let u = uvAttribute.getX(j)
                        let v = uvAttribute.getY(j)
                        
                        v = 1.0 - v
                        
                        u = u - pivotPointX
                        v = v - pivotPointY
                        
                        u = u * scaleX
                        v = v * scaleY
                        
                        u = u + pivotPointX
                        v = v + pivotPointY
                        
                        uvAttribute.setXY(j, u, v)
                    }
                    child.scale.y = -4 
                    uvAttribute.needsUpdate = true
                    
                    meshMap[child.name] = { //adds the mesh to the meshMap
                        geometry: child.geometry,
                        slots: child.name.split('').map(d => parseInt(d)),  // Convert to numbers
                        dimensions: { width, height }
                    }
                }
            }
            
            resolve() //meshes have been loaded, unpause the await function 
        })
    })
}

export function loadTexture(imageFile) {
    return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const textureLoader = new THREE.TextureLoader()
            const colorTexture = textureLoader.load(e.target.result, () => {
                colorTexture.colorSpace = THREE.SRGBColorSpace
                const pieceMaterial = new THREE.MeshStandardMaterial({
                    map: colorTexture,
                    roughness: 0.7,
                    metalness: 0.1
                })

                const aspectRatio = colorTexture.image.width / colorTexture.image.height
                config.aspectRatioScaleX = aspectRatio >= 1 ? aspectRatio : 1
                config.aspectRatioScaleZ = aspectRatio <= 1 ? (1 / aspectRatio) : 1

                resolve(pieceMaterial)
            })
        }
      reader.readAsDataURL(imageFile)

    })
}

export function loadTextureFromUrl(url) {
    return new Promise((resolve) => {
        const textureLoader = new THREE.TextureLoader()
        const colorTexture = textureLoader.load(url, () => {
            colorTexture.colorSpace = THREE.SRGBColorSpace

            const aspectRatio = colorTexture.image.width / colorTexture.image.height
            config.aspectRatioScaleX = aspectRatio >= 1 ? aspectRatio : 1
            config.aspectRatioScaleZ = aspectRatio <= 1 ? (1 / aspectRatio) : 1

            const material = new THREE.MeshStandardMaterial({
                map: colorTexture,
                roughness: 0.7,
                metalness: 0.1
            })

            resolve(material)
        })
    })
}
