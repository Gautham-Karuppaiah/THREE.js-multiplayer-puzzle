import * as Colyseus from 'colyseus.js'
import { getStateCallbacks } from 'colyseus.js'
import { loadMeshes, loadTextureFromUrl, meshMap } from './loader.js'
import { createMeshFromPiece, updateMeshFromPiece } from './puzzle.js'
import { createScene } from './scene.js'

async function init() {
    console.log("Loading meshes...")
    await loadMeshes()
    console.log("Meshes loaded!")
    console.log("Available piece types:", Object.keys(meshMap))

    console.log("Connecting to server...")
    const client = new Colyseus.Client("ws://localhost:2567")
    const room = await client.joinOrCreate("puzzleroom")

    await new Promise((resolve) => {
        room.onStateChange.once(() => {
            console.log("Room state ready!")
            console.log("Rows:", room.state.rows)
            console.log("Cols:", room.state.cols)
            console.log("Image URL:", room.state.imageUrl)
            console.log("Pieces:", room.state.pieces.length)
            resolve()
        })
    })

    const material = await loadTextureFromUrl(room.state.imageUrl)

    const canvas = document.querySelector('canvas.webgl')
    const { scene, camera, renderer, controls, stats } = createScene(canvas)

    const meshes = []
    const $ = getStateCallbacks(room)

    $(room.state).pieces.onAdd((piece, index) => {
        const mesh = createMeshFromPiece(piece, room.state.rows, room.state.cols, material)
        if (mesh) {
            meshes[index] = mesh
            scene.add(mesh)

            $(piece).listen("positionX", () => updateMeshFromPiece(meshes[index], piece))
            $(piece).listen("positionY", () => updateMeshFromPiece(meshes[index], piece))
            $(piece).listen("positionZ", () => updateMeshFromPiece(meshes[index], piece))
        } else {
            console.error(`Failed to create mesh for piece ${index}`)
        }
    })


    $(room.state).players.onAdd((player, sessionId) => {
        console.log("Player joined:", sessionId)
    })

    $(room.state).players.onRemove((player, sessionId) => {
        console.log("Player left:", sessionId)
    })

    function tick() {
        stats.begin()
        controls.update()
        renderer.render(scene, camera)
        stats.end()
        window.requestAnimationFrame(tick)
    }
    tick()
}

init()
