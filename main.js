/////////////////////// Описание класса поля //////////////////////
////
class Field {
  constructor(size) {
    this.size = size;
    this.cells = [];
    this.init();
  }

  init() {
    for (let i = 0; i < this.size; i++) {
      let row = [];
      this.cells[i] = row;

      for (let j = 0; j < this.size; j++) {
        row.push(Seabattle.generalData.cellType.empty);
      }
    }
  }

  updateCell(x, y, type, targetPlayer) {
    let player = "";
    if (targetPlayer === Seabattle.generalData.player) {
      player = "player";
    } else if (targetPlayer === Seabattle.generalData.computer) {
      player = "computer";
    }

    switch (type) {
      case "empty":
        this.cells[x][y] = Seabattle.generalData.cellType.empty;
        break;
      case "ship":
        this.cells[x][y] = Seabattle.generalData.cellType.ship;
        break;
      case "miss":
        this.cells[x][y] = Seabattle.generalData.cellType.miss;
        break;
      case "hit":
        this.cells[x][y] = Seabattle.generalData.cellType.hit;
        break;
      case "sunk":
        this.cells[x][y] = Seabattle.generalData.cellType.sunk;
        break;
      default:
        this.cells[x][y] = Seabattle.generalData.cellType.empty;
        break;
    }

    document
      .querySelector(`.${player} [data-x="${x}"][data-y="${y}"]`)
      .classList.add("grid-cell", `grid-${type}`);
  }

  isMiss(x, y) {
    return this.cells[x][y] === Seabattle.generalData.cellType.miss;
  }

  isUndamagedShip(x, y) {
    return this.cells[x][y] === Seabattle.generalData.cellType.ship;
  }

  isDamagedShip(x, y) {
    return (
      this.cells[x][y] === Seabattle.generalData.cellType.hit ||
      this.cells[x][y] === Seabattle.generalData.cellType.sunk
    );
  }
}
///////// Описание класса набора кораблей
class Squadron {
  constructor(playerGrid, player) {
    this.numShips = Seabattle.generalData.aviableShips.length;
    this.playerGrid = playerGrid;
    this.player = player;
    this.squadronList = [];
    this.populate();
  }

  populate() {
    for (let i = 0; i < this.numShips; i++) {
      this.squadronList.push(
        new Ship(
          Seabattle.generalData.aviableShips[i],
          this.playerGrid,
          this.player
        )
      );
    }
  }

  placeShip(x, y, direction, shipType) {
    let shipCoords = null;

    for (let ship of this.squadronList) {
      if (shipType === ship.type && ship.canBeInstalled(x, y, direction)) {
        ship.create(x, y, direction, false);
        shipCoords = ship.getAllShipCells();

        for (let shipCoord of shipCoords) {
          this.playerGrid.updateCell(
            shipCoord.x,
            shipCoord.y,
            "ship",
            this.player
          );
        }
        return true;
      }
    }
    return false;
  }

  placeComputerShipsRandomly(shipVisibility = false) {
    let x = null;
    let y = null;
    let direction = null;
    let illegalPlacement = null;
    let shipCoords = null;

    for (let ship of this.squadronList) {
      illegalPlacement = true;

      while (illegalPlacement) {
        x = getRandom(0, 9);
        y = getRandom(0, 9);
        direction = getRandom(0, 1);

        if (ship.canBeInstalled(x, y, direction)) {
          ship.create(x, y, direction, false);
          illegalPlacement = false;

          if (shipVisibility) {
            shipCoords = ship.getAllShipCells();
            for (let shipCoord of shipCoords) {
              this.playerGrid.updateCell(
                shipCoord.x,
                shipCoord.y,
                "ship",
                this.player
              );
            }
          } else {
            continue;
          }
        }
      }
    }
  }

  findShipByCoords(x, y) {
    for (let ship of this.squadronList) {
      if (ship.direction === Ship.verticalDirection) {
        if (
          y === ship.yPosition &&
          x >= ship.xPosition &&
          x < ship.xPosition + ship.shipLength
        ) {
          return ship;
        } else {
          continue;
        }
      } else {
        if (
          x === ship.xPosition &&
          y >= ship.yPosition &&
          y < ship.yPosition + ship.shipLength
        ) {
          return ship;
        } else {
          continue;
        }
      }
    }
    return null;
  }

