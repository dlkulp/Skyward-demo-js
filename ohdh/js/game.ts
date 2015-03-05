/// <reference path="ArgyleEngine.ts"/>
/// <reference path="player.ts"/>
/// <reference path="NPC.ts"/>
/// <reference path="Teleporter.ts"/>
class OHDHGame{
    public world: Building;
    public currentFloor: number;
    public floorSize: number;
    public renderer: Renderer;
    public assetmanager: AssetManager;
    public staticObjs: Array<Obj>; // No tick calls
    public dynamicObjs: Array<Obj>; // Tick calls
    public pickupObjs: Array<Obj>; // No tick calls
    public interactableObjs: Array<Obj>; // Tick calls when player is standing on it
    public interval: number = 15;
    public tickID: any; // ID to clear for tick function when restarting game
    public player: Player;
    public input: Input;
    public collisionMap;
    private tempTick;
    private tempi;
    public NPCs: Array<NPC>;
    private numNPC: number;
    private currTeleporter: Teleporter;

    private setupFloor() {
        this.player.pos = gridToScreen(1, 1);
        this.player.sDestination = gridToScreen(1, 1);
        this.player.gDestination = new Vector2(1, 1);
        this.player.tempDestination = new Vector2(1, 1);
        this.player.previousLoc = [new Vector2(1, 1)];
        for (var i = 0; i < this.player.following.length + 1; i++)
            this.player.previousLoc.push(new Vector2(1, 1));

        // Set up floor tiles
        var floor = this.world.floors[this.currentFloor];
        this.staticObjs = [];
        for (var y = 0; y < floor.grid.length; y++) {
            for (var x = 0; x < floor.grid[y].length; x++) {
                var screen_coords = gridToScreen(x, y);
                if (floor.grid[x][y].type == RTypes.FLOOR) {
                    var tile = new FloorTile(screen_coords.x, screen_coords.y);
                    tile.setZ(-1);
                    this.staticObjs.push(tile);
                } else if (floor.grid[x][y].type == RTypes.WALL) {
                    this.staticObjs.push(new WallTile(screen_coords.x, screen_coords.y));
                } else if (floor.grid[x][y].type == RTypes.DOOR) {
                    this.staticObjs.push(new FloorTile(screen_coords.x, screen_coords.y));
                }
            }
        }

        // Spawn teleporter to next level
        tempx = Math.floor(Math.random() * this.floorSize);
        tempy = Math.floor(Math.random() * this.floorSize);
        while (floor.grid[tempx][tempy].type == RTypes.WALL) {
            tempx = Math.floor(Math.random() * this.floorSize);
            tempy = Math.floor(Math.random() * this.floorSize);
        }
        this.tempi = gridToScreen(tempx, tempy);
        this.currTeleporter = new Teleporter(this.tempi.x, this.tempi.y, "teleporter");

        // Spawn NPC's
        var tempx = Math.floor(Math.random() * this.floorSize);
        var tempy = Math.floor(Math.random() * this.floorSize);

        // Move followers (if any) to 1,1
        var tempNPC = [];
        for (var i = 0; i < this.NPCs.length; i++)
            if (this.NPCs[i].bFollowing) {
                this.NPCs[i].pos = gridToScreen(1, 1);
                tempNPC.push(this.NPCs[i]);
            }

        this.NPCs = tempNPC;
        var tempVect: Vector2 = new Vector2(0, 0);

        // Check if colliding with anything and if not then place
        for (var i: number = randBetween(this.numNPC, this.numNPC - 3); i > 0; i--) {
            tempx = Math.floor(Math.random() * this.floorSize);
            tempy = Math.floor(Math.random() * this.floorSize);
            tempVect = new Vector2(tempx, tempy);
            while (floor.grid[tempx][tempy].type == RTypes.WALL || collide(tempVect, this.NPCs) || cmpVector2(gridToScreen(tempVect), this.currTeleporter.pos) || (tempVect.x < 6 && tempVect.y == 1) || (tempVect.x == 1 && tempVect.y < 6)) {
                tempx = Math.floor(Math.random() * this.floorSize);
                tempy = Math.floor(Math.random() * this.floorSize);
                tempVect = new Vector2(tempx, tempy);
            }
            
            this.tempi = gridToScreen(tempx, tempy);
            this.NPCs.push(new NPC(this.tempi.x, this.tempi.y, tempx, tempy, 5));
        }
    }

    public restartGame() {
        // Stop the tick function from ticking
        clearInterval(this.tickID);

        // Make new world
        this.world = this.worldGen();

        // Reset everything
        this.staticObjs = [];
        this.dynamicObjs = [];
        this.pickupObjs = [];
        this.interactableObjs = [];
        this.collisionMap = this.world.collisionMap;
        this.numNPC = 3;
        this.NPCs = [];
        this.currentFloor = 0;
        this.input.keyPresses = [];;

        // Run the function to start a new game
        this.startGame();
    }

    public worldGen(): Building {
        // Makes a new world
        return new Building(this.floorSize);
    }
    public viewWorld(w: Building): void {
        var wall: string = "id ='wall";
        var door: string = "id ='door"
        $("p").remove();
        for (var y: number = 0; y <= this.floorSize; y++) {
            var outP: string = "<p>";
            for (var x: number = 0; x <= this.floorSize; x++) {
                outP += "<span class='tileType" + ((w.floors[0].grid[x][y].wall) ? (w.floors[0].grid[x][y].door) ? "02" : "01" : "00") + "'" + " " + ((w.floors[0].grid[x][y].wall) ? (w.floors[0].grid[x][y].door) ? door : wall : "") + "'>";
                outP += (w.floors[0].grid[x][y].wall) ? (w.floors[0].grid[x][y].door) ? "02" : "01" : "00";
                outP += "</span>";
            }
            outP += "</p>";
            $(".output").prepend(outP);
            outP = "";
        }
        $(".tileType00").css({
            color: "black"
        });
        $(".tileType01").css({
            color: "#6C7A89",
            backgroundColor: "#6C7A89"
        });
        $(".tileType02").css({
            backgroundColor: "#CF000F",
            color: "#CF000F"
        });
    }

