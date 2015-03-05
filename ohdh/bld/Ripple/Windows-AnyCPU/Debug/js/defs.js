var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
function randBetween(a, b, int) {
    if (typeof int === "undefined") { int = false; }
    if (int == false) {
        return Math.random() * (b - a) + a;
    } else if (int == true) {
        return Math.floor(Math.random() * (b - a + 1) + a);
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
    }
    return Input;
})();

var Animation = (function () {
    function Animation(st, width, height, off_x, off_y) {
        this.bStatic = st;
        this.frameSize = new Vector2(width, height);
        this.offset = new Vector2(off_x, off_y);
    }
    Animation.prototype.setImage = function (img) {
        this.image = img;
        this.sheetWidth = Math.floor(img.width / this.frameSize.x);
    };
    return Animation;
})();

var Obj = (function () {
    function Obj(x, y, anim) {
        this.pos = new Vector2(x, y);
        this.currAnim = "none";
        this.animFrame = 0;
        this.zIndex = 0;
        this.interactable = false;
    }
    // The "?" denotes an optional parameter, for those objects that don't need a vector2 it's not passed in
    Obj.prototype.tick = function (input, astar) {
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

var Phone = (function (_super) {
    __extends(Phone, _super);
    function Phone(x, y, z) {
        _super.call(this, x, y, z);
        this.currAnim = "phone";
    }
    Phone.prototype.tick = function () {
        console.log("I am a phone and I'm ticking");
    };
    return Phone;
})(Interactable);

var PickUp = (function (_super) {
    __extends(PickUp, _super);
    function PickUp(x, y, z, weight) {
        _super.call(this, x, y, z); // Dunno what all we want here
    }
    return PickUp;
})(Interactable);

var HandGun = (function (_super) {
    __extends(HandGun, _super);
    function HandGun(x, y, z, weight) {
        _super.call(this, x, y, z);
        this.currAnim = "handgun";
        this.weight = weight;
    }
    return HandGun;
})(PickUp);

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

function gridToScreen(x, y) {
    var out = new Vector2(600 + 32 * x - 32 * y, 16 * x + 16 * y);
    return out;
}

function div(a, b) {
    return (~~(a / b)) * b;
}

function screenToGrid(x, y) {
    var out = new Vector2(Math.round(((x / 32) - 18.75 + (y / 16)) / 2), Math.round((18.75 + (y / 16) - (x / 32)) / 2));
    return out;
}

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
//# sourceMappingURL=defs.js.map