  areAllShipsSunk() {
    for (let ship of this.squadronList) {
      if (ship.sunk === false) {
        return false;
      }
    }
    return true;
  }
}

class Computer {
  constructor(game) {
    this.game = game;
    this.hasDamagedShip = false;
  }

  isSunkShipAreaCell(x, y) {
    for (let coord of Computer.sunkShipsAreaCoords) {
      if (coord.xPos === x && coord.yPos === y) {
        return true;
      }
    }
    return false;
  }

  getCellsAround(x, y) {
    let cells = [];

    if (x - 1 >= 0) {
      cells.push({ xPos: x - 1, yPos: y });
      if (y - 1 >= 0) {
        cells.push({ xPos: x, yPos: y - 1 });
        cells.push({ xPos: x - 1, yPos: y - 1 });
      }
      if (y + 1 < 10) {
        cells.push({ xPos: x, yPos: y + 1 });
        cells.push({ xPos: x - 1, yPos: y + 1 });
      }
    }

    if (x + 1 < 10) {
      cells.push({ xPos: x + 1, yPos: y });
      if (y - 1 >= 0) {
        cells.push({ xPos: x + 1, yPos: y - 1 });
      }
      if (y + 1 < 10) {
        cells.push({ xPos: x + 1, yPos: y + 1 });
      }
    }
    return cells;
  }

  shoot() {
    let x = null;
    let y = null;
    let result = null;

    while (
      Seabattle.gameOver === false &&
      result !== Seabattle.generalData.cellType.miss
    ) {
      if (this.hasDamagedShip) {
        let randomDirection = null;
        let randomValue = null;

        if (
          Computer.damagedShipCoordsX.length > 1 &&
          Computer.damagedShipCoordsX[0] !== Computer.damagedShipCoordsX[1]
        ) {
          randomDirection = "xDirection";
        } else if (
          Computer.damagedShipCoordsX.length > 1 &&
          Computer.damagedShipCoordsX[0] === Computer.damagedShipCoordsX[1]
        ) {
          randomDirection = "yDirection";
        } else if (Computer.damagedShipCoordsX.length === 1) {
          randomDirection = getRandomFromArray(["xDirection", "yDirection"]);
        }

        randomValue = getRandomFromArray([-1, 1]);

        if (randomDirection === "xDirection") {
          if (randomValue === 1) {
            let maxXpos = Math.max(...Computer.damagedShipCoordsX);
            if (maxXpos + 1 < 10) {
              x = maxXpos + 1;
              y = Computer.damagedShipCoordsY[0];
            }
          } else {
            let minXpos = Math.min(...Computer.damagedShipCoordsX);
            if (minXpos - 1 >= 0) {
              x = minXpos - 1;
              y = Computer.damagedShipCoordsY[0];
            }
          }
        } else {
          if (randomValue === 1) {
            let maxYpos = Math.max(...Computer.damagedShipCoordsY);
            if (maxYpos + 1 < 10) {
              y = maxYpos + 1;
              x = Computer.damagedShipCoordsX[0];
            }
          } else {
            let minYpos = Math.min(...Computer.damagedShipCoordsY);
            if (minYpos - 1 >= 0) {
              y = minYpos - 1;
              x = Computer.damagedShipCoordsX[0];
            }
          }
        }
      } else {
        x = getRandom(0, 9);
        y = getRandom(0, 9);
      }

      if (this.isSunkShipAreaCell(x, y)) {
        continue;
      }
      result = this.game.shoot(x, y, Seabattle.generalData.player);

      if (result === Seabattle.generalData.cellType.hit) {
        this.hasDamagedShip = true;
      } else if (result === Seabattle.generalData.cellType.sunk) {
        for (let i = 0; i < Computer.damagedShipCoordsX.length; i++) {
          let cellsToPush = this.getCellsAround(
            Computer.damagedShipCoordsX[i],
            Computer.damagedShipCoordsY[i]
          );

          Computer.sunkShipsAreaCoords.push(...cellsToPush);
        }

        Computer.sunkShipsAreaCoords.push(...this.getCellsAround(x, y));
        this.hasDamagedShip = false;
        Computer.damagedShipCoordsX = [];
        Computer.damagedShipCoordsY = [];
      }
    }
  }
}

