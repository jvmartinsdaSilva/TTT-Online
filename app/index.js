const socket = io()

const $playerType = document.querySelector("#playerType")
const $cells = document.querySelectorAll(".cells")
const $messageTurn = document.querySelector(".turn")
const $messageEndGame = document.querySelector(".endGame")

const showInfos = player => {
    console.log(player)
    $playerType.classList.add(player.type)
    $playerType.innerHTML = `Your is ${player.type}`
}

const attCell = (cell, type) => {
    cell.innerHTML = type
    cell.classList.add(type)
}

const playerGaming = (player, cell) => {
    const cellId = cell.id
    const playerType = player.type
    socket.emit("socketPlay", {playerType, cellId})
}

socket.on("connect", () => socket.emit("msg", socket.id))
socket.on("disconnect", () => socket.emit("msg" , "saiu"))
socket.on("connect_error", error => console.log(error.msg))

socket.on("player", player => {
    showInfos(player)
    $cells.forEach(cell => cell.addEventListener("click", () => playerGaming(player, cell)))
})

socket.on("turn", msg => $messageTurn.textContent = msg)

socket.on("attGame", gameStatus => {
    const { playerX, playerO } = gameStatus

    $cells.forEach(cell => {
        playerX.map(position => cell.id === position && attCell(cell, "X"))
        playerO.map(position => cell.id === position && attCell(cell, "O"))
    })
})

socket.on("endGame", msg => {
    $messageEndGame.textContent = msg
    $messageEndGame.classList.add(msg[0])
})

socket.on("resetGame", () => {
    $messageEndGame.textContent = ''
    $cells.forEach(cell => {
        cell.textContent = ''
        cell.classList.remove("X")
        cell.classList.remove("O")
    })
    $messageEndGame.classList.remove("X")
    $messageEndGame.classList.remove("O")
})