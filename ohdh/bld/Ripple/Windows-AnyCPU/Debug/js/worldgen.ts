/// <reference path="defs.ts"/>
// Basic tile for each grid point on a floor
class GridTile {
    wall: boolean;
    door: boolean;
    type: RTypes;
    constructor() {
        this.wall = false;
        this.door = false;
        this.type = RTypes.FLOOR;
    }
}

// Floors in a building, contains a 2d array of GridTiles called grid
class Floor {
    public grid: Array<Array<GridTile>>;

    private partition(x: number, y: number, dir: number, floorSize: number): void {
        var length: number = 0;
        var start: Vector2 = { x: x, y: y };

        // Return if coords are bad
        if (x < 0 || x > floorSize || y < 0 || y > floorSize) {
            console.warn("coords out of bounds");
            return;
        }
        
        // Return if too small
        var minLength: number = 3;
        var percent: number = 2;
        if (dir == 0) {
            for (var i: number = 0; i < minLength; i++)
                if (this.grid[x][y + i].wall) return;
            if (this.grid[x + 1][y + 1].wall || (this.grid[x + 2][y + 1].wall && (Math.random() * 10) > percent) || this.grid[x - 1][y + 1].wall || (this.grid[x - 2][y + 1].wall && (Math.random() * 10) > percent)) return;
        }
        else if (dir == 1) {
            for (var i: number = 0; i < minLength; i++)
                if (this.grid[x + i][y].wall) return;
            if (this.grid[x + 1][y + 1].wall || (this.grid[x + 1][y + 2].wall && (Math.random() * 10) > percent) || this.grid[x + 1][y - 1].wall || (this.grid[x + 1][y - 2].wall && (Math.random() * 10) > percent)) return;
        }
        else if (dir == 2) {
            for (var i: number = 0; i < minLength; i++)
                if (this.grid[x][y - i].wall) return;
            if (this.grid[x + 1][y - 1].wall || (this.grid[x + 2][y - 1].wall && (Math.random() * 10) > percent) || this.grid[x - 1][y - 1].wall || (this.grid[x - 2][y - 1].wall && (Math.random() * 10) > percent)) return;
        }
        else if (dir == 3) {
            for (var i: number = 0; i < minLength; i++)
                if (this.grid[x - i][y].wall) return;
            if (this.grid[x - 1][y + 1].wall || (this.grid[x - 1][y + 2].wall && (Math.random() * 10) > percent) || this.grid[x - 1][y - 1].wall || (this.grid[x - 1][y - 2].wall && (Math.random() * 10) > percent)) return;
        }

        // Make a wall until you hit another wall in the specified direction 
        while (!this.grid[x][y].wall) { 
            this.grid[x][y].wall = !this.grid[x][y].wall;
            this.grid[x][y].type = RTypes.WALL;

            if (dir == 0) y++;
            else if (dir == 1) x++;
            else if (dir == 2) y--;
            else if (dir == 3) x--;

            length++;
        }
        length--; // All of the stuff runs the last time when it's on another wall

        // To move the door if a wall runs into a door (not for spawning from a door)
        if (dir == 0 && (y + 1 < floorSize) && this.grid[x][y].door) {
            this.grid[x][y].door = false;
            this.grid[x][y].type = RTypes.WALL;
            if (this.grid[x + 1][y + 1].wall) {
                this.grid[x - 1][y].door = true;
                this.grid[x - 1][y].type = RTypes.DOOR;
            }
            else {
                this.grid[x + 1][y].door = true;
                this.grid[x + 1][y].type = RTypes.DOOR;
            }
        } else if (dir == 1 && (x + 1 < floorSize) && this.grid[x][y].door) {
            this.grid[x][y].door = false;
            this.grid[x][y].type = RTypes.WALL;
            if (this.grid[x + 1][y + 1].wall) {
                this.grid[x][y - 1].door = true;
                this.grid[x][y - 1].type = RTypes.DOOR;
            }
            else {
                this.grid[x][y + 1].door = true;
                this.grid[x][y + 1].type = RTypes.DOOR;
            }
        } else if (dir == 2 && (y - 1 > 0) && this.grid[x][y].door) {
            this.grid[x][y].door = false;
            this.grid[x][y].type = RTypes.WALL;
            if (this.grid[x + 1][y - 1].wall) {
                this.grid[x - 1][y].door = true;
                this.grid[x - 1][y].type = RTypes.DOOR;
            }
            else {
                this.grid[x + 1][y].door = true;
                this.grid[x + 1][y].type = RTypes.DOOR;
            }
        } else if (dir == 3 && (x - 1 > 0) && this.grid[x][y].door) {
            this.grid[x][y].door = false;
            this.grid[x][y].type = RTypes.WALL;
            if (this.grid[x - 1][y + 1].wall) {
                this.grid[x][y - 1].door = true;
                this.grid[x][y - 1].type = RTypes.DOOR;
            }
            else {
                this.grid[x][y + 1].door = true;
                this.grid[x][y + 1].type = RTypes.DOOR;
            }
        }
         
        // Make a door in the middle-ish
        var door1 = Math.floor((Math.random() * (length * (2 / 3))) + (length / 6));
        var door2 = -1;

        // If big enough, take split the wall in half and put the doors on opposite ends
        if (length > floorSize / 2) {
            door1 = Math.floor((Math.random() * ((length / 2) * (2 / 3))) + ((length / 2) / 6));
            door2 = Math.floor((Math.random() * ((length / 2) * (2 / 3))) + ((length / 2) / 6) + (length / 2));
        }

        // Get new coords
        var newCord1: number = door1;
        var newCord2: number = door1;

        while (newCord1 == door1 || newCord1 == door2) {
            newCord1 = Math.floor((Math.random() * (length * (2 / 3))) + (length / 6));
        }
        while (newCord2 == door1 || newCord2 == door2) {
            newCord2 = Math.floor((Math.random() * (length * (2 / 3))) + (length / 6));
        }
        
        // Fix values for directions 
        if (dir == 2 || dir == 3) {
            newCord1 *= -1;
            newCord2 *= -1;
        }
        if (dir == 2 || dir == 3) {
            door1 *= -1;
            door2 *= -1;
        }

        // Set door
        if (dir == 0 || dir == 2) {
            this.grid[x][start.y + door1].door = true;
            this.grid[x][start.y + door1].type = RTypes.DOOR;
            if (length > (floorSize * .75)) {
                this.grid[x][start.y + door2].door = true;
                this.grid[x][start.y + door2].type = RTypes.DOOR;
            }
            else if (length > (floorSize / 2) && ((Math.random() * 10) > 2.5)) {
                this.grid[x][start.y + door2].door = true;
                this.grid[x][start.y + door2].type = RTypes.DOOR;
            }
        }
        else if (dir == 1 || dir == 3) {
            this.grid[start.x + door1][y].door = true;
            this.grid[start.x + door1][y].type = RTypes.DOOR;
            if (length > (floorSize * .75)) {
                this.grid[start.x + door2][y].door = true;
                this.grid[start.x + door2][y].type = RTypes.DOOR;
            }
            else if (length > (floorSize / 2) && ((Math.random() * 10) > 2.5)) {
                this.grid[start.x + door2][y].door = true;
                this.grid[start.x + door2][y].type = RTypes.DOOR;
            }
        }

        // Do the recursion
        // Recursive x
        if (dir == 0 || dir == 2) {
            // Recurse right
            this.partition(x + 1, start.y + newCord1, 1, floorSize);
            // Recurse left
            this.partition(x - 1, start.y + newCord2, 3, floorSize);
        }
        // Recursive y
        else if (dir == 1 || dir == 3) {
            // Recurse up
            this.partition(start.x + newCord1, y + 1, 0, floorSize);
            // Recurse down
            this.partition(start.x + newCord2, y - 1, 2, floorSize);
        }
    }

