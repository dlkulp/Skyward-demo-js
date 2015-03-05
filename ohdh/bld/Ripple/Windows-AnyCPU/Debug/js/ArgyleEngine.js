var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
function randBetween(low, high, int) {
    if (typeof int === "undefined") { int = false; }
    if (int == false) {
        return Math.random() * (high - low) + low;
    } else if (int == true) {
        return Math.floor(Math.random() * (high - low + 1) + low);
    }
}

function cmpVector2(a, b) {
    if (a.x == b.x && a.y == b.y)
        return true;
    return false;
}

function collide(temp, NPCs) {
    for (var ind = 0; ind < NPCs.length; ind++) {
        if (cmpVector2(temp, NPCs[ind].gPos))
            return true;
        return false;
    }
}

var Vector2 = (function () {
    function Vector2(x, y) {
        this.x = x;
        this.y = y;
    }
    return Vector2;
})();

var Input = (function () {
    function Input() {
        this.bMouseClicked = false;
        this.mouseClickPos = new Vector2(-1, -1);
        this.keyPresses = new Array("");
    }
    return Input;
})();

var Animation = (function () {
    function Animation(st, width, height, off_x, off_y) {
        this.bStatic = st;
        this.frameSize = new Vector2(width, height);
        this.offset = new Vector2(off_x, off_y);
    }
    Animation.prototype.translate = function (ofst) {
        this.offset = ofst;
    };

    Animation.prototype.setImage = function (img) {
        this.image = img;
        this.sheetWidth = Math.floor(img.width / this.frameSize.x);
    };
    return Animation;
})();

var Obj = (function () {
    function Obj(x, y, anim) {
        this.pos = new Vector2(x, y);
        this.currAnim = anim;
        this.animFrame = 0;
        this.zIndex = 0;
        this.interactable = false;
    }
    // The "?" denotes an optional parameter, for those objects that don't need a vector2 it's not passed in
    Obj.prototype.tick = function (input, astar, p) {
        console.warn("calling undefined behavior");
    };

    Obj.prototype.setZ = function (z) {
        this.zIndex = z;
    };
    return Obj;
})();

var Interactable = (function (_super) {
    __extends(Interactable, _super);
    // Other stuff maybe, idk
    function Interactable(x, y, z) {
        _super.call(this, x, y);
        this.interactable = true;
        this.bStatic = true;
        this.zIndex = z;
    }
    return Interactable;
})(Obj);

var CollisionTile = (function (_super) {
    __extends(CollisionTile, _super);
    function CollisionTile(x, y, anim) {
        _super.call(this, x, y);
        this.bStatic = true;
        this.currAnim = anim;
        this.zIndex = 3;
    }
    return CollisionTile;
})(Obj);

var FloorTile = (function (_super) {
    __extends(FloorTile, _super);
    function FloorTile(x, y) {
        _super.call(this, x, y);
        this.bStatic = true;
        this.currAnim = "floor";
    }
    FloorTile.prototype.tick = function () {
        this.pos.x++;
    };
    return FloorTile;
})(Obj);

var WallTile = (function (_super) {
    __extends(WallTile, _super);
    function WallTile(x, y) {
        _super.call(this, x, y);
        this.bStatic = true;
        this.currAnim = "wall";
        this.zIndex = 5;
    }
    return WallTile;
})(Obj);

var DoorTile = (function (_super) {
    __extends(DoorTile, _super);
    function DoorTile(x, y) {
        _super.call(this, x, y);
        this.bStatic = true;
        this.currAnim = "door";
        this.zIndex = 5;
    }
    return DoorTile;
})(Obj);

function gridToScreen(xOrVect, y) {
    var out;

    if (typeof xOrVect != "number")
        out = new Vector2((600 + 32 * xOrVect.x - 32 * xOrVect.y) - 87, (16 * xOrVect.x + 16 * xOrVect.y) + 44);
    else
        out = new Vector2((600 + 32 * xOrVect - 32 * y) - 87, (16 * xOrVect + 16 * y) + 44);

    return out;
}

function div(a, b) {
    return (~~(a / b)) * b;
}

