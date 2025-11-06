import config from "@colyseus/tools"
import { monitor } from "@colyseus/monitor"
import { playground } from "@colyseus/playground"
import express from "express"

import { PuzzleRoom } from "./rooms/PuzzleRoom.js"

export default config({
    initializeGameServer: (gameServer) => {
        gameServer.define("puzzleroom", PuzzleRoom)
    },

    initializeExpress: (app) => {
        app.use("/images", express.static("public/images")) //loads currently hardcoded texture

        app.get("/hello_world", (req, res) => {
            res.send("It's time to kick ass and chew bubblegum!")
        })

        if (process.env.NODE_ENV !== "production") {
            app.use("/", playground())
        }

        app.use("/monitor", monitor())
    },

    beforeListen: () => {
        /**
         * Before before gameServer.listen() is called.
         */
    }
})