    constructor(floorSize: number) {
        this.grid = [];

        for (var j: number = 0; j <= floorSize; j++) {
            this.grid[j] = [];
            for (var k: number = 0; k <= floorSize; k++) {
                this.grid[j][k] = new GridTile();
                this.grid[j][k].wall = (j == 0 || j == floorSize) ? true : (k == 0 || k == floorSize) ? true : false;
                this.grid[j][k].type = (j == 0 || j == floorSize) ? RTypes.WALL : (k == 0 || k == floorSize) ? RTypes.WALL : RTypes.FLOOR;
            }
        }
        var dir = Math.round(Math.random());
        var x: number = (dir == 0) ? Math.floor(Math.random() * (((floorSize - 1) / 2) + 1) + (floorSize / 4)) : 1;
        var y: number = (dir == 1) ? Math.floor(Math.random() * (((floorSize - 1) / 2) + 1) + (floorSize / 4)) : 1;
        this.partition(x, y, dir, floorSize);
    }
}

// Top level object, post: building complete with floors and rooms
class Building {
    floors: Array<Floor>; 
    numFloors: number;

    constructor(floorSize: number) {
        this.floors = [];
        this.numFloors = (Math.floor(Math.random() * 8)) + 5; // Anywhere from 5-12 floors

        for (var i: number = 0; i < this.numFloors; i++) {
            this.floors[i] = new Floor(floorSize);
        }

        return this;
    }
}