//function screenToGrid(x: number, y: number) {
//    var out = new Vector2(Math.round((((x / 32) - 18.75 + (y / 16)) / 2) - 2.72), Math.round(((18.75 + (y / 16) - (x / 32)) / 2)) - 2.75);
//    return out;
//}
function lerp(start, end, speed) {
    var dx = end.x - start.x;
    var dy = end.y - start.y;
    var len = Math.sqrt(dx * dx + dy * dy);
    if (speed >= len) {
        return new Vector2(end.x, end.y);
    } else {
        dx *= speed / len;
        dy *= speed / len;
        return new Vector2(start.x + dx, start.y + dy);
    }
}

var RTypes;
(function (RTypes) {
    RTypes[RTypes["FLOOR"] = 0] = "FLOOR";
    RTypes[RTypes["WALL"] = 1] = "WALL";
    RTypes[RTypes["DOOR"] = 2] = "DOOR";
})(RTypes || (RTypes = {}));
;

// A* functions
// javascript-astar 0.3.0
// http://github.com/bgrins/javascript-astar
// Freely distributable under the MIT License.
// Implements the astar search algorithm in javascript using a Binary Heap.
// Includes Binary Heap (with modifications) from Marijn Haverbeke.
// http://eloquentjavascript.net/appendix2.html
function pathTo(node) {
    var curr = node, path = [];
    while (curr.parent) {
        path.push(curr);
        curr = curr.parent;
    }
    return path.reverse();
}

function getHeap() {
    return new BinaryHeap(function (node) {
        return node.f;
    });
}

var astar = {
    init: function (graph) {
        for (var i = 0, len = graph.nodes.length; i < len; ++i) {
            var node = graph.nodes[i];
            node.f = 0;
            node.g = 0;
            node.h = 0;
            node.visited = false;
            node.closed = false;
            node.parent = null;
        }
    },
    /**
    * Perform an A* Search on a graph given a start and end node.
    * @param {Graph} graph
    * @param {GridNode} start
    * @param {GridNode} end
    * @param {Object} [options]
    * @param {bool} [options.closest] Specifies whether to return the
    path to the closest node if the target is unreachable.
    * @param {Function} [options.heuristic] Heuristic function (see
    *          astar.heuristics).
    */
    search: function (graph, start, end, options) {
        astar.init(graph);

        options = options || {};
        var heuristic = options.heuristic || astar.heuristics.manhattan, closest = options.closest || false;

        var openHeap = getHeap(), closestNode = start;

        start.h = heuristic(start, end);

        openHeap.push(start);

        while (openHeap.size() > 0) {
            // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
            var currentNode = openHeap.pop();

            // End case -- result has been found, return the traced path.
            if (currentNode === end) {
                return pathTo(currentNode);
            }

            // Normal case -- move currentNode from open to closed, process each of its neighbors.
            currentNode.closed = true;

            // Find all neighbors for the current node.
            var neighbors = graph.neighbors(currentNode);

            for (var i = 0, il = neighbors.length; i < il; ++i) {
                var neighbor = neighbors[i];

                if (neighbor.closed || neighbor.isWall()) {
                    continue;
                }

                // The g score is the shortest distance from start to current node.
                // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
                var gScore = currentNode.g + neighbor.getCost(currentNode), beenVisited = neighbor.visited;

                if (!beenVisited || gScore < neighbor.g) {
                    // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
                    neighbor.visited = true;
                    neighbor.parent = currentNode;
                    neighbor.h = neighbor.h || heuristic(neighbor, end);
                    neighbor.g = gScore;
                    neighbor.f = neighbor.g + neighbor.h;

                    if (closest) {
                        // If the neighbour is closer than the current closestNode or if it's equally close but has
                        // a cheaper path than the current closest node then it becomes the closest node
                        if (neighbor.h < closestNode.h || (neighbor.h === closestNode.h && neighbor.g < closestNode.g)) {
                            closestNode = neighbor;
                        }
                    }

                    if (!beenVisited) {
                        // Pushing to heap will put it in proper place based on the 'f' value.
                        openHeap.push(neighbor);
                    } else {
                        // Already seen the node, but since it has been rescored we need to reorder it in the heap
                        openHeap.rescoreElement(neighbor);
                    }
                }
            }
        }

        if (closest) {
            return pathTo(closestNode);
        }

        // No result was found - empty array signifies failure to find path.
        return [];
    },
    // See list of heuristics: http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
    heuristics: {
        manhattan: function (pos0, pos1) {
            var d1 = Math.abs(pos1.x - pos0.x);
            var d2 = Math.abs(pos1.y - pos0.y);
            return d1 + d2;
        },
        diagonal: function (pos0, pos1) {
            var D = 1;
            var D2 = Math.sqrt(2);
            var d1 = Math.abs(pos1.x - pos0.x);
            var d2 = Math.abs(pos1.y - pos0.y);
            return (D * (d1 + d2)) + ((D2 - 2) * D) * Math.min(d1, d2);
        }
    }
};

