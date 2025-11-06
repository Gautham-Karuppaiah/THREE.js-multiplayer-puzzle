import * as Colyseus from "colyseus.js"
import { getStateCallbacks } from "colyseus.js"
import { loadMeshes, loadTextureFromUrl, meshMap } from "./loader.js"
import { createMeshFromPiece, updateMeshFromPiece } from "./puzzle.js"
import { createScene } from "./scene.js"
import { setupInteractions } from "./interactions.js"

async function init() {
    await loadMeshes()
    const client = new Colyseus.Client("ws://localhost:2567")
    const room = await client.joinOrCreate("puzzleroom")

    await new Promise((resolve) => {
        room.onStateChange.once(() => {
            resolve()
        })
    })

    const material = await loadTextureFromUrl(room.state.imageUrl)

    const canvas = document.querySelector("canvas.webgl")
    const { scene, camera, renderer, controls, raycaster, stats } = createScene(canvas)

    const meshes = []
    const $ = getStateCallbacks(room)

    const { updateDrag, updateHover } = setupInteractions(camera, controls, raycaster, room, meshes)

    $(room.state).pieces.onAdd((piece, index) => {
        //listens to piece being added from server, gets triggered for each existing piece
        const mesh = createMeshFromPiece(piece, room.state.rows, room.state.cols, material, index)
        if (mesh) {
            meshes[index] = mesh
            scene.add(mesh)

            $(piece).listen("positionX", () => updateMeshFromPiece(meshes[index], piece)) //initializes piece states
            $(piece).listen("positionY", () => updateMeshFromPiece(meshes[index], piece))
            $(piece).listen("positionZ", () => updateMeshFromPiece(meshes[index], piece))
            $(piece).listen("heldBy", (value) => {
                //trakcs helf state for future
            })
        } else {
            console.error(`Failed to create mesh for piece ${index}`)
        }
    })

    $(room.state).players.onAdd((player, sessionId) => {
        //listens to player schema from server, updates joining and leaving
        console.log("Player joined:", sessionId)
    })

    $(room.state).players.onRemove((player, sessionId) => {
        console.log("Player left:", sessionId)
    })

    function tick() {
        //main rendering loop
        stats.begin()
        updateHover(raycaster, camera, meshes)
        updateDrag(raycaster, camera, room)
        controls.update()
        renderer.render(scene, camera)
        stats.end()
        window.requestAnimationFrame(tick)
    }
    tick()
}

init()
