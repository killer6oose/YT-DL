'use strict'

function renderBoard() {
  // done: render the board as a <table> to the page
  let strHTML = ``
  for (let i = 0; i < gBoard.length; i++) {
    strHTML += `<tr>\n`
    for (let j = 0; j < gBoard.length; j++) {
      const currCell = gBoard[i][j]
      let cellContent = currCell.isShown ? (currCell.isMine ? MINE : currCell.minesAroundCount) : ''
      strHTML += `\t<td class="cell-${i}-${j}" oncontextmenu="cellMarked(this, ${i}, ${j}); return false;" onclick="cellClicked(this, ${i}, ${j})">${cellContent}</td>\n`
    }
    strHTML += `</tr>\n`
  }

  const elBoard = document.querySelector('.board')
  elBoard.innerHTML = strHTML
}

function renderCell(elCell, cell) {
  if (cell.isMine) {
    elCell.innerText = MINE
    elCell.classList.add('danger')
  } else {
    elCell.innerText = cell.minesAroundCount ? cell.minesAroundCount : ''
    elCell.classList.add('success')
  }
}

function renderSmiley(isWin) {
  const elSmiley = document.querySelector('.control-panel .smiley')
  elSmiley.innerText = isWin ? '😎' : '🤯'
}

function renderLives() {
  let strHTML = `<span class="heart">❤️</span>`.repeat(gGame.liveCount)
  strHTML += `<span class="death">❤</span>`.repeat(3 - gGame.liveCount)
  document.querySelector('.control-panel .lives').innerHTML = strHTML
}

function renderHints() {
  let strHTML = `<span class="hint">💡</span>`.repeat(gGame.hintCount)
  strHTML += `<span class="hint">❌</span>`.repeat(3 - gGame.hintCount)
  document.querySelector('.hints').innerHTML = strHTML
}

function renderSafeClicks() {
  let strHTML = `<span class="safe-click">⭐</span>`.repeat(gGame.safeClickCount)
  strHTML += `<span class="safe-click">❌</span>`.repeat(3 - gGame.safeClickCount)
  document.querySelector('.safe-clicks').innerHTML = strHTML
}

function openAlert(isWin, msg = '') {
  let elAlert = document.querySelector('.alert')
  elAlert.querySelector('.msg').innerText = msg
  elAlert.style.backgroundColor = isWin ? 'var(--success)' : 'var(--danger)'
  elAlert.classList.toggle('active')
  setTimeout(closeAlert, 3000)
}

function closeAlert() {
  document.querySelector('.alert').classList.remove('active')
}

function renderActiveBtn(selector, isActive) {
  const element = document.querySelector(selector)
  if (isActive) element.classList.add('active')
  else element.classList.remove('active')
}