    public tick(): void {
        //game logic loop

        // Resets world if player is on a teleporter and thus needs to go to the next level
        if (cmpVector2(this.player.pos, this.player.sDestination) && cmpVector2(this.player.pos, this.currTeleporter.pos)) {
            this.currentFloor++;
            this.numNPC += 3;
            this.setupFloor();
            return;
        }

        // Draw objects
        this.tempTick = this.staticObjs.concat(this.dynamicObjs).concat(this.pickupObjs).concat(this.NPCs).concat(this.currTeleporter);
        this.tempTick.push(this.player);

        // show collision map
        //var moreTemp = [];
        //for (var i = 0; i < this.collisionMap[this.currentFloor].length; i++) {
        //    moreTemp = this.collisionMap[this.currentFloor][i];
        //    this.tempTick = this.tempTick.concat(moreTemp.slice());
        //}
        // end show collision map

        // Tick NPC's, if any can see the player, kill the player
        for (this.tempi = 0; this.tempi < this.NPCs.length; this.tempi++) {
            this.NPCs[this.tempi].tick(this.input, this.player, this.collisionMap[this.currentFloor]);            
            if (this.NPCs[this.tempi].seen) {
                if (cmpVector2(this.player.pos, this.player.sDestination)) {
                    this.player.health -= 1;
                }
                break;
            }

        }

        // Tick player
        this.player.tick(this.input, this.collisionMap);

        // Dissallows the player from moving through walls
        if (this.collisionMap[this.currentFloor][this.player.tempDestination.y][this.player.tempDestination.x].currAnim !== "filled")
            this.player.bCanLerp = true;
        else
            this.player.bCanLerp = false;

        // Render everything
        this.renderer.draw(this.tempTick, this.assetmanager.anims);

        // Clear inputs
        this.input.bMouseClicked = false;

        // Check end game (player has no health)
        if (this.player.health <= 0) {
            clearInterval(this.tickID);
            var that = this;
            setTimeout(function () {
                that.renderer.ctx.fillStyle = "#DD1321";
                that.renderer.ctx.font = "6.5em Inconsolata";
                that.renderer.ctx.fillText("You've been seen!", that.renderer.canvas.width / 8, that.renderer.canvas.height / 2);
                that.renderer.ctx.font = "3em Incosolata";
                that.renderer.ctx.fillText("Score: " + that.player.following.length, that.renderer.canvas.width / 2.4, that.renderer.canvas.height / 1.5 );
            }, 400);
        }
    }
    public startGame(): void {
        // Create the player
        var playerLocation: Vector2 = gridToScreen(1, 1);
        this.player = new Player(playerLocation.x, playerLocation.y);

        // set up floor
        this.setupFloor();

        // Start tick function
        var self = this;
        this.tickID = setInterval(function () { self.tick() }, this.interval);
    }
    public unsubscribeClick() {
        $(this.renderer.canvas).unbind("click");
    }
    constructor() {
        this.currentFloor = 0;
        this.floorSize = 15;
        this.world = this.worldGen();
        this.viewWorld(this.world);
        this.renderer = new Renderer();
        this.assetmanager = new AssetManager(this.renderer.ctx, this.renderer.canvas);
        this.staticObjs = [];
        this.dynamicObjs = [];
        this.pickupObjs = [];
        this.interactableObjs = [];
        this.collisionMap = this.world.collisionMap;
        this.numNPC = 3;
        this.NPCs = [];

        var that = this;
        this.input = new Input;
        // Handle input
        $(this.renderer.canvas).click(function (e) {
            that.input.bMouseClicked = true;
            that.input.mouseClickPos.x = e.pageX;
            that.input.mouseClickPos.y = e.pageY;
        });

        // Bind key inputs
        $(window).keyup(function (e) {
            if (e.which == 87)
                that.input.keyPresses.push("w");
            else if (e.which == 65)
                that.input.keyPresses.push("a");
            else if (e.which == 83)
                that.input.keyPresses.push("s");
            else if (e.which == 68)
                that.input.keyPresses.push("d");
            else if (e.which == 77) {
                if (that.assetmanager.audio.main.paused)
                    that.assetmanager.audio.main.play();
                else that.assetmanager.audio.main.pause();
            }
        });
    }
}
$(function game(): void {

    var game = new OHDHGame();
    $(".new").click(function () {
        // Restart the game if the button is pressed
        game.restartGame();
    });
    $(".control").click(function () {
        // Change control scheme from w moving to upper right to w moving to upper left
        if (game.player.controls[0] == "s")
            game.player.controls = ["a", "w", "d", "s"];
        else
            game.player.controls = ["s", "a", "w", "d"];
    });


    
    // Start game when all assets are loaded
    $("body").on("assetLoaded", function (e, d) {
        if (d.num >= game.assetmanager.total) {
            game.assetmanager.audio.main.addEventListener('ended', function () {
                this.currentTime = 0;
                this.play();
            }, false);
            game.assetmanager.audio.main.play();
            game.startGame();
        }
    });

    
});
