import * as THREE from 'three'
import { config } from './config.js'
import { meshMap } from './loader.js'

function updatePieceBasedOnTexture(mesh, row, col, gridRows, gridCols) {
    mesh.scale.x *= config.aspectRatioScaleX
    mesh.scale.z *= config.aspectRatioScaleZ

    const uvScalingFactorX = 1.0 / gridCols
    const uvScalingFactorY = 1.0 / gridRows

    const uvOffsetX = (1.0 / gridCols) * col
    const uvOffsetY = (1.0 / gridRows) * (gridRows - 1 - row)

    const uvAttribute = mesh.geometry.attributes.uv
    for (let j = 0; j < uvAttribute.count; j++) {
        let u = uvAttribute.getX(j)
        let v = uvAttribute.getY(j)

        u = u * uvScalingFactorX + uvOffsetX
        v = v * uvScalingFactorY + uvOffsetY
        uvAttribute.setXY(j, u, v)
    }
    uvAttribute.needsUpdate = true
}

export function createMeshFromPiece(piece, rows, cols, material) {
    const pieceType = `${piece.slotTop.type}${piece.slotRight.type}${piece.slotBottom.type}${piece.slotLeft.type}`

    const template = meshMap[pieceType]
    if (!template) {
        console.error(`Missing mesh template for piece type: ${pieceType}`)
        return null
    }

    const geometry = template.geometry.clone()
    const mesh = new THREE.Mesh(geometry, material)

    mesh.userData = {
        gridRow: piece.gridRow,
        gridCol: piece.gridCol,
        connectedPieces: [...piece.connectedPieces],
        slotTop: { type: piece.slotTop.type, connected: piece.slotTop.connected },
        slotRight: { type: piece.slotRight.type, connected: piece.slotRight.connected },
        slotBottom: { type: piece.slotBottom.type, connected: piece.slotBottom.connected },
        slotLeft: { type: piece.slotLeft.type, connected: piece.slotLeft.connected }
    }

    updatePieceBasedOnTexture(mesh, piece.gridRow, piece.gridCol, rows, cols)

    mesh.position.set(piece.positionX, piece.positionY, piece.positionZ)
    mesh.scale.y *= 2

    return mesh
}

export function updateMeshFromPiece(mesh, piece) {
    mesh.position.set(piece.positionX, piece.positionY, piece.positionZ)
    mesh.userData.connectedPieces = [...piece.connectedPieces]

    mesh.userData.slotTop.connected = piece.slotTop.connected
    mesh.userData.slotRight.connected = piece.slotRight.connected
    mesh.userData.slotBottom.connected = piece.slotBottom.connected
    mesh.userData.slotLeft.connected = piece.slotLeft.connected
}
