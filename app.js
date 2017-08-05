var HEADER_HEIGHT = 50;
var BACKGROUND_COLOR = "rgb(64, 61, 63)";
var TILE_WIDTH = 195;
var TILE_HEIGHT = 412;
var imageWidth = -1;
var imageHeight = -1;
var ImageRect = (function () {
    function ImageRect(_x, _y, _w, _h) {
        this._x = _x;
        this._y = _y;
        this._w = _w;
        this._h = _h;
    }
    Object.defineProperty(ImageRect.prototype, "x", {
        get: function () {
            return this._x;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ImageRect.prototype, "y", {
        get: function () {
            return this._y;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ImageRect.prototype, "w", {
        get: function () {
            return this._w;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ImageRect.prototype, "h", {
        get: function () {
            return this._h;
        },
        enumerable: true,
        configurable: true
    });
    return ImageRect;
}());
function handleFileSelect(evt) {
    var files = evt.target.files;
    var output = [];
    var f = files[0];
    output.push('<li><strong>', encodeURI(f.name), '</strong> (', f.type || 'n/a', ') - ', f.size, ' bytes, last modified: ', f.lastModifiedDate.toLocaleDateString(), '</li>');
    document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';
    var reader = new FileReader();
    reader.onload = function (e) {
        var preview = document.getElementById('preview');
        preview.src = reader.result;
        preview.width = 150;
    };
    reader.readAsDataURL(f);
}
function handleStart(event) {
    var canvas = document.getElementById("canvas");
    var preview = document.getElementById('preview');
    var context2d = canvas.getContext('2d');
    var image = new Image();
    image.src = preview.src;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    context2d.drawImage(preview, 0, 0);
    var target;
    var radioList = document.getElementsByName('ratio');
    for (var i = 0; i < radioList.length; i++) {
        if (radioList[i].checked) {
            if (radioList[i].value == 'paper-vertically') {
                target = repatch(canvas, null, null, 1.414);
            }
            else if (radioList[i].value == 'paper-horizontally') {
                target = repatch(canvas, null, null, 0.707);
            }
            else if (radioList[i].value == 'row') {
                var rowSize = document.getElementById('rowSize');
                target = repatch(canvas, Number(rowSize.value), null, null);
            }
            else if (radioList[i].value == 'column') {
                var columnSize = document.getElementById('columnSize');
                target = repatch(canvas, null, Number(columnSize.value), null);
            }
        }
    }
    var png = target.toDataURL();
    var resultImage = document.getElementById('result');
    resultImage.src = png;
    resultImage.width = target.width;
    resultImage.height = target.height;
}
function repatch(source, rowOption, columnOption, ratioOption) {
    var items = split(source);
    var columnCount = 4;
    var rowCount = Math.floor(items.length / columnCount) + (items.length % columnCount > 0 ? 1 : 0);
    if (columnOption != undefined) {
        columnCount = columnOption;
        rowCount = items.length / columnCount + (items.length % columnCount > 0 ? 1 : 0);
    }
    else if (rowOption != undefined) {
        rowCount = rowOption;
        columnCount = Math.floor(items.length / rowCount) + (items.length % rowCount > 0 ? 1 : 0);
    }
    else {
        var minError = Number.MAX_VALUE;
        for (var i = 4; i <= items.length; i++) {
            var j = Math.floor(items.length / i) + (items.length % i > 0 ? 1 : 0);
            var ratio = (HEADER_HEIGHT + TILE_HEIGHT * j) / (i * TILE_WIDTH);
            if (Math.abs(ratio - ratioOption) < minError) {
                minError = Math.abs(ratio - ratioOption);
                columnCount = i;
                rowCount = Math.floor(j);
            }
        }
    }
    var target = document.createElement("canvas");
    target.width = TILE_WIDTH * columnCount;
    target.height = HEADER_HEIGHT + TILE_HEIGHT * rowCount;
    var target2d = target.getContext('2d');
    var source2d = source.getContext('2d');
    target2d.fillStyle = BACKGROUND_COLOR.toString();
    target2d.fillRect(0, 0, target.width, target.height);
    target2d.drawImage(source, 0, 0, TILE_WIDTH * 4, HEADER_HEIGHT, 0, 0, TILE_WIDTH * 4, HEADER_HEIGHT);
    for (var y = 0; y < rowCount; y++) {
        for (var x = 0; x < columnCount; x++) {
            var i = x + y * columnCount;
            if (i < items.length) {
                var item = items[i];
                target2d.drawImage(source, item.x, item.y, item.w, item.h, x * TILE_WIDTH, HEADER_HEIGHT + y * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
            }
        }
    }
    return target;
}
function split(source) {
    var numY = (source.height - HEADER_HEIGHT) / TILE_HEIGHT;
    var numX = 6;
    var tiles = new Array(numX * numY);
    for (var y = 0; y < numY; y++) {
        for (var x = 0; x < numX; x++) {
            var index = numX * y + x;
            tiles[index] = new ImageRect(x * TILE_WIDTH, y * TILE_HEIGHT + HEADER_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
        }
    }
    var tilesToRemove = 0;
    var context2d = source.getContext('2d');
    for (var i = tiles.length - 1; i >= 0; i--) {
        var tile = tiles[i];
        var grayPixels = 0;
        for (var x = 0; x < TILE_WIDTH; x++) {
            var color = context2d.getImageData(tile.x + x, tile.y + TILE_HEIGHT / 2, 1, 1).data;
            if (color[0] == 64 && color[1] == 61 && color[2] == 63 && color[3] == 255) {
                grayPixels++;
            }
        }
        if (grayPixels / tile.w < 0.9) {
            break;
        }
        else {
            tiles[i] = null;
            tilesToRemove++;
        }
    }
    if (tilesToRemove == 0) {
        return tiles;
    }
    else {
        var newTiles = new Array(tiles.length - tilesToRemove);
        for (var i = 0; i < newTiles.length; i++) {
            newTiles[i] = tiles[i];
        }
        return newTiles;
    }
}
document.getElementById('file').addEventListener('change', handleFileSelect, false);
document.getElementById('start').addEventListener('click', handleStart, false);
//# sourceMappingURL=app.js.map