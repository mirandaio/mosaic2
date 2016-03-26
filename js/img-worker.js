self.addEventListener('message', function(e) {
  var imgData = e.data.imgData;
  var TILE_WIDTH = e.data.TILE_WIDTH;
  var TILE_HEIGHT = e.data.TILE_HEIGHT;
  var imgWidth = imgData.width;
  var imgHeight = imgData.height;
  var colorMatrix = [];
  var colorRow;
  var x, y;
  var tileWith, tileHeight;
  for(y = 0; y < imgHeight; y += TILE_HEIGHT) {
    tileHeight = getValidSize(y, imgData.height, TILE_HEIGHT);
    colorRow = [];
    for(x = 0; x < imgWidth; x += TILE_WIDTH) {
      tileWidth = getValidSize(x, imgData.width, TILE_WIDTH);
      colorRow.push(averageColor(imgData, x, y, tileWidth, tileHeight));
    }
    colorMatrix.push(colorRow);
  }
  self.postMessage(colorMatrix);
  self.close();
});

function averageColor(imgData, x, y, tileWidth, tileHeight) {
  var row, col;
  var data = imgData.data;
  var numPixels = tileWidth * tileHeight;
  var redTotal = 0, greenTotal = 0, blueTotal = 0;
  var redAvg, greenAvg, blueAvg;
  var canvasWidth = imgData.width;
  var index;
  for(row = y; row < y + tileHeight; row++) {
    for(col = x; col < x + tileWidth; col++) {
      index = 4 * (canvasWidth * row + col);
      redTotal += data[index];
      greenTotal += data[index + 1];
      blueTotal += data[index + 2];
    }
  }
  redAvg = getHexString(redTotal / numPixels);
  greenAvg = getHexString(greenTotal / numPixels);
  blueAvg = getHexString(blueTotal / numPixels);
  return redAvg + greenAvg + blueAvg;
}

function getValidSize(offset, canvasSize, tileSize) {
  return offset + tileSize > canvasSize ? canvasSize - offset : tileSize;
}

function getHexString(n) {
  n = Math.floor(n);
  return n < 16 ? '0' + n.toString(16) : n.toString(16);
}