/**
* A graph memory structure
* @param {Array} gridIn 2D array of input weights
* @param {Object} [options]
* @param {bool} [options.diagonal] Specifies whether diagonal moves are allowed
*/
function Graph(gridIn, options) {
    options = options || {};
    this.nodes = [];
    this.diagonal = !!options.diagonal;
    this.grid = [];
    for (var x = 0; x < gridIn.length; x++) {
        this.grid[x] = [];

        for (var y = 0, row = gridIn[x]; y < row.length; y++) {
            var node = new GridNode(x, y, row[y]);
            this.grid[x][y] = node;
            this.nodes.push(node);
        }
    }
}

Graph.prototype.neighbors = function (node) {
    var ret = [], x = node.x, y = node.y, grid = this.grid;

    // West
    if (grid[x - 1] && grid[x - 1][y]) {
        ret.push(grid[x - 1][y]);
    }

    // East
    if (grid[x + 1] && grid[x + 1][y]) {
        ret.push(grid[x + 1][y]);
    }

    // South
    if (grid[x] && grid[x][y - 1]) {
        ret.push(grid[x][y - 1]);
    }

    // North
    if (grid[x] && grid[x][y + 1]) {
        ret.push(grid[x][y + 1]);
    }

    if (this.diagonal) {
        // Southwest
        if (grid[x - 1] && grid[x - 1][y - 1]) {
            ret.push(grid[x - 1][y - 1]);
        }

        // Southeast
        if (grid[x + 1] && grid[x + 1][y - 1]) {
            ret.push(grid[x + 1][y - 1]);
        }

        // Northwest
        if (grid[x - 1] && grid[x - 1][y + 1]) {
            ret.push(grid[x - 1][y + 1]);
        }

        // Northeast
        if (grid[x + 1] && grid[x + 1][y + 1]) {
            ret.push(grid[x + 1][y + 1]);
        }
    }

    return ret;
};

Graph.prototype.toString = function () {
    var graphString = [], nodes = this.grid, rowDebug, row, y, l;
    for (var x = 0, len = nodes.length; x < len; x++) {
        rowDebug = [];
        row = nodes[x];
        for (y = 0, l = row.length; y < l; y++) {
            rowDebug.push(row[y].weight);
        }
        graphString.push(rowDebug.join(" "));
    }
    return graphString.join("\n");
};

function GridNode(x, y, weight) {
    this.x = x;
    this.y = y;
    this.weight = weight;
}

GridNode.prototype.toString = function () {
    return "[" + this.x + " " + this.y + "]";
};

GridNode.prototype.getCost = function () {
    return this.weight;
};

GridNode.prototype.isWall = function () {
    return this.weight === 0;
};

function BinaryHeap(scoreFunction) {
    this.content = [];
    this.scoreFunction = scoreFunction;
}

