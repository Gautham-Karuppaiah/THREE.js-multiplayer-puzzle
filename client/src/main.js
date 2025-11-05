import { setupUI } from './setup.js'
import { createScene } from './scene.js'
import { loadTexture } from './loader.js'
import { generatePieces, spawnPuzzle } from './puzzle.js'
import { setupGameplay } from './gameplay.js'

setupUI(async (imageFile, cols, rows) => {
    const canvas = document.querySelector('canvas.webgl') //loads in the canvas object 
    const { scene, camera, renderer, controls, raycaster, stats } = createScene(canvas) //brings in scene objects 
    
    const pieceMaterial = await loadTexture(imageFile) //wait for texture to load then assign it to pieceMaterial 
    
    const grid = generatePieces(cols, rows, pieceMaterial) //generates pieces of the puzzle using user provided dimensions and material texture thing 
    spawnPuzzle(grid, scene) //adds the pieces to the scene 
    
    const { updateDrag, updateHover } = setupGameplay(camera, scene, controls, raycaster) //returns gameplay logic functions using the scene objects 
    
    function tick() { //rendering loop 
        stats.begin()
        controls.update()
        
        updateDrag(raycaster, camera)
        updateHover(raycaster, camera, scene)
        
        renderer.render(scene, camera)
        stats.end()
        window.requestAnimationFrame(tick)
    }
    tick()
})
