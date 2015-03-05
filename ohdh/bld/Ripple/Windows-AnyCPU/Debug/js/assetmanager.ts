class AssetManager {
    // Loading Bar Vars
    private barTickSize: number = 0;
    private totalBar: number = 0;
    public total: number = 0;
    private remainder: number = 0;
    private curr: number = 0;

    // Arrays of anims, images, and audio
    public images: { [index: string]: HTMLImageElement; } = {};
    private imageURLs: { [index: string]: string; } = {
        none: "images/none.png",
        floor: "images/floors.png",
        wall: "images/walls.png",
        door: "images/doors.png",
        playerIdle: "images/char_idle.png",
        playerWalk: "images/char_walk.png",
        filled: "images/filled.png",
        empty: "images/empty.png",
        handgun: "images/handgun.png",
        phone: "images/phone.png",
    };
    public anims: { [index: string]: Animation; } = { //index matches imageURL index
        none: new Animation(true, 64, 32, 32, 16),
        floor: new Animation(true, 64, 32, 32, 16),
        wall: new Animation(true, 64, 64, 32, 48),
        door: new Animation(true, 64, 64, 32, 48),
        playerIdle: new Animation(true, 64, 64, 32, 64),
        playerWalk: new Animation(true, 64, 64, 32, 64),
        filled: new Animation(true, 64, 32, 32, 16),
        empty: new Animation(true, 64, 32, 32, 16),
        handgun: new Animation(true, 16, 16, 8, 8),
        phone: new Animation(true, 32, 45, 15, 39),
    };
    public audio: any = {}; // Can't do : Array<HTMLAudioElement> because that doesn't support .addEventListener() for some odd reason
    private audioURLs: any = {
        "walking": "sounds/walking-1.mp3",
    };

    // Loading bar canvas vars;
    private x: number = 0;
    private y: number = 0;
    private height: number = 0;

    // Updates the loading bar when asset is loaded
    updateBar(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
        this.curr++;

        // Loading bar
        this.totalBar += this.barTickSize;
        ctx.fillStyle = "black";
        var width: number = Math.floor(this.totalBar);
        if (this.curr >= this.total) width += this.remainder;
        ctx.fillRect(this.x, this.y, width, this.height);
        
        // Custom even handled in game.ts to start the game when all assets have loaded
        $("body").trigger("assetLoaded", { "num": this.curr });
    }

    private preloader(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
        var that = this;

        // Preload all images
        for (var i in this.imageURLs) {
            this.images[i] = new Image();
            this.images[i].onload = function (): void {
                that.updateBar(ctx, canvas);
            }
            this.images[i].src = this.imageURLs[i];
        }

        // Assign Animation objects
        for (var i in this.anims) {
            this.anims[i].setImage(this.images[i])
        }

        // Preload all sounds
        for (var i in this.audioURLs) {
            this.audio[i] = new Audio();
            this.audio[i].addEventListener('canplaythrough', that.updateBar(ctx, canvas), false);
            this.audio[i].src = this.audioURLs[i];
            this.audio[i].load();
        }
    }

    constructor(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
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
}