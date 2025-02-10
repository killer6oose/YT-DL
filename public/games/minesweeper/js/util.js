'use strict'

// util functions
function startTimer() {
  // if interval already started don't start a new one.
  if (gTimerInterval) return

  // catch the DOM elements
  let elTimer = document.querySelector('.timer')
  let elSeconds = elTimer.querySelector('.seconds')
  let elMinutes = elTimer.querySelector('.minutes')

  // create time vars - model
  let seconds = 0
  let minutes = 0
  gTimerInterval = setInterval(() => {
    seconds++
    if (seconds === 60) {
      minutes++
      seconds = 0
    }
    // render to DOM
    elSeconds.innerText = seconds.toString().padStart(2, '0')
    elMinutes.innerText = minutes.toString().padStart(2, '0')
  }, 1000)
}

function stopTimer() {
  clearInterval(gTimerInterval)
}

function resetTimer() {
  stopTimer()
  gTimerInterval = null

  // catch the DOM elements
  const elTimer = document.querySelector('.timer')
  const elSeconds = elTimer.querySelector('.seconds')
  const elMinutes = elTimer.querySelector('.minutes')
  // create time vars - model
  let seconds = 0
  let minutes = 0

  // render to DOM
  elSeconds.innerText = seconds.toString().padStart(2, '0')
  elMinutes.innerText = minutes.toString().padStart(2, '0')
}

function getRandomInt(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1) + min) //The maximum is exclusive and the minimum is inclusive
}

function getRandomColor() {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}

function printBoardForDebug(mat) {
  const printedMat = []
  for (let i = 0; i < mat.length; i++) {
    printedMat[i] = []
    for (let j = 0; j < mat[0].length; j++) {
      const currCell = mat[i][j]
      const cellContent = currCell.isMine ? MINE : currCell.minesAroundCount
      printedMat[i][j] = cellContent
    }
  }
}

function findNegsLocation(board, pos) {
  const negsLocation = []
  for (let i = pos.i - 1; i <= pos.i + 1; i++) {
    if (i < 0 || i >= board.length) continue
    for (let j = pos.j - 1; j <= pos.j + 1; j++) {
      if (j < 0 || j >= board[0].length) continue
      if (pos.i === i && pos.j === j) continue

      negsLocation.push({ i, j })
    }
  }

  return negsLocation
}

function getCellByClass(pos) {
  return document.querySelector(`.cell-${pos.i}-${pos.j}`)
}
