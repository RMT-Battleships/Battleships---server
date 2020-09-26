var Ship = require("./shipModule.js");

// player constructor
function Player(id) {
  this.id = id; // player id
  this.shots = Array(100); // state of each field (0:default / 1:sea / 2:ship)
  this.shipGrid = Array(100); // state of each field (-1:default / 0-9:No of ships in ship[])
  this.ships = []; // ship objects
  this.points = 0; // current player points

  // setting default values in arrays
  for (let i = 0; i < 100; i++) {
    this.shots[i] = 0;
    this.shipGrid[i] = -1;
  }
}

// processing the shot
Player.prototype.torpedo = function (gridIndex) {
  if (this.shipGrid[gridIndex] >= 0) {
    // if ship hit

    /**
     * getting No of ship in array by value of field in shipGrid
     * and increasing hits for that ship in array
     */
    this.ships[this.shipGrid[gridIndex]].hits++;

    // setting value in shots[] to 2 (part of ship on that field)
    this.shots[gridIndex] = 2;

    // adding points for hitting ship
    this.points += 12;

    return true;
  } else {
    // if ship missed

    // setting value in shots[] to 1 (sea on that field)
    this.shots[gridIndex] = 1;

    // subtracting points for hitting sea
    this.points -= 3;

    return false;
  }
};

// get array of sunk ships
Player.prototype.getArrayOfSunkShips = function () {
  var sunkShips = [];

  for (let i = 0; i < this.ships.length; i++) {
    if (this.ships[i].isSunk()) {
      sunkShips.push(this.ships[i]);
    }
  }

  return sunkShips;
};

// get number of !sunk ship
Player.prototype.getNumberOfShipsLeft = function () {
  var shipCount = 0;

  for (let i = 0; i < this.ships.length; i++) {
    if (!this.ships[i].isSunk()) {
      shipCount++;
    }
  }

  return shipCount;
};

// setting ship objects into the shipGrid[]
Player.prototype.setGrid = function () {
  // setting 10 ships
  for (let k = 0; k < 10; k++) {

    // defining max values for x & y axis
    let xMax = this.ships[k].horizontal
      ? +this.ships[k].x + +this.ships[k].length
      : +this.ships[k].x + 1;
    let yMax = this.ships[k].horizontal
      ? +this.ships[k].y + 1
      : +this.ships[k].y + +this.ships[k].length;

    // populating shipGrid[]
    for (let i = this.ships[k].y; i < yMax; i++) {
      for (let j = this.ships[k].x; j < xMax; j++) {
        this.shipGrid[10 * i + +j] = k;
      }
    }
  }
};

// generating ship objects and populating it into the ship[]
Player.prototype.setShipsArray = function (shipsInput) {
  // emptying ships[]
  this.ships = [];

  // adding every ship
  for (let i = 0; i < shipsInput.length; i++) {

    // defining temp ship object
    let newShip = new Ship(shipsInput[i].length);

    // populating data in temp object
    newShip.x = shipsInput[i].x;
    newShip.y = shipsInput[i].y;
    newShip.hits = shipsInput[i].hits;
    newShip.horizontal = shipsInput[i].horizontal;
    newShip.length = shipsInput[i].length;

    // adding temp object into the ship[]
    this.ships.push(newShip);
  }
};

module.exports = Player;
