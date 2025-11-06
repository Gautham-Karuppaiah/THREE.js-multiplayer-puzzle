import { getOpposite } from "./utils.js"
import { config } from "./config.js"

function moveGroup(pieces, group, deltaX, deltaZ) {
    for (const pieceIndex of group) {
        const piece = pieces[pieceIndex]
        piece.positionX += deltaX
        piece.positionZ += deltaZ
    }
}

function returnPositionalErrorAndSomeOtherStuff(piece1, slotName, piece2) {
    const actualDx = piece2.positionX - piece1.positionX
    const actualDz = piece2.positionZ - piece1.positionZ

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

function checkIfPieceSnaps(pieces, heldPieceIndex, droppedGroup) {
    const heldPiece = pieces[heldPieceIndex]

    // Check held piece slots first
    for (const slotName of ["top", "right", "bottom", "left"]) {
        const slot = heldPiece[`slot${slotName.charAt(0).toUpperCase() + slotName.slice(1)}`]

        if (slot.connected) continue

        // Find partner piece by checking all pieces
        for (let i = 0; i < pieces.length; i++) {
            if (droppedGroup.includes(i)) continue

            const potentialPartner = pieces[i]
            const oppositeSlot = getOpposite(slotName)
            const oppositeSlotKey = `slot${oppositeSlot.charAt(0).toUpperCase() + oppositeSlot.slice(1)}`

            // Check if they're supposed to connect (adjacent grid positions)
            let isAdjacent = false
            switch (slotName) {
                case "top":
                    isAdjacent =
                        potentialPartner.gridRow === heldPiece.gridRow - 1 &&
                        potentialPartner.gridCol === heldPiece.gridCol
                    break
                case "bottom":
                    isAdjacent =
                        potentialPartner.gridRow === heldPiece.gridRow + 1 &&
                        potentialPartner.gridCol === heldPiece.gridCol
                    break
                case "left":
                    isAdjacent =
                        potentialPartner.gridRow === heldPiece.gridRow &&
                        potentialPartner.gridCol === heldPiece.gridCol - 1
                    break
                case "right":
                    isAdjacent =
                        potentialPartner.gridRow === heldPiece.gridRow &&
                        potentialPartner.gridCol === heldPiece.gridCol + 1
                    break
            }

            if (!isAdjacent) continue

            const result = returnPositionalErrorAndSomeOtherStuff(
                heldPiece,
                slotName,
                potentialPartner
            )

            if (result.errorMagnitude < config.snapThreshold) {
                return {
                    pieceIndex: heldPieceIndex,
                    slotName,
                    partnerIndex: i,
                    deltaX: result.deltaX,
                    deltaZ: result.deltaZ
                }
            }
        }
    }

    // Check other pieces in dropped group
    for (const pieceIndex of droppedGroup) {
        if (pieceIndex === heldPieceIndex) continue
        const piece = pieces[pieceIndex]

        for (const slotName of ["top", "right", "bottom", "left"]) {
            const slot = piece[`slot${slotName.charAt(0).toUpperCase() + slotName.slice(1)}`]

            if (slot.connected) continue

            // Find partner piece
            for (let i = 0; i < pieces.length; i++) {
                if (droppedGroup.includes(i)) continue

                const potentialPartner = pieces[i]

                // Check if they're supposed to connect
                let isAdjacent = false
                switch (slotName) {
                    case "top":
                        isAdjacent =
                            potentialPartner.gridRow === piece.gridRow - 1 &&
                            potentialPartner.gridCol === piece.gridCol
                        break
                    case "bottom":
                        isAdjacent =
                            potentialPartner.gridRow === piece.gridRow + 1 &&
                            potentialPartner.gridCol === piece.gridCol
                        break
                    case "left":
                        isAdjacent =
                            potentialPartner.gridRow === piece.gridRow &&
                            potentialPartner.gridCol === piece.gridCol - 1
                        break
                    case "right":
                        isAdjacent =
                            potentialPartner.gridRow === piece.gridRow &&
                            potentialPartner.gridCol === piece.gridCol + 1
                        break
                }

                if (!isAdjacent) continue

                const result = returnPositionalErrorAndSomeOtherStuff(
                    piece,
                    slotName,
                    potentialPartner
                )

                if (result.errorMagnitude < config.snapThreshold) {
                    return {
                        pieceIndex,
                        slotName,
                        partnerIndex: i,
                        deltaX: result.deltaX,
                        deltaZ: result.deltaZ
                    }
                }
            }
        }
    }

    return null
}

function checkIfPieceConnects(pieces, group) {
    for (const pieceIndex of group) {
        const piece = pieces[pieceIndex]

        for (const slotName of ["top", "right", "bottom", "left"]) {
            const slotKey = `slot${slotName.charAt(0).toUpperCase() + slotName.slice(1)}`
            const slot = piece[slotKey]

            if (slot.connected) continue

            // Find partner
            for (const partnerIndex of group) {
                if (partnerIndex === pieceIndex) continue
                const partner = pieces[partnerIndex]

                // Check if adjacent
                let isAdjacent = false
                switch (slotName) {
                    case "top":
                        isAdjacent =
                            partner.gridRow === piece.gridRow - 1 &&
                            partner.gridCol === piece.gridCol
                        break
                    case "bottom":
                        isAdjacent =
                            partner.gridRow === piece.gridRow + 1 &&
                            partner.gridCol === piece.gridCol
                        break
                    case "left":
                        isAdjacent =
                            partner.gridRow === piece.gridRow &&
                            partner.gridCol === piece.gridCol - 1
                        break
                    case "right":
                        isAdjacent =
                            partner.gridRow === piece.gridRow &&
                            partner.gridCol === piece.gridCol + 1
                        break
                }

                if (!isAdjacent) continue

                const result = returnPositionalErrorAndSomeOtherStuff(piece, slotName, partner)

                if (result.errorMagnitude < config.connectionThreshold) {
                    slot.connected = true
                    const oppositeSlot = getOpposite(slotName)
                    const oppositeSlotKey = `slot${oppositeSlot.charAt(0).toUpperCase() + oppositeSlot.slice(1)}`
                    partner[oppositeSlotKey].connected = true
                }
            }
        }
    }
}

function mergeGroups(pieces, group1, group2) {
    const newGroup = [...group1, ...group2]

    for (const pieceIndex of newGroup) {
        pieces[pieceIndex].connectedPieces = newGroup
    }

    return newGroup
}

export function handleSnapping(pieces, heldPieceIndex, droppedGroup) {
    const snap = checkIfPieceSnaps(pieces, heldPieceIndex, droppedGroup)

    if (snap) {
        moveGroup(pieces, droppedGroup, -snap.deltaX, -snap.deltaZ)

        const partnerPiece = pieces[snap.partnerIndex]
        const partnerGroup = [...partnerPiece.connectedPieces]

        const newGroup = mergeGroups(pieces, droppedGroup, partnerGroup)

        const snapPiece = pieces[snap.pieceIndex]
        const snapSlotKey = `slot${snap.slotName.charAt(0).toUpperCase() + snap.slotName.slice(1)}`
        snapPiece[snapSlotKey].connected = true

        const oppositeSlot = getOpposite(snap.slotName)
        const oppositeSlotKey = `slot${oppositeSlot.charAt(0).toUpperCase() + oppositeSlot.slice(1)}`
        partnerPiece[oppositeSlotKey].connected = true

        checkIfPieceConnects(pieces, newGroup)

        return true
    }

    return false
}
