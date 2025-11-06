import { Room } from "@colyseus/core";
import {PuzzlePiece, Player, PuzzleRoomState  } from "./schema/Schema.js";
import { generatePuzzlePieces } from "./puzzleGeneration.js";
import imageSize from "image-size";
import { readFileSync } from "fs";

export class PuzzleRoom extends Room {
  maxClients = 4;
  state = new PuzzleRoomState();

  onCreate (options) {
    const rows = 10;
    const cols = 10;
    const imageUrl = "http://localhost:2567/images/puzzle.jpg";
    const imagePath = "./public/images/puzzle.jpg";

    this.state.rows = rows;
    this.state.cols = cols;
    this.state.imageUrl = imageUrl;

    // Get image dimensions and calculate aspect ratio
    const imageBuffer = readFileSync(imagePath);
    const dimensions = imageSize(imageBuffer);
    const aspectRatio = dimensions.width / dimensions.height;
    const aspectRatioScaleX = aspectRatio >= 1 ? aspectRatio : 1;
    const aspectRatioScaleZ = aspectRatio <= 1 ? (1 / aspectRatio) : 1;

    console.log(`Image dimensions: ${dimensions.width}x${dimensions.height}, aspect ratio: ${aspectRatio.toFixed(2)}`);

    const pieces = generatePuzzlePieces(cols, rows, aspectRatioScaleX, aspectRatioScaleZ);
    this.state.pieces = pieces;

    console.log(`Puzzle room created: ${cols}x${rows}, ${pieces.length} pieces`);

    this.onMessage("type", (client, message) => {

    });

  }

  onJoin (client, options) {
    console.log(client.sessionId, "joined!");
    const player = new Player();
    player.cursorX = 0;
    player.cursorY = 0;
    this.state.players.set(client.sessionId, player);

  }

  onLeave (client, consented) {
    console.log(client.sessionId, "left!");
    this.state.players.delete(client.sessionId);
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }

}