Computer.damagedShipCoordsX = [];
Computer.damagedShipCoordsY = [];
Computer.sunkShipsAreaCoords = [];

/////// Описания класса Seabattle  - общие вещи необходимые для приложения
class Seabattle {
  constructor() {
    this.size = 10;
    this.playerField = new Field(this.size);
    this.computerField = new Field(this.size);
    this.playerSquadron = new Squadron(
      this.playerField,
      Seabattle.generalData.player
    );
    this.computerSquadron = new Squadron(
      this.computerField,
      Seabattle.generalData.computer
    );
    this.enemy = new Computer(this);
    this.readyToPlay = false;
    this.placingOnGrid = false;
    this.drawBattlefields();
    this.init();
  }
  drawBattlefields() {
    const fieldContainers = document.querySelectorAll(".grid");

    for (let i = 0; i < fieldContainers.length; i++) {
      for (let x = 0; x < this.size; x++) {
        for (let y = 0; y < this.size; y++) {
          let cell = document.createElement("div");
          cell.setAttribute("data-x", x);
          cell.setAttribute("data-y", y);
          cell.classList.add("grid-cell");
          fieldContainers[i].appendChild(cell);
        }
      }
    }
  }
  squadronClickHandler(event) {
    const squadronList = document.querySelectorAll(".aviable-ships__list li");

    for (let ship of squadronList) {
      ship.classList.remove("placing");
    }
    Seabattle.placeShipType = event.target.getAttribute("id");
    document.getElementById(Seabattle.placeShipType).classList.add("placing");
    Seabattle.placeShipDirection = parseInt(
      document.getElementById("rotate-button").getAttribute("data-direction"),
      10
    );
    this.placingOnGrid = true;
  }
  positioningMouseoverHandler(event) {
    if (this.placingOnGrid) {
      const x = parseInt(event.target.getAttribute("data-x", 10));
      const y = parseInt(event.target.getAttribute("data-y", 10));
      const squadronList = this.playerSquadron.squadronList;
      for (let ship of squadronList) {
        if (
          Seabattle.placeShipType === ship.type &&
          ship.canBeInstalled(x, y, Seabattle.placeShipDirection)
        ) {
          ship.create(x, y, Seabattle.placeShipDirection, true);
          Seabattle.placeShipCoords = ship.getAllShipCells();

          for (let coord of Seabattle.placeShipCoords) {
            let cell = document.querySelector(
              `[data-x="${coord.x}"][data-y="${coord.y}"]`
            );

            if (!cell.classList.contains("grid-ship")) {
              cell.classList.add("grid-ship");
            }
          }
        }
      }
    }
  }
  positioningMouseoutHandler(event) {
    if (this.placingOnGrid) {
      for (let coord of Seabattle.placeShipCoords) {
        let cell = document.querySelector(
          `[data-x="${coord.x}"][data-y="${coord.y}"]`
        );

        if (cell.classList.contains("grid-ship")) {
          cell.classList.remove("grid-ship");
        }
      }
    }
  }

  placingHandler(event) {
    if (this.placingOnGrid) {
      const x = parseInt(event.target.getAttribute("data-x"), 10);
      const y = parseInt(event.target.getAttribute("data-y"), 10);
      const successful = this.playerSquadron.placeShip(
        x,
        y,
        Seabattle.placeShipDirection,
        Seabattle.placeShipType
      );
      if (successful) {
        document
          .getElementById(Seabattle.placeShipType)
          .classList.add("placed");
        Seabattle.placeShipDirection = null;
        Seabattle.placeShipType = "";
        Seabattle.placeShipCoords = [];
        this.placingOnGrid = false;
        if (this.areAllShipPlaced()) {
          document.getElementById("rotate-button").classList.add("hidden");
          document.getElementById("start-game").classList = "visible";
        }
      }
    }
  }
  areAllShipPlaced() {
    const squadronList = document.querySelectorAll(".aviable-ships__list li");

    for (let ship of squadronList) {
      if (ship.classList.contains("placed")) {
        continue;
      } else {
        return false;
      }
    }
    return true;
  }