BinaryHeap.prototype = {
    push: function (element) {
        // Add the new element to the end of the array.
        this.content.push(element);

        // Allow it to sink down.
        this.sinkDown(this.content.length - 1);
    },
    pop: function () {
        // Store the first element so we can return it later.
        var result = this.content[0];

        // Get the element at the end of the array.
        var end = this.content.pop();

        // If there are any elements left, put the end element at the
        // start, and let it bubble up.
        if (this.content.length > 0) {
            this.content[0] = end;
            this.bubbleUp(0);
        }
        return result;
    },
    remove: function (node) {
        var i = this.content.indexOf(node);

        // When it is found, the process seen in 'pop' is repeated
        // to fill up the hole.
        var end = this.content.pop();

        if (i !== this.content.length - 1) {
            this.content[i] = end;

            if (this.scoreFunction(end) < this.scoreFunction(node)) {
                this.sinkDown(i);
            } else {
                this.bubbleUp(i);
            }
        }
    },
    size: function () {
        return this.content.length;
    },
    rescoreElement: function (node) {
        this.sinkDown(this.content.indexOf(node));
    },
    sinkDown: function (n) {
        // Fetch the element that has to be sunk.
        var element = this.content[n];

        while (n > 0) {
            // Compute the parent element's index, and fetch it.
            var parentN = ((n + 1) >> 1) - 1, parent = this.content[parentN];

            // Swap the elements if the parent is greater.
            if (this.scoreFunction(element) < this.scoreFunction(parent)) {
                this.content[parentN] = element;
                this.content[n] = parent;

                // Update 'n' to continue at the new position.
                n = parentN;
            } else {
                break;
            }
        }
    },
    bubbleUp: function (n) {
        // Look up the target element and its score.
        var length = this.content.length, element = this.content[n], elemScore = this.scoreFunction(element);

        while (true) {
            // Compute the indices of the child elements.
            var child2N = (n + 1) << 1, child1N = child2N - 1;

            // This is used to store the new position of the element, if any.
            var swap = null, child1Score;

            // If the first child exists (is inside the array)...
            if (child1N < length) {
                // Look it up and compute its score.
                var child1 = this.content[child1N];
                child1Score = this.scoreFunction(child1);

                // If the score is less than our element's, we need to swap.
                if (child1Score < elemScore) {
                    swap = child1N;
                }
            }

            // Do the same checks for the other child.
            if (child2N < length) {
                var child2 = this.content[child2N], child2Score = this.scoreFunction(child2);
                if (child2Score < (swap === null ? elemScore : child1Score)) {
                    swap = child2N;
                }
            }

            // If the element needs to be moved, swap it, and continue.
            if (swap !== null) {
                this.content[n] = this.content[swap];
                this.content[swap] = element;
                n = swap;
            } else {
                break;
            }
        }
    }
};

