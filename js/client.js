(function(window, document) {
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
    var ctx = canvas.getContext('2d');
    var canvasHeight = canvas.height;
    var imgData = ctx.getImageData(0, 0, canvas.width, canvasHeight);
    var rowPromises = [];
    // remove childs from container, if any
    while(container.firstChild) {
      container.removeChild(container.firstChild);
    }
    // fire up the getRow promises in parallel
    for(y = 0; y < canvasHeight; y += TILE_HEIGHT) {
      rowPromises.push(getRow(imgData, y));
    }

    // display the row promises resolved values as soon they become available
    // maintaining order
    rowPromises.reduce(function(sequence, rowPromise) {
      return sequence.then(function() {
        return rowPromise.then(function(row) {
          container.appendChild(row);
        });
      });
    }, Promise.resolve());
  }

  function getRow(imgData, y) {
    return new Promise(function(resolve, reject) {
      var rowWorker = new Worker('js/row-worker.js');

      rowWorker.addEventListener('message', function(e) {
        var row = document.createElement('div');
        row.innerHTML = e.data.join('');
        resolve(row);
      });

      rowWorker.postMessage({
        imgData: imgData,
        TILE_WIDTH: TILE_WIDTH,
        TILE_HEIGHT: TILE_HEIGHT,
        y: y
      });
    });
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
})(window, document);
