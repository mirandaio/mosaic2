self.addEventListener('message', function(e) {
  var x;
  var y = e.data.y;
  var imgData = e.data.imgData;
  var canvasWidth = imgData.width;
  var TILE_WIDTH = e.data.TILE_WIDTH;
  var TILE_HEIGHT = e.data.TILE_HEIGHT;
  var tileHeight = getValidSize(y, imgData.height, TILE_HEIGHT);
  var tileWidth;
  var promises = [];

  for(x = 0; x < canvasWidth; x += TILE_WIDTH) {
    tileWidth = getValidSize(x, canvasWidth, TILE_WIDTH);
    promises.push(getTile(imgData, x, y, tileWidth, tileHeight));
  }

  Promise.all(promises).then(function(tiles) {
    self.postMessage(tiles);
    self.close();
  });
});

function getTile(imgData, x, y, tileWidth, tileHeight) {
  return new Promise(function(resolve, reject) {
    var avgColor = averageColor(imgData, x, y, tileWidth, tileHeight);
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/color/' + avgColor);
    xhr.onload = function() {
      resolve(xhr.responseText);
    };
    xhr.send();
  });
}

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