var AssetManager = (function () {
    function AssetManager(ctx, canvas) {
        // Loading Bar Vars
        this.barTickSize = 0;
        this.totalBar = 0;
        this.total = 0;
        this.remainder = 0;
        this.curr = 0;
        // Arrays of anims, images, and audio
        this.images = {};
        this.imageURLs = {
            none: "images/none.png",
            floor: "images/floors.png",
            wall: "images/walls.png",
            teleporter: "images/teleporter.png",
            playerIdleD: "images/charStatDown.png",
            playerIdleL: "images/charStatLeft.png",
            playerIdleU: "images/charStatUp.png",
            playerWalkD: "images/charStatDown.png",
            playerWalkL: "images/charStatLeft.png",
            playerWalkU: "images/charStatUp.png",
            filled: "images/filled.png",
            empty: "images/empty.png",
            npcFollow: "images/npcFollower.png",
            npcIdleD: "images/npcStatDown.png",
            npcIdleL: "images/npcStatLeft.png",
            npcIdleU: "images/npcStatUp.png",
            npcIdleR: "images/npcStatRight.png",
            npcIdleDSeen: "images/npcStatDown.png",
            npcIdleLSeen: "images/npcStatLeft.png",
            npcIdleUSeen: "images/npcStatUp.png",
            npcIdleRSeen: "images/npcStatRight.png"
        };
        this.anims = {
            none: new Animation(true, 64, 32, 32, 16),
            floor: new Animation(true, 64, 32, 32, 16),
            wall: new Animation(true, 64, 64, 32, 48),
            teleporter: new Animation(true, 64, 32, 32, 16),
            playerIdleD: new Animation(true, 64, 64, 32, 44),
            playerIdleL: new Animation(true, 64, 64, 32, 44),
            playerIdleU: new Animation(true, 64, 64, 32, 44),
            playerWalkD: new Animation(true, 64, 64, 32, 64),
            playerWalkL: new Animation(true, 64, 64, 32, 64),
            playerWalkU: new Animation(true, 64, 64, 32, 64),
            filled: new Animation(true, 64, 32, 32, 16),
            empty: new Animation(true, 64, 32, 32, 16),
            npcFollow: new Animation(true, 64, 64, 32, 40),
            npcIdleD: new Animation(true, 64, 64, 32, 40),
            npcIdleL: new Animation(true, 64, 64, 32, 40),
            npcIdleU: new Animation(true, 64, 64, 32, 40),
            npcIdleR: new Animation(true, 64, 64, 32, 40),
            npcIdleDSeen: new Animation(true, 64, 64, 32, 60),
            npcIdleLSeen: new Animation(true, 64, 64, 32, 60),
            npcIdleUSeen: new Animation(true, 64, 64, 32, 60),
            npcIdleRSeen: new Animation(true, 64, 64, 32, 60)
        };
        this.audio = {};
        this.audioURLs = {
            "main": "sounds/SneakySnake Theme.wav"
        };
        // Loading bar canvas vars;
        this.x = 0;
        this.y = 0;
        this.height = 0;
        this.imagesLength = 0;

        // Set canvas vars
        this.total = Object.keys(this.imageURLs).length + Object.keys(this.audioURLs).length;
        this.x = Math.floor(canvas.width / 4);
        this.y = Math.floor(canvas.height / 2 - canvas.height / 16);
        this.height = Math.floor(canvas.height / 16);

        // Black background
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Loading bar stuff
        ctx.fillStyle = "white";
        ctx.fillRect(this.x - 5, this.y - 5, Math.floor(canvas.width / 2 + 10), this.height + 10); // 5 is boarder
        this.barTickSize = Math.floor((canvas.width / 2) / this.total);
        this.remainder = Math.floor(canvas.width / 2) - (this.barTickSize * this.total);

        // Actually load the images
        this.preloader(ctx, canvas);
    }
    // Updates the loading bar when asset is loaded
    AssetManager.prototype.updateBar = function (ctx, canvas) {
        this.curr++;

        // Loading bar
        this.totalBar += this.barTickSize;
        ctx.fillStyle = "black";
        var width = Math.floor(this.totalBar);
        if (this.curr >= this.total)
            width += this.remainder;
        ctx.fillRect(this.x, this.y, width, this.height);

        // Custom even handled in game.ts to start the game when all assets have loaded
        $("body").trigger("assetLoaded", { "num": this.curr });
    };

    AssetManager.prototype.preloader = function (ctx, canvas) {
        var that = this;

        for (var i in this.imageURLs) {
            this.images[i] = new Image();
            this.images[i].onload = function () {
                that.updateBar(ctx, canvas);
            };
            this.images[i].src = this.imageURLs[i];
            this.imagesLength++;
        }

        for (var i in this.anims) {
            this.anims[i].setImage(this.images[i]);
        }

        for (var i in this.audioURLs) {
            this.audio[i] = new Audio();
            this.audio[i].addEventListener('canplaythrough', that.updateBar(ctx, canvas), false);
            this.audio[i].src = this.audioURLs[i];
            this.audio[i].load();
            this.audio[i].addEventListener('ended', function () {
                this.currentTime = 0;
                this.play();
            }, false);
        }
    };

    AssetManager.prototype.removeAssets = function () {
        for (var i = this.audio.length - 1; i >= 0; i--)
            $(this.audio[0]).remove();
        for (var i = this.imagesLength - 1; i >= 0; i--)
            $(this.images[0]).remove();
    };
    return AssetManager;
})();

var Renderer = (function () {
    function Renderer() {
        this.canvas = document.getElementById("canvas");
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight - 20;
        this.ctx = this.canvas.getContext("2d");
    }
    Renderer.prototype.draw = function (objs, anims) {
        // draw background
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // render objects first by z-index, then by ascending (top to bottom) y order
        objs.sort(function (a, b) {
            var zDiff = a.zIndex - b.zIndex;
            if (zDiff == 0) {
                return a.pos.y - b.pos.y;
            } else {
                return zDiff;
            }
        });
        for (var i = 0; i < objs.length; i++) {
            var obj = objs[i];
            var anim = anims[obj.currAnim];
            var framePosition = new Vector2(0, 0);
            if (!anim.bStatic) {
                framePosition.x = obj.animFrame % anim.sheetWidth;
                framePosition.y = Math.floor(obj.animFrame / anim.sheetWidth);
            }
            this.ctx.drawImage(anim.image, framePosition.x, framePosition.y, anim.frameSize.x, anim.frameSize.y, obj.pos.x - anim.offset.x, obj.pos.y - anim.offset.y, anim.frameSize.x, anim.frameSize.y);
        }
    };
    return Renderer;
})();

