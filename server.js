const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.Server(app);
const io = socketIO(server);

server.listen(3000);

var Game = require("./gameModule.js");
var GameState = require("./gameStateModule.js");

var clients = {};
var gameIdCounter = 0;

app.get("/", (req, res) => res.send("cao Teodora"));

io.on("connection", function (socket) {
  console.log(new Date().toISOString() + " Client with ID " + socket.id + " is now connected.");

  socket.emit("test event", "cao");

  // create client object for additional data
  clients[socket.id] = {
    inGame: null,
    player: null,
  };

  //Add clients waiting room until there are enough players to start the game
  socket.on("ready", function() {
    // adding client to the waiting room
    socket.join("waiting room");

    console.log("Client with ID " + socket.id + " joined waiting room");
    
    // create game if there are enough clients in the waiting room
    movePlayersToTheGameRoom(socket);
  });

  // receiving ships' positions
  socket.on("strategy", function(data) {
    // separating incoming data
    var roomOwner = data[0];
    var shipArray = data[1];
    
    // flatening ships incoming array
    var ships = shipArray.flat(1);

    // defining game reference
    var game = clients[roomOwner].inGame;
    
    // defining current & opponent player No
    var current = (game.players[0].id.id===socket.id) ? 0 : 1;
    var opponent = 1 - current;
    
    // defining if current player is on turn
    var isOnTurn = (current === game.currentPlayer) ? true : false;

    // setting ships array for client
    game.players[current].setShipsArray(ships);
    
    // setting grid for player
    game.players[current].setGrid();

    //sending event with initial data for game start
    socket.emit(
      "update",
      {
        turn: isOnTurn,
        points:  [0, 0],              
        gridIndex: 1,           
        grid: {
          ships: [],
          shots: game.players[opponent].shots
        }
      }
    );
  })

  /**
   * Handle torpedo shots from client
   * and return outcome of shot, before
   * that check if the game is over
   */
  socket.on("torpedo", function (data) {
    // separating incoming data
    var gameOwner = data[0];
    var position = data[1];

    // defining game reference
    var game = clients[gameOwner].inGame;

    // defining current & opponent player No
    var current = (game.players[0].id.id===socket.id) ? 0 : 1;
    var opponent = 1 - current;

    if (game !== null) {
      // if game exists
      if (game.currentPlayer === current) {
        // if player is on turn
        if (game.torpedo(position)) {
          // if shot is valid (on board)
          
          //console.log("pre");
          gameCompleted(game);
          //console.log("posle");
          
          // sending event to update game state for both clients
          io.to(socket.id).emit(
            "update",
            game.getGameStateData(current, opponent)
          );
          io.to(game.getPlayerId(opponent)).emit(
            "update",
            game.getGameStateData(opponent, opponent)
          );
          
          //console.log("signali poslati");
        }
      }
    }
  });

  // handle client disconnect
  socket.on("disconnect", function () {
    console.log(
      new Date().toISOString() + " Client with ID " + socket.id + " disconnected."
    );

    // kicking out client from game
    leaveGame(socket);
    
    // removing client from array of clients
    delete clients[socket.id];
  });
});

// create game if there are enough clients in the waiting room
function movePlayersToTheGameRoom(socket) {
  // array of players in waiting room
  var players = getClientsInRoom("waiting room");

  if (players.length >= 2) {
    // if 2 player are in waiting room -> generate new game room
    var game = new Game(gameIdCounter++, players[0], players[1]);
    
    // kicking out players from waiting room
    players[0].leave("waiting room");
    players[1].leave("waiting room");

    // adding players to their own game room
    players[0].join("game" + game.id);
    players[1].join("game" + game.id);

    // adding game reference to both clients 
    clients[players[0].id].inGame = game;
    clients[players[1].id].inGame = game;
    
    // setting No of player in game
    clients[players[0].id].player = 0;
    clients[players[1].id].player = 1;

    // sending event to both clients (with game owner id)
    io.to("game" + game.id).emit("paired",socket.id);

    console.log(new Date().toISOString() + " Clients with IDs " + players[0].id + " & " + players[1].id + " have joined game room with ID " + game.id);
  }
}

// returning array of clients in exact room
function getClientsInRoom(room) {
  // array for storing clients in room
  var clientsInTheRoom = [];

  // push each client in the room into the array
  for (var id in io.sockets.adapter.rooms[room]) {
    clientsInTheRoom.push(io.sockets.adapter.nsp.connected[id]);
  }

  return clientsInTheRoom;
}

// kicking out client from the game
function leaveGame(socket) {
  if (clients[socket.id].inGame !== null) {
    // if client is in game
    console.log(new Date().toISOString() + " Client with ID " + socket.id + " left game room with ID " + clients[socket.id].inGame.id);

    if (clients[socket.id].inGame.gameState !== GameState.completed) {
      // if game is unfinished -> end it
      
      // setting game state to completed and No of winning player
      clients[socket.id].inGame.endTheGame(clients[socket.id].player);
      
      // notifying clients if game is completed
      gameCompleted(clients[socket.id].inGame);
    }

    // kicking out current player from game room
    socket.leave("game" + clients[socket.id].inGame.id);

    // setting client parameters to null
    clients[socket.id].inGame = null;
    clients[socket.id].player = null;
  }
}

// notifying clients if game is completed
function gameCompleted(game) {
  //console.log("boze pomozi");
  //console.log(game.gameState);
  //console.log(GameState.completed);
  if (game.gameState == GameState.completed) {
    // if game is completed
    console.log(new Date().toISOString() + " Game (ID " + game.id + ") ended.");

    // sending event to both players with outcome of game (true - winner / false - loser)
    io.to(game.getWinningPlayerId()).emit("gameover", true);
    io.to(game.getLosingPlayerId()).emit("gameover", false);
  }
}