const HEADER_HEIGHT = 50;
const BACKGROUND_COLOR = "rgb(64, 61, 63)";
const TILE_WIDTH = 195;
const TILE_HEIGHT = 412;

let imageWidth = -1;
let imageHeight = -1;

class ImageRect {
    constructor(private _x: number, private _y: number, private _w: number, private _h: number) {
    }
    get x(): number {
        return this._x;
    }
    get y(): number {
        return this._y;
    }
    get w(): number {
        return this._w;
    }
    get h(): number {
        return this._h;
    }
}

function handleFileSelect(evt) {
    let files = evt.target.files;

    let output = [];
    let f = files[0];
    output.push('<li><strong>', encodeURI(f.name), '</strong> (', f.type || 'n/a', ') - ',
        f.size, ' bytes, last modified: ',
        f.lastModifiedDate.toLocaleDateString(), '</li>');
    document.getElementById('list').innerHTML = '<ul>' + output.join('') + '</ul>';

    const reader = new FileReader();
    reader.onload = function (e) {
        const preview = <HTMLImageElement>document.getElementById('preview')
        preview.src = reader.result;
        preview.width = 150;
    };
    reader.readAsDataURL(f)
}

function handleStart(event) {
    const canvas = <HTMLCanvasElement>document.getElementById("canvas");
    const preview = <HTMLImageElement>document.getElementById('preview')
    const context2d = canvas.getContext('2d');
    const image = new Image();
    image.src = preview.src;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    context2d.drawImage(preview, 0, 0);
    let target: HTMLCanvasElement;
    const radioList = <NodeListOf<HTMLInputElement>>document.getElementsByName('ratio');
    for (let i = 0; i < radioList.length; i++) {
        if (radioList[i].checked) {
            if (radioList[i].value == 'paper-vertically') {
                target = repatch(canvas, null, null, 1.414);
            } else if (radioList[i].value == 'paper-horizontally') {
                target = repatch(canvas, null, null, 0.707);
            } else if (radioList[i].value == 'row') {
                const rowSize = <HTMLInputElement>document.getElementById('rowSize');
                target = repatch(canvas, Number(rowSize.value), null, null);
            } else if (radioList[i].value == 'column') {
                const columnSize = <HTMLInputElement>document.getElementById('columnSize');
                target = repatch(canvas, null, Number(columnSize.value), null);
            }
        }
    }
    const png = target.toDataURL();
    const resultImage = (<HTMLImageElement>document.getElementById('result'));
    resultImage.src = png;
    resultImage.width = target.width;
    resultImage.height = target.height;
}

function repatch(source: HTMLCanvasElement, rowOption?: number, columnOption?: number, ratioOption?: number): HTMLCanvasElement {
    const items = split(source);
    let columnCount = 4;
    let rowCount = Math.floor(items.length / columnCount) + (items.length % columnCount > 0 ? 1 : 0);
    if (columnOption != undefined) {
        columnCount = columnOption;
        rowCount = items.length / columnCount + (items.length % columnCount > 0 ? 1 : 0);
    } else if (rowOption != undefined) {
        rowCount = rowOption;
        columnCount = Math.floor(items.length / rowCount) + (items.length % rowCount > 0 ? 1 : 0);
    } else {
        let minError = Number.MAX_VALUE;
        for (let i = 4; i <= items.length; i++) {
            let j = Math.floor(items.length / i) + (items.length % i > 0 ? 1 : 0);
            let ratio = (HEADER_HEIGHT + TILE_HEIGHT * j) / (i * TILE_WIDTH);
            if (Math.abs(ratio - ratioOption) < minError) {
                minError = Math.abs(ratio - ratioOption);
                columnCount = i;
                rowCount = Math.floor(j);
            }
        }
    }
    const target = <HTMLCanvasElement>document.createElement("canvas");
    target.width = TILE_WIDTH * columnCount;
    target.height = HEADER_HEIGHT + TILE_HEIGHT * rowCount;
    const target2d = target.getContext('2d');
    const source2d = source.getContext('2d');
    target2d.fillStyle = BACKGROUND_COLOR.toString();
    target2d.fillRect(0, 0, target.width, target.height);
    target2d.drawImage(source, 0, 0, TILE_WIDTH * 4, HEADER_HEIGHT, 0, 0, TILE_WIDTH * 4, HEADER_HEIGHT);
    for (let y = 0; y < rowCount; y++) {
        for (let x = 0; x < columnCount; x++) {
            let i = x + y * columnCount;
            if (i < items.length) {
                const item = items[i];
                target2d.drawImage(source, item.x, item.y, item.w, item.h, x * TILE_WIDTH, HEADER_HEIGHT + y * TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
            }
        }
    }
    return target;
}

function split(source: HTMLCanvasElement): ImageRect[] {
    const numY = (source.height - HEADER_HEIGHT) / TILE_HEIGHT;
    const numX = 6;
    const tiles: ImageRect[] = new Array(numX * numY);
    for (let y = 0; y < numY; y++) {
        for (let x = 0; x < numX; x++) {
            const index = numX * y + x;
            tiles[index] = new ImageRect(x * TILE_WIDTH, y * TILE_HEIGHT + HEADER_HEIGHT, TILE_WIDTH, TILE_HEIGHT);
        }
    }
    let tilesToRemove = 0;
    const context2d = source.getContext('2d');
    for (let i = tiles.length - 1; i >= 0; i--) {
        const tile = tiles[i];
        let grayPixels = 0;
        for (let x = 0; x < TILE_WIDTH; x++) {
            const color = context2d.getImageData(tile.x + x, tile.y + TILE_HEIGHT / 2, 1, 1).data;
            if (color[0] == 64 && color[1] == 61 && color[2] == 63 && color[3] == 255) {
                grayPixels++;
            }
        }
        if (grayPixels / tile.w < 0.9) {
            break;
        } else {
            tiles[i] = null;
            tilesToRemove++;
        }
    }
    if (tilesToRemove == 0) {
        return tiles;
    } else {
        const newTiles: ImageRect[] = new Array(tiles.length - tilesToRemove);
        for (let i = 0; i < newTiles.length; i++) {
            newTiles[i] = tiles[i];
        }
        return newTiles;
    }

}

document.getElementById('file').addEventListener('change', handleFileSelect, false);
document.getElementById('start').addEventListener('click', handleStart, false);