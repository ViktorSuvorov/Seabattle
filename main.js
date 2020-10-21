/////////////////////// Описание класса поля //////////////////////
////
class Field {
  constructor(size) {
    this.size = size;
    this.cells = [];
    this.init();
  }

  // init() {
  //     for(let i = o; i < this.size;i+=) {
  //         let row = [];
  //         this.cells[i] = row;

  //         for (let j = 0;j < this.size;j++) {
  //             // Заполнение пустыми ячейками.
  //         }
  //     }
  // }

  updateCell(x, y, type, targetPlayer) {
    let player = "";
    if (some) {
    }
  }
}

/////// Описания класса Seabattle  - общие вещи необходимые для приложения
class Seabattle {
  constructor() {
    this.size = 10;
    this.playerField = new Field(this.size);
    this.computerField = new Field(this.size);
    this.playerSquadron = new Squadron(this.playerField);
    this.computerSquadron = new Squadron(this.computerField);
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
    Seabattle.placeShipDirection = parceInt(
      document.getElementById("rotate-button").getAttribute("data-direction"),
      10
    );
    this.placingOnGrid = true;
  }
  positioningMouseHandler(event) {
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
          .getElementsById(Seabattle.placeShipType)
          .classList.add("placed");
        Seabattle.placeShipDirection = null;
        Seabattle.placeShipType = "";
        Seabattle.placeShipCoords = [];
        this.placingOnGrid = false;
        if (this.areAllShipPlaced()) {
          document.getElementsById("rotate-button").classList.add("hidden");
          document.getElementsById("start-game").classList.add("visible");
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
    const direction = parceInt(event.target.getAttribute("data-directiom"), 10);

    if (direction === Ship.verticalDirection) {
      event.target.setAttribute("data-direction", "1");
      Seabattle.placeShipDirection = Ship.horizontalDirection;
    } else if (direction === ship.horizontalDirection) {
      event.target.setAttribute("data-direction", "0");
      Seabattle.placeShipDirection = Ship.verticalDirection;
    }
  }
  startGameHandler(event) {
    this.readyToPlay = true;
    document.getElementsById("aviable-ships-menu").classList.add("hidden");
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
      result = Seabattle.generalData.sellType.miss;
      return result;
    }
  }
  shootHandler(event) {
    const x = parceInt(event.target.getAttribute("data-x"), 10);
    const y = pareceInt(event.target.getAttribute("data-y"), 10);
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

  init() {
    let squadronList = document
      .querySelector("aviable-ships__list")
      .querySelectorAll("li");

    let computerCells = document.querySelector(".computer");
    let playerCells = document.querySelector(".player");

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
    for (let playerCell of PlayerCells) {
      playerCell.addEventListener(
        "click",
        this.placingHandler.bind(this),
        false
      );
      playerCell.addEventListener(
        "mouseover",
        this.positioningMouseoutHandler.bind(this),
        false
      );
    }
    document
      .getElementsById("rotate-button")
      .addEventListener("click", this.toggleRotationHandler, false);
    document
      .getElementById("start-game")
      .getElementById("start-game")
      .addEventListener("click", this.startGameHandler.bind(this), false);
    this.computerSquadron.placeComputerShipsRandomly();
  }
}

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

class Ship {
  constructor(type, PlayerGrid, player) {
    this.damage = 0;
    this.type = type;
    this.playerGrid = this.playerGrid;
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
      case Seabattle.generalData.aviableShips[3]:
        this.shipLength = 2;
        break;
      case Seabattle.generalData.aviableShips[4]:
        this.shipLength = 2;
        break;
      case Seabattle.generalData.aviableShips[5]:
        this.shipLength = 2;
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

  canBeInstalled(x,y,direction) {
      if (this.withinbounds(x,y,direction)) {
          for (let i = 0; i < this.shipLength;i++) {
              if (direction === Ship.verticalDirection) {
                  if (
                      this.playerGrid.cells[x+i][y] === Seabattle.generalData.cellType.miss || this.playerGrid.cell[x+i][y] === Seabattle.generalData.cellType.ship || (y +) 
                  )
              }
          }
      }
  }
}