  toggleRotationHandler(event) {
    const direction = parseInt(event.target.getAttribute("data-direction"), 10);

    if (direction === Ship.verticalDirection) {
      event.target.setAttribute("data-direction", "1");
      Seabattle.placeShipDirection = Ship.horizontalDirection;
    } else if (direction === Ship.horizontalDirection) {
      event.target.setAttribute("data-direction", "0");
      Seabattle.placeShipDirection = Ship.verticalDirection;
    }
  }
  startGameHandler(event) {
    this.readyToPlay = true;
    document.getElementById("aviable-ships-menu").classList.add("hidden");
  }

  shoot(x, y, targetPlayer) {
    let targetGrid = null;
    let targetSquadron = null;
    let result = null;

    if (targetPlayer === Seabattle.generalData.player) {
      targetGrid = this.playerField;
      targetSquadron = this.playerSquadron;
    } else if (targetPlayer === Seabattle.generalData.computer) {
      targetGrid = this.computerField;
      targetSquadron = this.computerSquadron;
    }
    if (targetGrid.isDamagedShip(x, y) || targetGrid.isMiss(x, y)) {
      return result;
    } else if (targetGrid.isUndamagedShip(x, y)) {
      targetGrid.updateCell(x, y, "hit", targetPlayer);
      result = targetSquadron.findShipByCoords(x, y).incrementDamage();
      this.checkForGameOver();

      if (
        targetPlayer === Seabattle.generalData.player &&
        result === Seabattle.generalData.cellType.hit
      ) {
        Computer.damagedShipCoordsX.push(x);
        Computer.damagedShipCoordsY.push(y);
      }
      return result;
    } else {
      targetGrid.updateCell(x, y, "miss", targetPlayer);
      result = Seabattle.generalData.cellType.miss;
      return result;
    }
  }
  shootHandler(event) {
    const x = parseInt(event.target.getAttribute("data-x"), 10);
    const y = parseInt(event.target.getAttribute("data-y"), 10);
    let result = null;

    if (this.readyToPlay) {
      result = this.shoot(x, y, Seabattle.generalData.computer);
    }
    if (!Seabattle.gameOver && result === Seabattle.generalData.cellType.miss) {
      this.enemy.shoot();
    }
  }
  checkForGameOver() {
    if (this.computerSquadron.areAllShipsSunk()) {
      alert("You won");
      Seabattle.gameOver = true;
    } else if (this.playerSquadron.areAllShipsSunk()) {
      alert("You lose");
      Seabattle.gameOver = true;
    }
  }

  setRandomPlayerShips() {
    this.playerSquadron.placeComputerShipsRandomly(true);
    document.getElementById("rotate-button").classList.add("hidden");
    document.getElementById("aviable-ships-list").classList.add("hidden");
    document.getElementById("random-ship-placement").classList.add("hidden");
    document.getElementById("handle-ship-placement").classList.add("hidden");
    document.getElementById("start-game").classList = 'visible';
    document.getElementById("menu-header").textContent = "Let`s start?";
  }

