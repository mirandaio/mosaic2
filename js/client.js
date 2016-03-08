(function(window) {
  window.onload = function() {
    var img = document.getElementById('source');
    var canvas = document.createElement('canvas');
    var container = document.getElementById('container');
    var button = document.getElementById('process');

    document.querySelector('input').addEventListener('change', function(e) {
      setupImageAndCanvas(e, img, canvas, button);
    });

    button.addEventListener('click', function() {
      processPhoto(canvas, container);
    });
  };

  /**
   * Takes care of processing the uploaded photo. Inserts the rows of the
   * mosaic into the container.
   * @param {Canvas} canvas - a canvas element
   * @param {CanvasRenderingContext} context - the context of the canvas
   * @param {Div} container - a div element
   */
  function processPhoto(canvas, container) {
    var y;
    var canvasHeight = canvas.height;
    var rowPromises = [];
    var rowIndexes = [];
    // remove childs from container, if any
    while(container.firstChild) {
      container.removeChild(container.firstChild);
    }
    // Store all the row indexes into rowIndexes
    for(y = 0; y < canvasHeight; y += TILE_HEIGHT) {
      rowIndexes.push(y);
    }

    // Start the getRow promises all at once and display their
    // resolved values as soon they become available maintaining order
    rowIndexes.map(function(rowIndex) {
      return getRow(canvas, rowIndex);
    }).reduce(function(sequence, rowPromise) {
      return sequence.then(function() {
        return rowPromise.then(function(row) {
          container.appendChild(row);
        });
      });
    }, Promise.resolve());
  }

  /**
   * Returns a promise that resolves to a div element containing all the tiles
   * for a particular row.
   * @param {CanvasRenderingContext} context - The context of a canvas
   * @param {Number} y - the vertical position of a row relative to the canvas
   * @param {Number} canvasWidth - the width of the canvas
   * @param {Number} canvasHeight - the height of the canvas
   */
  function getRow(canvas, y) {
    return new Promise(function(resolve, reject) {
      var x;
      var tileData;
      var tileWidth;
      var tileHeight = getValidSize(y, canvasHeight, TILE_HEIGHT);
      var canvasWidth = canvas.width;
      var canvasHeight = canvas.height;
      var context = canvas.getContext('2d');
      var promises = [];
      for(x = 0; x < canvasWidth; x += TILE_WIDTH) {
        tileWidth = getValidSize(x, canvasWidth, TILE_WIDTH);
        tileData = context.getImageData(x, y, tileWidth, tileHeight).data;
        promises.push(getTile(tileData));
      }
      Promise.all(promises).then(function(tiles) {
        var row = document.createElement('div');
        row.innerHTML = tiles.join('');
        resolve(row);
      });
    });
  }

  /**
   * Computes a tile size that makes a tile with offset fit within canvasSize
   * @param {Number} offset - The offset of the tile relative to the canvas
   * @param {Number} canvasSize - the canvas size
   * @param {Number} tileSize - the max posible value for the tile
   */
  function getValidSize(offset, canvasSize, tileSize) {
    return offset + tileSize > canvasSize ? canvasSize - offset : tileSize;
  }

  /**
   * Computes the average color of a canvas tile and returns a promise that
   * resolves when the HTTP call to get the SVG tile completes
   * @param {Uint8ClampedArray} tileData - the RGBA values of a canvas tile
   */
  function getTile(tileData) {
    return new Promise(function(resolve, reject) {
      var avgColor = averageColor(tileData);
      var xhr = new XMLHttpRequest();
      xhr.open('GET', '/color/' + avgColor);
      xhr.onload = function() {
        resolve(xhr.responseText);
      };
      xhr.send();
    });
  }

  /**
   * @param {Uint8ClampedArray} tileData - the RGBA values of a canvas tile
   * @returns {String} The average RGB values in hexadecimal format
   */
  function averageColor(tileData) {
    var len = tileData.length;
    var numPixels = len / 4;
    var redTotal = 0, greenTotal = 0, blueTotal = 0;
    var redAvg, greenAvg, blueAvg;
    var i;
    for(i = 0; i < len; i+=4) {
      redTotal += tileData[i];
      greenTotal += tileData[i+1];
      blueTotal += tileData[i+2];
    }
    redAvg = getHexString(redTotal / numPixels);
    greenAvg = getHexString(greenTotal / numPixels);
    blueAvg = getHexString(blueTotal / numPixels);
    return redAvg + greenAvg + blueAvg;
  }

  /**
   * @param {Number} n - a Number in the range of 0-255
   * @returns {String} a two digit hexidecimal string
   */
  function getHexString(n) {
    n = Math.floor(n);
    return n < 16 ? '0' + n.toString(16) : n.toString(16);
  }

  /**
   * Puts the data of the uploaded file into the image element, and into the
   * canvas element
   */
  function setupImageAndCanvas(e, img, canvas, button) {
    var reader = new FileReader();
    var context = canvas.getContext('2d');
    reader.onload = function(evt) {
      img.onload = function() {
        canvas.width = img.clientWidth;
        canvas.height = img.clientHeight;
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        button.classList.remove('invisible');
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
  }
})(window);
