export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min
}

export function getOpposite(slot) {
    if (slot === 1) return 0
    if (slot === 0) return 1
    if (slot === 2) return 2

    if (slot === "top") return "bottom"
    if (slot === "bottom") return "top"
    if (slot === "left") return "right"
    if (slot === "right") return "left"

    return slot
}

export function getPieceIndex(row, col, cols) {
    return row * cols + col
}

export function getPiece(pieces, row, col, cols) {
    if (row < 0 || col < 0) return null
    return pieces[getPieceIndex(row, col, cols)]
}

export function getPartner(piece, slotName, pieces, rows, cols) {
    let partnerRow = piece.gridRow
    let partnerCol = piece.gridCol

    switch (slotName) {
        case "top":
            partnerRow--
            break
        case "right":
            partnerCol++
            break
        case "bottom":
            partnerRow++
            break
        case "left":
            partnerCol--
            break
    }

    if (partnerRow < 0 || partnerRow >= rows || partnerCol < 0 || partnerCol >= cols) {
        return null
    }

    return getPiece(pieces, partnerRow, partnerCol, cols)
}
