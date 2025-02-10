'use strict'

// globals
let gTimerInterval
let gBoard
let gLevel = {
  SIZE: 4,
  MINES: 2,
}
let gGame = {
  isOn: false,
  shownCount: 0,
  markedCount: 0,
  secsPassed: 0,
  liveCount: 2,
  hintCount: 2,
  safeClickCount: 2,
  isHint: false,
  isSafeClick: false,
  is7Boom: false,
}
let gIsFirstClick = false
const MINE = '💣'
const FLAG = '🚩'

function initGame() {
  resetTimer()
  gIsFirstClick = false

  if (gGame.is7Boom) {
    gGame = {
      isOn: false,
      shownCount: 0,
      markedCount: 0,
      secsPassed: 0,
      liveCount: gLevel.SIZE === 4 ? 2 : 3,
      hintCount: gLevel.SIZE === 4 ? 2 : 3,
      safeClickCount: gLevel.SIZE === 4 ? 2 : 3,
      isHint: false,
      isSafeClick: false,
      is7Boom: true,
    }
    gBoard = build7BoomBoard()
  } else {
    gGame = {
      isOn: false,
      shownCount: 0,
      markedCount: 0,
      secsPassed: 0,
      liveCount: gLevel.SIZE === 4 ? 2 : 3,
      hintCount: gLevel.SIZE === 4 ? 2 : 3,
      safeClickCount: gLevel.SIZE === 4 ? 2 : 3,
      isHint: false,
      isSafeClick: false,
      is7Boom: false,
    }
    gBoard = buildBoard()
  }
  renderLives()
  renderHints()
  renderSafeClicks()
  renderBoard()
  printBoardForDebug(gBoard)
  const elSmiley = document.querySelector('.control-panel .smiley')
  elSmiley.innerText = '😀'
}

function buildBoard() {
  const mat = []
  for (let i = 0; i < gLevel.SIZE; i++) {
    mat[i] = []
    for (let j = 0; j < gLevel.SIZE; j++) {
      mat[i][j] = {
        minesAroundCount: 0,
        isShown: false,
        isMine: false,
        isMarked: false,
      }
    }
  }

  return mat
}

function setMinesNegsCount(board) {
  // done: count mines around each cell and set the cell's minesAroundCount property.
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[0].length; j++) {
      const currCell = board[i][j]
      currCell.minesAroundCount = countNearMines(board, { i, j })
    }
  }
}

function cellClicked(elCell, i, j) {
  // done: called when a cell (td) is clicked
  checkFirstClick({ i, j })
  if (gGame.isHint) {
    checkHintClick({ i, j })
    return
  }

  if (!gGame.isOn) return
  // update the model:
  const cell = gBoard[i][j]
  if (cell.isMarked) return
  if (cell.isShown) return

  // update the DOM:
  if (!cell.isMine) {
    expandShown(gBoard, i, j)
    checkGameOver()
  } else if (cell.isMine) {
    const elSmiley = document.querySelector('.control-panel .smiley')
    elSmiley.innerText = '😖'
    cell.isShown = true
    gGame.liveCount--
    renderLives()
    renderCell(elCell, cell)
    checkGameOver()
    if (gGame.isOn) {
      setTimeout(() => {
        elSmiley.innerText = '😀'
      }, 400)
    }
  }
}

function expandShown(board, i, j) {
  // done: when user clicks a cell with no mines around, we need to open not only that cell, but also its neighbors.
  let elCell = getCellByClass({ i, j })
  const pos = { i, j }
  const cell = board[i][j]
  cell.isShown = true
  renderCell(elCell, cell)

  if (cell.minesAroundCount > 0) return

  for (let i = pos.i - 1; i <= pos.i + 1; i++) {
    if (i < 0 || i >= board.length) continue
    for (let j = pos.j - 1; j <= pos.j + 1; j++) {
      if (j < 0 || j >= board[0].length) continue
      if (pos.i === i && pos.j === j) continue

      const currCell = board[i][j]

      if (
        !currCell.isMine &&
        !currCell.isMarked &&
        currCell.minesAroundCount === 0 &&
        !currCell.isShown
      ) {
        // recursion
        expandShown(board, i, j)
      } else if (
        !currCell.isMine &&
        !currCell.isMarked &&
        currCell.minesAroundCount > 0 &&
        !currCell.isShown
      ) {
        currCell.isShown = true
        elCell = getCellByClass({ i, j })
        renderCell(elCell, currCell)
      }
    }
  }
}