  init() {
    let squadronList = document
      .querySelector(".aviable-ships__list")
      .querySelectorAll("li");

    let computerCells = document.querySelector(".computer").childNodes;
    let playerCells = document.querySelector(".player").childNodes;

    for (let ship of squadronList) {
      ship.addEventListener(
        "click",
        this.squadronClickHandler.bind(this),
        false
      );
    }
    for (let computerCell of computerCells) {
      computerCell.addEventListener(
        "click",
        this.shootHandler.bind(this),
        false
      );
    }
    for (let playerCell of playerCells) {
      playerCell.addEventListener(
        "click",
        this.placingHandler.bind(this),
        false
      );
      playerCell.addEventListener(
        "mouseover",
        this.positioningMouseoverHandler.bind(this),
        false
      );
      playerCell.addEventListener(
        "mouseout",
        this.positioningMouseoutHandler.bind(this),
        false
      );
    }
    document
      .getElementById("rotate-button")
      .addEventListener("click", this.toggleRotationHandler, false);
    document
      .getElementById("start-game")
      .addEventListener("click", this.startGameHandler.bind(this), false);
    this.computerSquadron.placeComputerShipsRandomly();

    document
      .getElementById("random-ship-placement")
      .addEventListener("click", this.setRandomPlayerShips.bind(this), false);
  }
}

//  Описание класса корабля /////////////////////////////////
class Ship {
  constructor(type, playerGrid, player) {
    this.damage = 0;
    this.type = type;
    this.playerGrid = playerGrid;
    this.player = player;

    switch (this.type) {
      case Seabattle.generalData.aviableShips[0]:
        this.shipLength = 4;
        break;
      case Seabattle.generalData.aviableShips[1]:
        this.shipLength = 3;
        break;
      case Seabattle.generalData.aviableShips[2]:
        this.shipLength = 3;
        break;
      case Seabattle.generalData.aviableShips[3]:
        this.shipLength = 2;
        break;
      case Seabattle.generalData.aviableShips[4]:
        this.shipLength = 2;
        break;
      case Seabattle.generalData.aviableShips[5]:
        this.shipLength = 2;
        break;
      case Seabattle.generalData.aviableShips[6]:
        this.shipLength = 1;
        break;
      case Seabattle.generalData.aviableShips[7]:
        this.shipLength = 1;
        break;
      case Seabattle.generalData.aviableShips[8]:
        this.shipLength = 1;
        break;
      case Seabattle.generalData.aviableShips[9]:
        this.shipLength = 1;
        break;
    }
    this.maxDamage = this.shipLength;
    this.sunk = false;
  }

  canBeInstalled(x, y, direction) {
    if (this.withinBounds(x, y, direction)) {
      for (let i = 0; i < this.shipLength; i++) {
        if (direction === Ship.verticalDirection) {
          if (
            this.playerGrid.cells[x + i][y] ===
              Seabattle.generalData.cellType.miss ||
            this.playerGrid.cells[x + i][y] ===
              Seabattle.generalData.cellType.ship ||
            (y + i + 1 < 10 &&
              this.playerGrid.cells[x][y + 1] ===
                Seabattle.generalData.cellType.ship) ||
            (y + i - 1 >= 0 &&
              this.playerGrid.cells[x][y - 1] ===
                Seabattle.generalData.cellType.ship) ||
            (x + i + 1 < 10 &&
              this.playerGrid.cells[x + i + 1][y] ===
                Seabattle.generalData.cellType.ship) ||
            (x + i + 1 < 10 &&
              y + 1 < 10 &&
              this.playerGrid.cells[x + i + 1][y + 1] ===
                Seabattle.generalData.cellType.ship) ||
            (x + i + 1 < 10 &&
              y - 1 >= 0 &&
              this.playerGrid.cells[x + i + 1][y - 1] ===
                Seabattle.generalData.cellType.ship) ||
            (x + i - 1 >= 0 &&
              this.playerGrid.cells[x + i - 1][y] ===
                Seabattle.generalData.cellType.ship) ||
            (x + i - 1 >= 0 &&
              y + 1 < 10 &&
              this.playerGrid.cells[x + i - 1][y + 1] ===
                Seabattle.generalData.cellType.ship) ||
            (x + i - 1 >= 0 &&
              y - 1 >= 0 &&
              this.playerGrid.cells[x + i - 1][y - 1] ===
                Seabattle.generalData.cellType.ship) ||
            this.playerGrid.cells[x + i][y] ===
              Seabattle.generalData.cellType.sunk
          ) {
            return false;
          }
        } else {
          if (
            this.playerGrid.cells[x][y + i] ===
              Seabattle.generalData.cellType.miss ||
            this.playerGrid.cells[x][y + i] ===
              Seabattle.generalData.cellType.ship ||
            (x + 1 < 10 &&
              this.playerGrid.cells[x + 1][y] ===
                Seabattle.generalData.cellType.ship) ||
            (x - 1 >= 0 &&
              this.playerGrid.cells[x - 1][y] ===
                Seabattle.generalData.cellType.ship) ||
            (y + i + 1 < 10 &&
              this.playerGrid.cells[x][y + i + 1] ===
                Seabattle.generalData.cellType.ship) ||
            (y + i + 1 < 10 &&
              x + 1 < 10 &&
              this.playerGrid.cells[x + 1][y + i + 1] ===
                Seabattle.generalData.cellType.ship) ||
            (y + i + 1 < 10 &&
              x - 1 >= 0 &&
              this.playerGrid.cells[x - 1][y + i + 1] ===
                Seabattle.generalData.cellType.ship) ||
            (y + i - 1 >= 0 &&
              this.playerGrid.cells[x][y + i - 1] ===
                Seabattle.generalData.cellType.ship) ||
            (y + i - 1 >= 0 &&
              x + 1 < 10 &&
              this.playerGrid.cells[x + 1][y + i - 1] ===
                Seabattle.generalData.cellType.ship) ||
            (y + i - 1 >= 0 &&
              x - 1 >= 0 &&
              this.playerGrid.cells[x - 1][y + i - 1] ===
                Seabattle.generalData.cellType.ship) ||
            this.playerGrid.cells[x][y + i] ===
              Seabattle.generalData.cellType.sunk
          ) {
            return false;
          }
        }
      }
      return true;
    } else {
      return false;
    }
  }
  withinBounds(x, y, direction) {
    if (direction === Ship.verticalDirection) {
      return x + this.shipLength <= 10;
    } else {
      return y + this.shipLength <= 10;
    }
  }

