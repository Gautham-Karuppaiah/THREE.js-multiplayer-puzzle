import * as THREE from "three"
import { config } from "./config.js"
import { getOpposite } from "./utils.js"
import { snapSound } from "./loader.js"

const state = {
    //tracks global information
    cursor: new THREE.Vector2(null, null),
    isSelected: false,
    selectedObject: null,
    hoveredObject: null,
    dragPlane: new THREE.Plane(),
    dragOffset: new THREE.Vector3(),
    dragPlaneIntersection: new THREE.Vector3()
}

function moveGroup(group, deltaX, deltaZ) {
    //moves group of connected pieces by delta
    for (const piece of group) {
        piece.position.x += deltaX
        piece.position.z += deltaZ
    }
}

function returnPositionalErrorAndSomeOtherStuff(mesh, slotName, expectedPartner) {
    //calculates the difference between actual displacement and expected displacement between a piece and its partner
    const actualDx = expectedPartner.position.x - mesh.position.x
    const actualDz = expectedPartner.position.z - mesh.position.z

    let expectedDx, expectedDz

    switch (slotName) {
        case "top":
            expectedDx = 0
            expectedDz = -config.pieceSize.height * config.aspectRatioScaleZ
            break

        case "bottom":
            expectedDx = 0
            expectedDz = config.pieceSize.height * config.aspectRatioScaleZ
            break

        case "left":
            expectedDx = -config.pieceSize.width * config.aspectRatioScaleX
            expectedDz = 0
            break

        case "right":
            expectedDx = config.pieceSize.width * config.aspectRatioScaleX
            expectedDz = 0
            break
    }

    const errorX = actualDx - expectedDx
    const errorZ = actualDz - expectedDz
    const errorMagnitude = Math.max(Math.abs(errorX), Math.abs(errorZ))

    return { errorMagnitude, deltaX: -errorX, deltaZ: -errorZ }
}

function checkIfPieceSnaps(mesh, droppedGroup) {
    //checks if two pieces are close enough to snap
    for (const [slotName, slotData] of Object.entries(mesh.userData.slots)) {
        //first checks for held piece
        if (!slotData.isConnected && slotData.partnerPiece) {
            const partner = slotData.partnerPiece

            if (droppedGroup.includes(partner)) continue

            const result = returnPositionalErrorAndSomeOtherStuff(mesh, slotName, partner)

            if (result.errorMagnitude < config.snapThreshold) {
                //if success, returns mesh, slot of mesh, mesh to be snapped to, and the deltas to calculate snap
                return {
                    mesh: mesh,
                    slotName,
                    partnerPiece: partner,
                    deltaX: result.deltaX,
                    deltaZ: result.deltaZ
                }
            }
        }
    }
    for (const piece of droppedGroup) {
        //else iterates through the rest of the pieces in the group
        if (piece === mesh) continue
        for (const [slotName, slotData] of Object.entries(piece.userData.slots)) {
            if (!slotData.isConnected && slotData.partnerPiece) {
                const partner = slotData.partnerPiece

                if (droppedGroup.includes(partner)) continue

                const result = returnPositionalErrorAndSomeOtherStuff(piece, slotName, partner)

                if (result.errorMagnitude < config.snapThreshold) {
                    //does the same as earlier except with a different mesh
                    return {
                        mesh: piece,
                        slotName,
                        partnerPiece: partner,
                        deltaX: result.deltaX,
                        deltaZ: result.deltaZ
                    }
                }
            }
        }
    }
}

function checkIfPieceConnects(group) {
    //checks if two pieces are close enough to snap (smaller threshold than snap threshold because this is operating under the assumption that the pieces are already where they need to be, with the threshold just for floating point stuff
    for (const piece of group) {
        for (const [slotName, slotData] of Object.entries(piece.userData.slots)) {
            if (slotData.isConnected || !slotData.partnerPiece) continue

            const partner = slotData.partnerPiece

            if (!group.includes(partner)) continue

            const result = returnPositionalErrorAndSomeOtherStuff(piece, slotName, partner)

            if (result.errorMagnitude < config.connectionThreshold) {
                slotData.isConnected = true
                partner.userData.slots[getOpposite(slotName)].isConnected = true //connection simply marks both meshes respective slot as full
            }
        }
    }
}

