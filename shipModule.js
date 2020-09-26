// ship constructor
function Ship(size) {
  this.x = 0;               // x coordinate in matrix
  this.y = 0;               // y coordinate in matrix
  this.length = size;       // size of ship
  this.hits = 0;            // number of time ship is hit
  this.horizontal = false;  // is ship horizontal
}

// checking if ship is sunk
Ship.prototype.isSunk = function () {
  return this.hits >= this.length;
};

module.exports = Ship;