// Basic tile for each grid point on a floor
var GridTile = (function () {
    function GridTile() {
        this.wall = false;
        this.door = false;
        this.type = 0 /* FLOOR */;
    }
    return GridTile;
})();

// Floors in a building, contains a 2d array of GridTiles called grid
var Floor = (function () {
    function Floor(floorSize) {
        this.grid = [];

        for (var j = 0; j <= floorSize; j++) {
            this.grid[j] = [];
            for (var k = 0; k <= floorSize; k++) {
                this.grid[j][k] = new GridTile();
                this.grid[j][k].wall = (j == 0 || j == floorSize) ? true : (k == 0 || k == floorSize) ? true : false;
                this.grid[j][k].type = (j == 0 || j == floorSize) ? 1 /* WALL */ : (k == 0 || k == floorSize) ? 1 /* WALL */ : 0 /* FLOOR */;
            }
        }

        var dir = Math.round(Math.random());
        var x = (dir == 0) ? Math.floor(Math.random() * (((floorSize - 1) / 2) + 1) + (floorSize / 4)) : 1;
        var y = (dir == 1) ? Math.floor(Math.random() * (((floorSize - 1) / 2) + 1) + (floorSize / 4)) : 1;
        this.partition(x, y, dir, floorSize);
    }
    Floor.prototype.partition = function (x, y, dir, floorSize) {
        var length = 0;
        var start = { x: x, y: y };

        // Return if coords are bad
        if (x < 0 || x > floorSize || y < 0 || y > floorSize) {
            console.warn("coords out of bounds");
            return;
        }

        // Return if too small
        var minLength = 3;
        var percent = 2;
        if (dir == 0) {
            for (var i = 0; i < minLength; i++)
                if (this.grid[x][y + i].wall)
                    return;
            if (this.grid[x + 1][y + 1].wall || (this.grid[x + 2][y + 1].wall && (Math.random() * 10) > percent) || this.grid[x - 1][y + 1].wall || (this.grid[x - 2][y + 1].wall && (Math.random() * 10) > percent))
                return;
        } else if (dir == 1) {
            for (var i = 0; i < minLength; i++)
                if (this.grid[x + i][y].wall)
                    return;
            if (this.grid[x + 1][y + 1].wall || (this.grid[x + 1][y + 2].wall && (Math.random() * 10) > percent) || this.grid[x + 1][y - 1].wall || (this.grid[x + 1][y - 2].wall && (Math.random() * 10) > percent))
                return;
        } else if (dir == 2) {
            for (var i = 0; i < minLength; i++)
                if (this.grid[x][y - i].wall)
                    return;
            if (this.grid[x + 1][y - 1].wall || (this.grid[x + 2][y - 1].wall && (Math.random() * 10) > percent) || this.grid[x - 1][y - 1].wall || (this.grid[x - 2][y - 1].wall && (Math.random() * 10) > percent))
                return;
        } else if (dir == 3) {
            for (var i = 0; i < minLength; i++)
                if (this.grid[x - i][y].wall)
                    return;
            if (this.grid[x - 1][y + 1].wall || (this.grid[x - 1][y + 2].wall && (Math.random() * 10) > percent) || this.grid[x - 1][y - 1].wall || (this.grid[x - 1][y - 2].wall && (Math.random() * 10) > percent))
                return;
        }

        while (!this.grid[x][y].wall) {
            this.grid[x][y].wall = !this.grid[x][y].wall;
            this.grid[x][y].type = 1 /* WALL */;

            if (dir == 0)
                y++;
            else if (dir == 1)
                x++;
            else if (dir == 2)
                y--;
            else if (dir == 3)
                x--;

            length++;
        }
        length--; // All of the stuff runs the last time when it's on another wall

        // To move the door if a wall runs into a door (not for spawning from a door)
        if (dir == 0 && (y + 1 < floorSize) && this.grid[x][y].door) {
            this.grid[x][y].door = false;
            this.grid[x][y].type = 1 /* WALL */;
            if (this.grid[x + 1][y + 1].wall) {
                this.grid[x - 1][y].door = true;
                this.grid[x - 1][y].type = 2 /* DOOR */;
            } else {
                this.grid[x + 1][y].door = true;
                this.grid[x + 1][y].type = 2 /* DOOR */;
            }
        } else if (dir == 1 && (x + 1 < floorSize) && this.grid[x][y].door) {
            this.grid[x][y].door = false;
            this.grid[x][y].type = 1 /* WALL */;
            if (this.grid[x + 1][y + 1].wall) {
                this.grid[x][y - 1].door = true;
                this.grid[x][y - 1].type = 2 /* DOOR */;
            } else {
                this.grid[x][y + 1].door = true;
                this.grid[x][y + 1].type = 2 /* DOOR */;
            }
        } else if (dir == 2 && (y - 1 > 0) && this.grid[x][y].door) {
            this.grid[x][y].door = false;
            this.grid[x][y].type = 1 /* WALL */;
            if (this.grid[x + 1][y - 1].wall) {
                this.grid[x - 1][y].door = true;
                this.grid[x - 1][y].type = 2 /* DOOR */;
            } else {
                this.grid[x + 1][y].door = true;
                this.grid[x + 1][y].type = 2 /* DOOR */;
            }
        } else if (dir == 3 && (x - 1 > 0) && this.grid[x][y].door) {
            this.grid[x][y].door = false;
            this.grid[x][y].type = 1 /* WALL */;
            if (this.grid[x - 1][y + 1].wall) {
                this.grid[x][y - 1].door = true;
                this.grid[x][y - 1].type = 2 /* DOOR */;
            } else {
                this.grid[x][y + 1].door = true;
                this.grid[x][y + 1].type = 2 /* DOOR */;
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
        var newCord1 = door1;
        var newCord2 = door1;

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
            this.grid[x][start.y + door1].type = 2 /* DOOR */;
            if (length > (floorSize * .75)) {
                this.grid[x][start.y + door2].door = true;
                this.grid[x][start.y + door2].type = 2 /* DOOR */;
            } else if (length > (floorSize / 2) && ((Math.random() * 10) > 2.5)) {
                this.grid[x][start.y + door2].door = true;
                this.grid[x][start.y + door2].type = 2 /* DOOR */;
            }
        } else if (dir == 1 || dir == 3) {
            this.grid[start.x + door1][y].door = true;
            this.grid[start.x + door1][y].type = 2 /* DOOR */;
            if (length > (floorSize * .75)) {
                this.grid[start.x + door2][y].door = true;
                this.grid[start.x + door2][y].type = 2 /* DOOR */;
            } else if (length > (floorSize / 2) && ((Math.random() * 10) > 2.5)) {
                this.grid[start.x + door2][y].door = true;
                this.grid[start.x + door2][y].type = 2 /* DOOR */;
            }
        }

        // Do the recursion
        // Recursive x
        if (dir == 0 || dir == 2) {
            // Recurse right
            this.partition(x + 1, start.y + newCord1, 1, floorSize);

            // Recurse left
            this.partition(x - 1, start.y + newCord2, 3, floorSize);
        } else if (dir == 1 || dir == 3) {
            // Recurse up
            this.partition(start.x + newCord1, y + 1, 0, floorSize);

            // Recurse down
            this.partition(start.x + newCord2, y - 1, 2, floorSize);
        }
    };
    return Floor;
})();

// Top level object, post: building complete with floors and rooms
var Building = (function () {
    function Building(floorSize) {
        this.floors = [];
        this.numFloors = (Math.floor(Math.random() * 8)) + 10; // Anywhere from 10-18 floors

        for (var i = 0; i < this.numFloors; i++) {
            this.floors[i] = new Floor(floorSize);
        }

        var tempArr = [];
        var tempCollish = [];
        this.collisionMap = [];
        for (var i = 0; i < this.numFloors; i++) {
            this.collisionMap[i] = [];
            for (var x = 0; x < this.floors[i].grid.length; x++) {
                for (var y = 0; y < this.floors[i].grid.length; y++) {
                    tempCollish.push((this.floors[i].grid[y][x].type == 1 /* WALL */) ? new CollisionTile(gridToScreen(y, x).x, gridToScreen(y, x).y, "filled") : new CollisionTile(gridToScreen(y, x).x, gridToScreen(y, x).y, "empty"));
                }
                this.collisionMap[i].push(tempCollish);
                tempCollish = [];
            }
        }

        return this;
    }
    return Building;
})();
//# sourceMappingURL=ArgyleEngine.js.map
