import * as THREE from "three"

const clientState = {
    //context object is a cool phrase to use
    cursor: new THREE.Vector2(null, null),
    hoveredPiece: null,
    selectedPiece: null,
    dragPlane: new THREE.Plane(),
    dragOffset: new THREE.Vector3(),
    dragPlaneIntersection: new THREE.Vector3()
}

function onPointerMove(event) {
    //just tracks cursor position
    clientState.cursor.x = (event.clientX / window.innerWidth) * 2 - 1
    clientState.cursor.y = -(event.clientY / window.innerHeight) * 2 + 1
}

function onMouseDown(event, raycaster, camera, controls, room, pieceMeshes) {
    //event listener for picking piece on mousedown
    if (event.button !== 0) return

    if (clientState.hoveredPiece !== null) {
        controls.enabled = false

        raycaster.setFromCamera(clientState.cursor, camera) //checks for intersectio between ray originating from camera to cursor
        const intersects = raycaster.intersectObject(clientState.hoveredPiece)

        if (intersects.length > 0) {
            clientState.selectedPiece = clientState.hoveredPiece

            const clickPoint = intersects[0].point
            clientState.dragOffset.copy(clientState.selectedPiece.position).sub(clickPoint)

            clientState.dragPlane.setFromNormalAndCoplanarPoint(
                new THREE.Vector3(0, 1, 0),
                clientState.selectedPiece.position
            )

            //sends pickup request to server
            const pieceId = clientState.selectedPiece.userData.pieceId
            room.send("pickUpRequest", { pieceId })
        }
    }
}

function onMouseUp(event, controls, room) {
    if (event.button !== 0) return

    if (clientState.selectedPiece !== null) {
        const pieceId = clientState.selectedPiece.userData.pieceId
        const position = {
            x: clientState.selectedPiece.position.x,
            y: clientState.selectedPiece.position.y,
            z: clientState.selectedPiece.position.z
        }

        //sends drop request to server
        room.send("dropRequest", { pieceId, position })

        clientState.selectedPiece = null
        controls.enabled = true
    }
}

function updateDrag(raycaster, camera, room) {
    if (clientState.selectedPiece !== null) {
        raycaster.setFromCamera(clientState.cursor, camera)

        if (
            raycaster.ray.intersectPlane(clientState.dragPlane, clientState.dragPlaneIntersection)
        ) {
            const newPosition = new THREE.Vector3()
                .copy(clientState.dragPlaneIntersection)
                .add(clientState.dragOffset)

            const pieceId = clientState.selectedPiece.userData.pieceId

            //sends drag request to server
            room.send("dragToRequest", {
                pieceId,
                position: {
                    x: newPosition.x,
                    y: newPosition.y,
                    z: newPosition.z
                }
            })
        }
    }
}

function updateHover(raycaster, camera, pieceMeshes) {
    //this doesnt really do a lot rn but if you need piece mutation on hover this is nice to have
    if (
        clientState.selectedPiece === null &&
        clientState.cursor.x !== null &&
        clientState.cursor.y !== null
    ) {
        raycaster.setFromCamera(clientState.cursor, camera)
        const intersects = raycaster.intersectObjects(pieceMeshes)
        clientState.hoveredPiece = intersects.length > 0 ? intersects[0].object : null
    }
}

export function setupInteractions(camera, controls, raycaster, room, pieceMeshes) {
    //sets up all these functiosn and s
    window.addEventListener("pointermove", onPointerMove)

    window.addEventListener("mousedown", (event) => {
        onMouseDown(event, raycaster, camera, controls, room, pieceMeshes)
    })

    window.addEventListener("mouseup", (event) => {
        onMouseUp(event, controls, room)
    })

    return { updateDrag, updateHover }
}
