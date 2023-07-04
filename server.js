const express = require("express")
const app = express()
const http = require('http').createServer(app)
const io = require("socket.io")(http)
const PORT = 3000

const playersConect = []
const players = {
    X: { type: "X", cells: [] },
    O: { type: "O", cells: [] }
}

let turn = 'X'
let gameState = true

const itsMaxPlayers = (socket, next) => {
    if (playersConect.length >= 2) return next(new Error({ msg: "Error maximun players" }))

    return next()
}

const resetGame = () => {
    players['X'].cells = []
    players['O'].cells = []
    setTimeout(() => {
        turn = 'X'
        io.emit("resetGame")
        io.emit("turn", `Its ${turn} turn`)
        gameState = true
    }, 5000)
}

const endGame = msg => {
    io.emit("endGame", msg)
    gameState = false
    resetGame()
}

const checkGameState = playerType => {
    const WINNER_COMBINATIONS = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['1', '4', '7'],
        ['2', '5', '8'],
        ['3', '6', '9'],
        ['1', '5', '9'],
        ['3', '5', '7']
    ]
    const { cells } = players[playerType]
    
    const isWinner = WINNER_COMBINATIONS.some(comb => {
        return comb.every(index => cells.includes(index))
    })

    const checkTied = () => {
        const cellsX = players['X'].cells
        const cellsO = players['O'].cells

        const tied = cellsX.length + cellsO.length >= 9
        return tied
    }

    const isTied = checkTied()

    if(isWinner) return endGame(`${playerType} winner`)
    if(isTied) return endGame("Gaming tied")

}

const loginPlayer = () => {
    if (playersConect.length <= 0) {
        const newPlayer = "X"
        playersConect.push({ type: newPlayer })
        return players[newPlayer]
    }

    const playerConect = playersConect[0]
    const newPlayer = playerConect.type === "X" ? "O" : "X"
    playersConect.push({ type: newPlayer })
    return players[newPlayer]
}


const logoutPlayer = playerInfo => {
    const playerTye = playerInfo.type

    for (let p = 0; p < playersConect.length; p++) {
        if (playersConect[p].type === playerTye) {
            playersConect.splice(p, 1)
        }
    }
    endGame(`Your opponent left!`)
    resetGame()
}

const checkTurn = playerType => playerType === turn

const isValidPositivion = position => {
    if (players['X'].cells.includes(position) || players['O'].cells.includes(position)) return false

    return true
}

const addNewPosition = infos => {
    const { playerType, cellId } = infos
    players[playerType].cells.push(cellId)
}

const toggleTurn = () => turn === "X" ? turn = "O" : turn = "X"

const attGaming = () => {
    const playerX = players['X'].cells
    const playerO = players['O'].cells

    io.emit("turn", `Its ${turn} turn`)
    io.emit("attGame", { playerX, playerO })

}

const playerGaming = infos => {
    const { playerType, cellId } = infos
    const isValidTurn = checkTurn(playerType)
    const positionIsValid = isValidPositivion(cellId)

    if (!isValidTurn || !positionIsValid) return false

    addNewPosition(infos)
    toggleTurn()
    attGaming()
    checkGameState(playerType)
}


io.use(itsMaxPlayers)

io.on("connect", socket => {
    const playerInfo = loginPlayer()
    attGaming()
    socket.emit("player", playerInfo)
    socket.on("disconnect", () => {
        logoutPlayer(playerInfo)
        socket.emit("msg", `${socket.id} disconnect`)
    })

    socket.on("socketPlay", infos => {
        if(!gameState) return false
        playerGaming(infos)
    })
})


app.use("/", express.static("app"))
http.listen(PORT, () => console.log("Server on in http://localhost:" + PORT))