/// <reference path="defs.ts"/>
var Renderer = (function () {
    function Renderer() {
        this.canvas = document.getElementById("canvas");
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
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
//# sourceMappingURL=renderer.js.map
