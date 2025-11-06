import { config } from "./config.js"
import { getRandomInt, getOpposite, getPieceIndex } from "./utils.js"
import { PuzzlePiece, Slot } from "./schema/Schema.js"
const PIECE_TYPES = [
    //exhaustive list of available piece types. 0 = innie, 2 = flat, 1 = outtie
    "0000",
    "0001",
    "0010",
    "0011",
    "0100",
    "0101",
    "0110",
    "0111",
    "1000",
    "1001",
    "1010",
    "1011",
    "1100",
    "1101",
    "1110",
    "1111",

    "0002",
    "0012",
    "0020",
    "0021",
    "0022",
    "0102",
    "0112",
    "0120",
    "0121",
    "0122",
    "0200",
    "0201",
    "0210",
    "0211",
    "0220",
    "0221",

    "1002",
    "1012",
    "1020",
    "1021",
    "1022",
    "1102",
    "1112",
    "1120",
    "1121",
    "1122",
    "1200",
    "1201",
    "1210",
    "1211",
    "1220",
    "1221",

    "2000",
    "2001",
    "2002",
    "2010",
    "2011",
    "2012",
    "2100",
    "2101",
    "2102",
    "2110",
    "2111",
    "2112",
    "2200",
    "2201",
    "2210",
    "2211"
]

const pieceTypeMap = {}
for (const type of PIECE_TYPES) {
    pieceTypeMap[type] = {
        slots: type.split("").map((d) => parseInt(d))
    }
}

function getValidPieceTypes(row, col, grid, gridCols, gridRows) {
    //calculates valid piece types given constraints of grid position and neighbours
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
        const required = getOpposite(topPiece.slotBottom.type)
        constraints[0] = [required, required]
    }

    const rightPiece = grid[row][col + 1]
    if (rightPiece) {
        const required = getOpposite(rightPiece.slotLeft.type)
        constraints[1] = [required, required]
    }

    const bottomPiece = grid[row + 1]?.[col]
    if (bottomPiece) {
        const required = getOpposite(bottomPiece.slotTop.type)
        constraints[2] = [required, required]
    }

    const leftPiece = grid[row][col - 1]
    if (leftPiece) {
        const required = getOpposite(leftPiece.slotRight.type)
        constraints[3] = [required, required]
    }

    for (const [name, data] of Object.entries(pieceTypeMap)) {
        let isValid = true
        for (let i = 0; i < 4; i++) {
            const slot = data.slots[i]
            if (slot < constraints[i][0] || slot > constraints[i][1]) {
                isValid = false
                break
            }
        }
        if (isValid) valid.push(name)
    }

    return valid
}

export function generatePuzzlePieces(cols, rows, aspectRatioScaleX = 1, aspectRatioScaleZ = 1) {
    //generates a puzzle by moving through cells of the grid and checking constraints and choosing a random valid piece
    const grid = []
    const pieces = []

    for (let i = 0; i < rows; i++) {
        grid[i] = []
        for (let j = 0; j < cols; j++) {
            const validTypes = getValidPieceTypes(i, j, grid, cols, rows)
            console.log(`Position (${i},${j}): ${validTypes.length} valid types`)
            if (validTypes.length === 0) {
                console.error(`No valid piece types for position (${i},${j})`)
            }
            const pieceType = validTypes[getRandomInt(0, validTypes.length)]
            const slots = pieceType.split("").map((d) => parseInt(d))

            const piece = new PuzzlePiece()
            piece.gridRow = i
            piece.gridCol = j

            const scaledWidth = config.pieceSize.width * aspectRatioScaleX
            const scaledHeight = config.pieceSize.height * aspectRatioScaleZ

            const puzzleWidth = cols * scaledWidth
            const puzzleHeight = rows * scaledHeight

            const x = j * scaledWidth - puzzleWidth / 2 + scaledWidth / 2
            const z = i * scaledHeight - puzzleHeight / 2 + scaledHeight / 2

            piece.positionX = x
            piece.positionY = 0
            piece.positionZ = z
            piece.heldBy = ""

            const index = getPieceIndex(i, j, cols)
            piece.connectedPieces = [index]

            piece.slotTop = new Slot()
            piece.slotTop.type = slots[0]
            piece.slotTop.connected = false

            piece.slotRight = new Slot()
            piece.slotRight.type = slots[1]
            piece.slotRight.connected = false

            piece.slotBottom = new Slot()
            piece.slotBottom.type = slots[2]
            piece.slotBottom.connected = false

            piece.slotLeft = new Slot()
            piece.slotLeft.type = slots[3]
            piece.slotLeft.connected = false

            grid[i][j] = piece
            pieces.push(piece)
        }
    }

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const piece = grid[i][j]

            if (i === 0) piece.slotTop.connected = true
            if (j === cols - 1) piece.slotRight.connected = true
            if (i === rows - 1) piece.slotBottom.connected = true
            if (j === 0) piece.slotLeft.connected = true
        }
    }

    return pieces
}
