import { config } from './config.js'
import { getOpposite, getPartner, getPieceIndex } from './utils.js'

function moveGroup(pieces, groupIndices, deltaX, deltaZ) {
    for (const index of groupIndices) {
        pieces[index].positionX += deltaX
        pieces[index].positionZ += deltaZ
    }
}

function returnPositionalErrorAndSomeOtherStuff(piece, slotName, expectedPartner) {
    const actualDx = expectedPartner.positionX - piece.positionX
    const actualDz = expectedPartner.positionZ - piece.positionZ

    let expectedDx, expectedDz

    switch(slotName){
        case 'top':
            expectedDx = 0
            expectedDz = -config.pieceSize.height * config.aspectRatioScaleZ
            break

        case 'bottom':
            expectedDx = 0
            expectedDz = config.pieceSize.height * config.aspectRatioScaleZ
            break

        case 'left':
            expectedDx = -config.pieceSize.width * config.aspectRatioScaleX
            expectedDz = 0
            break

        case 'right':
            expectedDx = config.pieceSize.width * config.aspectRatioScaleX
            expectedDz = 0
            break
    }

    const errorX = actualDx - expectedDx
    const errorZ = actualDz - expectedDz
    const errorMagnitude = Math.max(Math.abs(errorX), Math.abs(errorZ))

    return { errorMagnitude, deltaX: -errorX, deltaZ: -errorZ }
}

function getSlot(piece, slotName) {
    switch(slotName) {
        case 'top': return piece.slotTop
        case 'right': return piece.slotRight
        case 'bottom': return piece.slotBottom
        case 'left': return piece.slotLeft
    }
}

function checkIfPieceSnaps(heldPiece, droppedGroupIndices, pieces, rows, cols) {
    const slotNames = ['top', 'right', 'bottom', 'left']

    for (const checkIndex of droppedGroupIndices) {
        const checkPiece = pieces[checkIndex]

        for (const slotName of slotNames) {
            const slot = getSlot(checkPiece, slotName)

            if (slot.connected) continue

            const partner = getPartner(checkPiece, slotName, pieces, rows, cols)
            if (!partner) continue

            const partnerIndex = getPieceIndex(partner.gridRow, partner.gridCol, cols)
            if (droppedGroupIndices.includes(partnerIndex)) continue

            const result = returnPositionalErrorAndSomeOtherStuff(checkPiece, slotName, partner)

            if (result.errorMagnitude < config.snapThreshold) {
                return {
                    piece: checkPiece,
                    slotName,
                    partner: partner,
                    deltaX: result.deltaX,
                    deltaZ: result.deltaZ
                }
            }
        }
    }

    return null
}

function checkIfPieceConnects(pieces, groupIndices, rows, cols) {
    const slotNames = ['top', 'right', 'bottom', 'left']

    for (const index of groupIndices) {
        const piece = pieces[index]

        for (const slotName of slotNames) {
            const slot = getSlot(piece, slotName)

            if (slot.connected) continue

            const partner = getPartner(piece, slotName, pieces, rows, cols)
            if (!partner) continue

            const partnerIndex = getPieceIndex(partner.gridRow, partner.gridCol, cols)
            if (!groupIndices.includes(partnerIndex)) continue

            const result = returnPositionalErrorAndSomeOtherStuff(piece, slotName, partner)

            if (result.errorMagnitude < config.connectionThreshold) {
                slot.connected = true
                getSlot(partner, getOpposite(slotName)).connected = true
            }
        }
    }
}

function mergeGroups(pieces, group1Indices, group2Indices) {
    const mergedIndices = [...group1Indices, ...group2Indices]

    for (const index of mergedIndices) {
        pieces[index].connectedPieces = mergedIndices
    }

    return mergedIndices
}

function handleSnapping(heldPieceIndex, pieces, rows, cols) {
    const heldPiece = pieces[heldPieceIndex]
    const droppedGroupIndices = heldPiece.connectedPieces

    const snap = checkIfPieceSnaps(heldPiece, droppedGroupIndices, pieces, rows, cols)

    if (snap) {
        moveGroup(pieces, droppedGroupIndices, -snap.deltaX, -snap.deltaZ)

        const partnerIndex = getPieceIndex(snap.partner.gridRow, snap.partner.gridCol, cols)
        const partnerGroupIndices = snap.partner.connectedPieces

        const mergedIndices = mergeGroups(pieces, droppedGroupIndices, partnerGroupIndices)

        getSlot(snap.piece, snap.slotName).connected = true
        getSlot(snap.partner, getOpposite(snap.slotName)).connected = true

        checkIfPieceConnects(pieces, mergedIndices, rows, cols)

        return true
    }

    return false
}

export {
    moveGroup,
    returnPositionalErrorAndSomeOtherStuff,
    checkIfPieceSnaps,
    checkIfPieceConnects,
    mergeGroups,
    handleSnapping,
    getSlot
}