  getAllShipCells() {
    let result = [];
    for (let i = 0; i < this.shipLength; i++) {
      if (this.direction === Ship.verticalDirection) {
        result[i] = { x: this.xPosition + i, y: this.yPosition };
      } else {
        result[i] = { x: this.xPosition, y: this.yPosition + i };
      }
    }

    return result;
  }
  create(x, y, direction, temporary) {
    this.xPosition = x;
    this.yPosition = y;
    this.direction = direction;

    if (!temporary) {
      for (let i = 0; i < this.shipLength; i++) {
        if (this.direction === Ship.verticalDirection) {
          this.playerGrid.cells[x + i][y] = Seabattle.generalData.cellType.ship;
        } else {
          this.playerGrid.cells[x][y + i] = Seabattle.generalData.cellType.ship;
        }
      }
    }
  }
  isSunk() {
    return this.damage >= this.maxDamage;
  }

  sinkShip() {
    this.damage = this.maxDamage;
    this.sunk = true;

    let allCells = this.getAllShipCells();

    for (let i = 0; i < this.shipLength; i++) {
      this.playerGrid.updateCell(
        allCells[i].x,
        allCells[i].y,
        "sunk",
        this.player
      );
    }
  }

  incrementDamage() {
    this.damage++;

    if (this.isSunk()) {
      this.sinkShip();
      return Seabattle.generalData.cellType.sunk;
    }

    return Seabattle.generalData.cellType.hit;
  }
}
///////// Общие
Seabattle.gameOver = false;
Seabattle.placeShipDirection = null;
Seabattle.placeShipType = "";
Seabattle.placeShipCoords = [];
Seabattle.generalData = {
  aviableShips: [
    "fourdeck",
    "threedeck",
    "threedeck2",
    "twodeck",
    "twodeck2",
    "twodeck3",
    "onedeck",
    "onedeck2",
    "onedeck3",
    "onedeck4",
  ],
  player: 0,
  computer: 1,
  cellType: {
    empty: 0,
    ship: 1,
    miss: 2,
    hit: 3,
    sunk: 4,
  },
};
Ship.verticalDirection = 0;
Ship.horizontalDirection = 1;

function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFromArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const game = new Seabattle();