function cellMarked(elCell, i, j) {
  // done: called on right click to mark a cell (suspected to be a mine)
  checkFirstClick({ i, j })
  const location = { i, j }
  // update the model
  const cell = gBoard[location.i][location.j]
  if (cell.isShown) {
    openAlert(false, 'You can not mark an opened cell 😖')
    return
  }
  cell.isMarked = !cell.isMarked

  // update the DOM
  elCell.innerText = cell.isMarked ? FLAG : null
  if (elCell.classList.contains('danger')) elCell.classList.remove('danger')
  elCell.classList.toggle('success')
  checkGameOver()
}

function checkGameOver() {
  // done: game ends when all mines are marked, and all the other cells are shown
  if (!gGame.liveCount) {
    gGame.isOn = false
    stopTimer()
    revealAllMines()
    openAlert(false, 'Oof. You lost!')
    renderSmiley(false)
    return
  }

  for (let i = 0; i < gBoard.length; i++) {
    for (let j = 0; j < gBoard[0].length; j++) {
      const currCell = gBoard[i][j]
      if (currCell.isMine && !currCell.isMarked) {
        return
      }
      if (!currCell.isShown && !currCell.isMine) {
        return
      }
    }
  }

  gGame.isOn = false
  stopTimer()
  openAlert(true, 'You won the game!')
  renderSmiley(true)
  return true
}

function setMinesAtRandomLocation(mat, locations, pos) {
  const copyLocations = JSON.parse(JSON.stringify(locations))
  const negsLocation = findNegsLocation(gBoard, pos)

  // clean negs location:
  for (let i = 0; i < negsLocation.length; i++) {
    const currNeg = negsLocation[i]
    for (let j = 0; j < copyLocations.length; j++) {
      const currLoc = copyLocations[j]
      if (currNeg.i === currLoc.i && currNeg.j === currLoc.j) copyLocations.splice(j, 1)
    }
  }
  shuffleArray(copyLocations)

  let minesCount = 0
  while (minesCount < gLevel.MINES) {
    const randomLocation = copyLocations.pop()
    if (randomLocation.i === pos.i && randomLocation.j === pos.j) continue
    mat[randomLocation.i][randomLocation.j].isMine = true
    minesCount++
  }
}

function countNearMines(mat, pos) {
  let count = 0
  for (let i = pos.i - 1; i <= pos.i + 1; i++) {
    if (i < 0 || i >= mat.length) continue
    for (let j = pos.j - 1; j <= pos.j + 1; j++) {
      if (j < 0 || j >= mat[0].length) continue
      if (pos.i === i && pos.j === j) continue
      const cell = mat[i][j]
      if (cell.isMine) {
        count++
      }
    }
  }
  return count
}

function setLevel(size) {
  switch (size) {
    case 4:
      gLevel = { ...gLevel, SIZE: 4, MINES: 2 }
      gGame = { ...gGame, liveCount: 2, hintCount: 2, safeClickCount: 2 }
      break
    case 8:
      gLevel = { ...gLevel, SIZE: 8, MINES: 12 }
      break
    case 12:
      gLevel = { ...gLevel, SIZE: 12, MINES: 30 }
    default:
      gGame = { ...gGame, liveCount: 3, hintCount: 3, safeClickCount: 3 }
      break
  }
  initGame()
}

function revealAllMines() {
  for (let i = 0; i < gBoard.length; i++) {
    for (let j = 0; j < gBoard[0].length; j++) {
      const pos = { i, j }
      const currCell = gBoard[i][j]
      const elCell = getCellByClass(pos)
      if (currCell.isMine) renderCell(elCell, currCell)
    }
  }
}

function checkFirstClick(pos) {
  if (!gIsFirstClick) {
    gIsFirstClick = true
    gGame.isOn = true
    if (!gGame.is7Boom) {
      // set mines:
      const emptyPlaces = getEmptyPlaces(gBoard)
      setMinesAtRandomLocation(gBoard, emptyPlaces, pos)
    }
    setMinesNegsCount(gBoard)
    printBoardForDebug(gBoard)
    startTimer()
  }
}

