import * as THREE from 'three'
import { config } from './config.js'
import { getRandomInt, getOpposite } from './utils.js'
import { meshMap } from './loader.js'

function getValidPieceTypes(row, col, grid, gridCols, gridRows) { //gets list of valid piece types that can fit at a particular position given its neighbouring pieces 
    const valid = []
    const constraints = [
        [0, 1],
        [0, 1],
        [0, 1],
        [0, 1]
    ]
    
    if (row === 0) constraints[0] = [2, 2]
    if (row === gridRows - 1) constraints[2] = [2, 2]
    if (col === 0) constraints[3] = [2, 2]
    if (col === gridCols - 1) constraints[1] = [2, 2]
    
    const topPiece = grid[row - 1]?.[col]
    if (topPiece) {
        const required = getOpposite(topPiece.userData.pieceType[2])
        constraints[0] = [required, required]
    }
    
    const rightPiece = grid[row][col + 1]
    if (rightPiece) {
        const required = getOpposite(rightPiece.userData.pieceType[3])
        constraints[1] = [required, required]
    }
    
    const bottomPiece = grid[row + 1]?.[col]
    if (bottomPiece) {
        const required = getOpposite(bottomPiece.userData.pieceType[0])
        constraints[2] = [required, required]
    }
    
    const leftPiece = grid[row][col - 1]
    if (leftPiece) {
        const required = getOpposite(leftPiece.userData.pieceType[1])
        constraints[3] = [required, required]
    }
    
    for (const [name, data] of Object.entries(meshMap)) {
        let isValid = true
        for (let i = 0; i < 4; i++) {
            const slot = parseInt(data.slots[i])
            if (slot < constraints[i][0] || slot > constraints[i][1]) {
                isValid = false
                break
            }
        }
        if (isValid) valid.push(name)
    }
    
    return valid
}

function updatePieceBasedOnTexture(mesh, row, col, gridRows, gridCols) { //scales and transforms the uv of each piece to match the portion of the image its supposed to represent depending on its positio on the grid  
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

export function generatePieces(cols, rows, material) { //iterates through rows and cols of grid generating mesh objects. should maybe split updatePieceBasedOnTexture to be outside this. 
    const grid = []
    const pieceInstanceCounts = {}
    
    for (let i = 0; i < rows; i++) {
        grid[i] = []
        for (let j = 0; j < cols; j++) {
            const validTypes = getValidPieceTypes(i, j, grid, cols, rows)
            const pieceType = validTypes[getRandomInt(0, validTypes.length)]

            const template = meshMap[pieceType]
            const geometry = template.geometry.clone()
            const mesh = new THREE.Mesh(geometry, material)
            
            if (!pieceInstanceCounts[pieceType]) pieceInstanceCounts[pieceType] = 0
            const instanceNum = pieceInstanceCounts[pieceType]++
            mesh.name = `${pieceType}_${instanceNum}`
            
            const group = [mesh]
            mesh.userData = {
                pieceType: pieceType,
                gridPosition: { row: i, col: j },
                connectedGroup: group,
                slots: {
                    top: { type: pieceType[0], isConnected: false, partnerPiece: null },
                    right: { type: pieceType[1], isConnected: false, partnerPiece: null },
                    bottom: { type: pieceType[2], isConnected: false, partnerPiece: null },
                    left: { type: pieceType[3], isConnected: false, partnerPiece: null }
                }
            }
            
            updatePieceBasedOnTexture(mesh, i, j, rows, cols)
            
            const scaledWidth = config.pieceSize.width * config.aspectRatioScaleX 
            const scaledHeight = config.pieceSize.height * config.aspectRatioScaleZ
            
            const puzzleWidth = cols * scaledWidth
            const puzzleHeight = rows * scaledHeight
            
            const x = (j * scaledWidth) - (puzzleWidth / 2) + (scaledWidth / 2)
            const z = (i * scaledHeight) - (puzzleHeight / 2) + (scaledHeight / 2)
            
            mesh.position.set(x, 0, z)
            
            grid[i][j] = mesh
            mesh.scale.y *= 2
        }
    }
    
    return grid
}

export function spawnPuzzle(grid, scene) { //adds puzzle pieces in a grid shape. need to scramble 
    const rows = grid.length
    const cols = grid[0].length
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            scene.add(grid[i][j])
        }
    }
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const piece = grid[i][j]
            const slots = piece.userData.slots
            
            slots.top.partnerPiece = grid[i - 1]?.[j]
            slots.right.partnerPiece = grid[i][j + 1]
            slots.bottom.partnerPiece = grid[i + 1]?.[j]
            slots.left.partnerPiece = grid[i][j - 1]
            
            if (!slots.top.partnerPiece) slots.top.isConnected = true
            if (!slots.right.partnerPiece) slots.right.isConnected = true
            if (!slots.bottom.partnerPiece) slots.bottom.isConnected = true
            if (!slots.left.partnerPiece) slots.left.isConnected = true
        }
    }
}
