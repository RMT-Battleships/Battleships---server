var Player = require("./playerModule.js");
var GameState = require("./gameStateModule.js");

// game constructor
function Game(idOfGame, idOfPlayer1, idOfPlayer2) {
  this.id = idOfGame; // game id
  this.currentPlayer = Math.floor(Math.random() * 2); // player on turn
  this.winningPlayer = null; // player who won the game
  this.gameState = GameState.inProgress; // is game in progress or completed

  this.players = [new Player(idOfPlayer1), new Player(idOfPlayer2)];
}

// get id of socket of exact player
Game.prototype.getPlayerId = function (player) {
  return this.players[player].id.id;
};

// get id of socket of player who won the game
Game.prototype.getWinningPlayerId = function () {
  if (this.winningPlayer === null) {
    // if game !have winning player
    
    return null;
  }

  return this.players[this.winningPlayer].id.id;
};

// get id of socket of player who lose the game
Game.prototype.getLosingPlayerId = function () {
  if (this.winningPlayer === null) {
    // if game !have winning player
    
    return null;
  }

  return this.players[1 - this.winningPlayer].id.id;
};

// change which player is on turn
Game.prototype.changeTurn = function () {
  this.currentPlayer = 1 - this.currentPlayer;
};

// player left game -> Game completed, opponent wins 
Game.prototype.endTheGame = function (player) {
  this.gameState = GameState.completed;
  this.winningPlayer = 1 - player;
};

// processing the shot
Game.prototype.torpedo = function (position) {
  var opponent = 1 - this.currentPlayer,
    gridIndex = +position.y * 10 + +position.x;
  
  if (
    this.players[opponent].shots[gridIndex] == 0 &&
    this.gameState == GameState.inProgress
  ) {
    // if field !hit yet
    if (!this.players[opponent].torpedo(gridIndex)) {
      // if ship !hit

      this.changeTurn();
    }

    
    if (this.players[opponent].getNumberOfShipsLeft() <= 0) {
      // if no ships left -> game over

      //console.log("kraj");
      this.gameState = GameState.completed;
      //console.log(this.gameState);
      this.winningPlayer = 1 - opponent;
      //console.log(opponent);
      //console.log(this.winningPlayer);
    }

    return true;
  }

  return false;
};

Game.prototype.getGameStateData = function (player, gridOwner) {
  return {
    turn: this.currentPlayer === player, // is it this player's turn?
    points: [this.players[1 - player].points, this.players[player].points], // number of points for each player
    gridIndex: player === gridOwner ? 0 : 1, // which client grid to update (0 = own, 1 = opponent)
    grid: this.getGrid(gridOwner, player !== gridOwner), // hide unsunk ships if this is not own grid
  };
};

// hide unsunk ships if this is not own grid
Game.prototype.getGrid = function (player, hideShips) {
  return {
    shots: this.players[player].shots,
    ships: hideShips
      ? this.players[player].getArrayOfSunkShips()
      : this.players[player].ships,
  };
};

module.exports = Game;