function getEmptyPlaces(mat) {
  const emptyPlaces = []
  for (let i = 0; i < mat.length; i++) {
    for (let j = 0; j < mat[0].length; j++) {
      const currCell = mat[i][j]
      const cellLocation = { i, j }
      if (!currCell.isMine) emptyPlaces.push(cellLocation)
    }
  }
  return emptyPlaces
}

/* ========== Bonus Tasks ========== */
// bonus - hints
function toggleHintMode() {
  gGame.isHint = !gGame.isHint
  openAlert(true, 'You can click a cell to see the hint!')
}

function checkHintClick(pos) {
  gGame.isHint = false
  if (!gGame.hintCount) {
    openAlert(false, 'You used all your hints!')
    return
  }
  gGame.hintCount--
  renderHints()
  const negsLocation = findNegsLocation(gBoard, pos)
  negsLocation.push(pos)

  for (var i = 0; i < negsLocation.length; i++) {
    const currLoc = negsLocation[i]
    // model
    const cell = gBoard[currLoc.i][currLoc.j]
    // update DOM
    const elCell = getCellByClass({ i: currLoc.i, j: currLoc.j })
    elCell.classList.toggle('active-hint')

    if (cell.isMine && !cell.isMarked) {
      elCell.innerText = '💣'
    } else if (cell.minesAroundCount > 0 && !cell.isMarked) {
      elCell.innerText = cell.minesAroundCount
    } else if (cell.minesAroundCount === 0 && !cell.isMarked) {
      elCell.innerText = ''
    } else if (cell.isMarked) {
      elCell.innerText = '🚩'
    }
  }

  setTimeout(() => {
    for (let i = 0; i < negsLocation.length; i++) {
      const currLoc = negsLocation[i]
      // model
      const cell = gBoard[currLoc.i][currLoc.j]
      // update DOM
      const elCell = getCellByClass({ i: currLoc.i, j: currLoc.j })

      if (!cell.isShown && !cell.isMarked) {
        elCell.classList.remove('active-hint')
        elCell.innerText = ''
      }
    }
  }, 1000)
}

// bonus - safe clicks
function toggleSafeMode() {
  gGame.isSafeClick = true
  if (gGame.isSafeClick) {
    checkSafeClick()
  }
}

function checkSafeClick() {
  gGame.isSafeClick = false
  if (!gGame.safeClickCount) {
    openAlert(false, 'You used all your safe clicks!')
    return
  }
  gGame.safeClickCount--
  renderSafeClicks()

  const safeLocations = []
  for (let i = 0; i < gBoard.length; i++) {
    for (let j = 0; j < gBoard[0].length; j++) {
      const currCell = gBoard[i][j]
      if (!currCell.isMine && !currCell.isMarked && !currCell.isShown) safeLocations.push({ i, j })
    }
  }

  if (!safeLocations.length) {
    openAlert(false, 'No more safe places!')
    return
  }

  shuffleArray(safeLocations)
  const randomLocation = safeLocations.pop()
  // model
  const cell = gBoard[randomLocation.i][randomLocation.j]
  // update DOM
  const elCell = getCellByClass({ i: randomLocation.i, j: randomLocation.j })
  elCell.classList.add('safe-active')

  setTimeout(() => {
    elCell.classList.remove('safe-active')
  }, 1000)
}

// bonus - 7 BOOM!
function toggle7Boom() {
  gGame.is7Boom = !gGame.is7Boom
  renderActiveBtn('.btn-boom', gGame.is7Boom)
  initGame()
}

function build7BoomBoard() {
  const mat = []
  let count = 0
  for (let i = 0; i < gLevel.SIZE; i++) {
    mat[i] = []
    for (let j = 0; j < gLevel.SIZE; j++) {
      const idx = `${count++}`
      mat[i][j] = {
        minesAroundCount: 0,
        isShown: false,
        isMine: false,
        isMarked: false,
      }
      if (+idx.charAt(0) === 7 || +idx.charAt(1) === 7 || (+idx % 7 === 0 && +idx !== 0))
        mat[i][j].isMine = true
    }
  }

  return mat
}
