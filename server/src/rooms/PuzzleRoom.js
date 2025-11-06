import { Room } from "@colyseus/core"
import { PuzzlePiece, Player, PuzzleRoomState } from "./schema/Schema.js"
import { generatePuzzlePieces } from "./puzzleGeneration.js"
import { handleSnapping } from "./snapping.js"
import { config } from "./config.js"
import imageSize from "image-size"
import { readFileSync } from "fs"

export class PuzzleRoom extends Room {
    maxClients = 4
    state = new PuzzleRoomState()

    onCreate(options) {
        const rows = 10
        const cols = 10
        const imageUrl = "http://localhost:2567/images/puzzle.jpg"
        const imagePath = "./public/images/puzzle.jpg"

        this.state.rows = rows
        this.state.cols = cols
        this.state.imageUrl = imageUrl

        const imageBuffer = readFileSync(imagePath)
        const dimensions = imageSize(imageBuffer)
        const aspectRatio = dimensions.width / dimensions.height
        config.aspectRatioScaleX = aspectRatio >= 1 ? aspectRatio : 1
        config.aspectRatioScaleZ = aspectRatio <= 1 ? 1 / aspectRatio : 1

        const pieces = generatePuzzlePieces(
            cols,
            rows,
            config.aspectRatioScaleX,
            config.aspectRatioScaleZ
        )
        this.state.pieces = pieces

        console.log(`Puzzle room created: ${cols}x${rows}, ${pieces.length} pieces`)

        this.onMessage("pickUpRequest", (client, payload) => {
            //listens to pick up requests from client, checks if valid then updates and syncs piece positions
            const piece = this.state.pieces[payload.pieceId]

            if (piece && !piece.heldBy) {
                piece.heldBy = client.sessionId
                console.log(`Player ${client.sessionId} picked up piece ${payload.pieceId}`)
            }
        })

        this.onMessage("dragToRequest", (client, payload) => {
            //does the same thing but for dragging a piece and all the pieces in its group
            const piece = this.state.pieces[payload.pieceId]

            if (piece && piece.heldBy === client.sessionId) {
                const deltaX = payload.position.x - piece.positionX
                const deltaY = payload.position.y - piece.positionY
                const deltaZ = payload.position.z - piece.positionZ

                //move all pieces in the connected group
                for (const pieceIndex of piece.connectedPieces) {
                    const groupPiece = this.state.pieces[pieceIndex]
                    groupPiece.positionX += deltaX
                    groupPiece.positionY += deltaY
                    groupPiece.positionZ += deltaZ
                }
            }
        })

        this.onMessage("dropRequest", (client, payload) => {
            //does the same thing but for dropping a piece and updating its owner to none
            const piece = this.state.pieces[payload.pieceId]

            if (piece && piece.heldBy === client.sessionId) {
                const deltaX = payload.position.x - piece.positionX
                const deltaY = payload.position.y - piece.positionY
                const deltaZ = payload.position.z - piece.positionZ

                //move all pieces in the connected group to final position
                for (const pieceIndex of piece.connectedPieces) {
                    const groupPiece = this.state.pieces[pieceIndex]
                    groupPiece.positionX += deltaX
                    groupPiece.positionY += deltaY
                    groupPiece.positionZ += deltaZ
                }

                const droppedGroup = [...piece.connectedPieces]
                const snapped = handleSnapping(this.state.pieces, payload.pieceId, droppedGroup)

                piece.heldBy = ""
                console.log(
                    `Player ${client.sessionId} dropped piece ${payload.pieceId}${snapped ? " (snapped!)" : ""}`
                )
            }
        })
    }

    onJoin(client, options) {
        //listens for plaer join
        console.log(client.sessionId, "joined!")
        const player = new Player()
        player.cursorX = 0
        player.cursorY = 0
        this.state.players.set(client.sessionId, player)
    }

    onLeave(client, consented) {
        //listens for player leave
        console.log(client.sessionId, "left!")
        this.state.players.delete(client.sessionId)
    }

    onDispose() {
        console.log("room", this.roomId, "disposing...")
    }
}
