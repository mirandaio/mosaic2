window.onload = function() {
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');
  var container = document.getElementById('container');
  var button = document.getElementById('process');

  document.querySelector('input').addEventListener('change', function(e) {
    setupImageAndCanvas(e, canvas, context, button, container);
  });

  button.addEventListener('click', function() {
    processPhoto(canvas, context, container);
  });
};

/**
 * Takes care of processing the uploaded photo. Inserts the rows of the mosaic
 * into the container.
 * @param {Canvas} canvas - a canvas element
 * @param {CanvasRenderingContext} context - the context of the canvas
 * @param {Div} container - a div element
*/
function processPhoto(canvas, context, container) {
  var y;
  var rowPromises = [];
  var canvasWidth = canvas.width;
  var canvasHeight = canvas.height;
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
    return getRow(context, rowIndex, canvasWidth, canvasHeight);
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
function getRow(context, y, canvasWidth, canvasHeight) {
  return new Promise(function(resolve, reject) {
    var x;
    var width, height;
    var tileData;
    var promises = [];
    for(x = 0; x < canvasWidth; x += TILE_WIDTH) {
      width = x + TILE_WIDTH > canvasWidth ? canvasWidth - x : TILE_WIDTH;
      height = y + TILE_HEIGHT > canvasHeight ? canvasHeight - y : TILE_HEIGHT;
      tileData = context.getImageData(x, y, width, height).data;
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
 * @returns {string} The average RGB values in hexadecimal format
*/
function averageColor(tileData) {
  var redAvg = average(tileData, 0);
  var greenAvg = average(tileData, 1);
  var blueAvg = average(tileData, 2);
  return redAvg + greenAvg + blueAvg;
}

/**
 * @param {Uint8ClampedArray} data - the RGBA values of a canvas tile
 * @param {Number} i - represents what color component to average
 * @returns {string} average value of the color component in hexadecimal
 */
function average(data, i) {
  var avg;
  var total = 0;
  var len = data.length;
  var numPixels = len / 4;
  while(i < len) {
    total += data[i];
    i+=4;
  }
  avg = Math.floor(total / numPixels);
  // Make sure the average is a two digit hexadecimal value
  return avg < 16 ? '0' + avg.toString(16) : avg.toString(16);
}

/**
 * Puts the data of the uploaded file into the image element, and into the
 * canvas element
*/
function setupImageAndCanvas(e, canvas, context, button, container) {
  var reader = new FileReader();
  reader.onload = function(evt) {
    var img = document.getElementById('source');
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