function mergeGroups(group1, group2) {
    //updates the groups of two connecting groups to update the state of the new merged group
    const newGroup = [...group1, ...group2]

    for (const piece of newGroup) {
        piece.userData.connectedGroup = newGroup
    }

    return newGroup
}

function handleSnapping(heldPiece, droppedGroup) {
    //handles everything snapping related when you drop a piece
    const snap = checkIfPieceSnaps(heldPiece, droppedGroup)

    if (snap) {
        moveGroup(droppedGroup, -snap.deltaX, -snap.deltaZ)

        const newGroup = mergeGroups(droppedGroup, snap.partnerPiece.userData.connectedGroup)

        snap.mesh.userData.slots[snap.slotName].isConnected = true
        snap.partnerPiece.userData.slots[getOpposite(snap.slotName)].isConnected = true

        checkIfPieceConnects(newGroup)
        snapSound.currentTime = 0
        snapSound.play()
    }
}

function onPointerMove(event) {
    //updates cursor position in normalized device coordinates
    state.cursor.x = (event.clientX / window.innerWidth) * 2 - 1
    state.cursor.y = -(event.clientY / window.innerHeight) * 2 + 1
}

function onMouseDown(event, raycaster, camera, controls) {
    //handles selecting an object on mouse down
    if (event.button !== 0) return //if it wasnt a left mouse input

    if (state.hoveredObject !== null) {
        //if click was done without a hovered object
        controls.enabled = false //disables controls

        raycaster.setFromCamera(state.cursor, camera)
        const intersects = raycaster.intersectObject(state.hoveredObject)

        if (intersects.length > 0) {
            //checks if there is a object under cursor and if so makes that the selected object . now that i think about it you could probably do without this chekc but whatever mane
            state.isSelected = true
            state.selectedObject = state.hoveredObject

            const clickPoint = intersects[0].point
            state.dragOffset.copy(state.selectedObject.position).sub(clickPoint) //calculates the offset between centre of mesh and where click was done

            state.dragPlane.setFromNormalAndCoplanarPoint(
                //calculates the plane that the mesh is on. also kinda redundant atp but maybe ill implement floating pieces and stuff later
                new THREE.Vector3(0, 1, 0),
                state.selectedObject.position
            )
        }
    }
}

function onMouseUp(event, controls) {
    //handles dropping an object on mouse down
    if (event.button !== 0) return
    if (state.isSelected) {
        const heldPiece = state.selectedObject
        const droppedGroup = heldPiece.userData.connectedGroup //extracts the group the held piece belongs to for snapping purposes

        handleSnapping(heldPiece, droppedGroup)

        state.isSelected = false
        state.selectedObject = null
        controls.enabled = true
    }
}

function updateDrag(raycaster, camera) {
    //handles updating group positions when dragging
    if (state.isSelected && state.selectedObject !== null) {
        raycaster.setFromCamera(state.cursor, camera)

        if (raycaster.ray.intersectPlane(state.dragPlane, state.dragPlaneIntersection)) {
            const newPosition = new THREE.Vector3() //calculates the new position on the drag plane by adding the offset to the new position, calculating the delta between the new and old, and updating using the delta
                .copy(state.dragPlaneIntersection)
                .add(state.dragOffset)

            const deltaX = newPosition.x - state.selectedObject.position.x
            const deltaZ = newPosition.z - state.selectedObject.position.z

            moveGroup(state.selectedObject.userData.connectedGroup, deltaX, deltaZ)
        }
    }
}

function updateHover(raycaster, camera, scene) {
    //handles updating hovered object state
    if (!state.isSelected && state.cursor.x !== null && state.cursor.y !== null) {
        raycaster.setFromCamera(state.cursor, camera)
        const intersects = raycaster.intersectObjects(scene.children)
        state.hoveredObject = intersects.length > 0 ? intersects[0].object : null //checks for an object on cursor, if there is then sets hoveredObject to that object otherwise nulls it
    }
}

export function setupGameplay(camera, scene, controls, raycaster) {
    //sets up all the gameplay logic
    window.addEventListener("pointermove", onPointerMove) //adds event listeners for mouse movements

    window.addEventListener("mousedown", (event) => {
        onMouseDown(event, raycaster, camera, controls)
    })

    window.addEventListener("mouseup", (event) => {
        onMouseUp(event, controls)
    })

    return { updateDrag, updateHover } //returns gameplay logic functions
}
