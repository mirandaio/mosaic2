(function(window, document) {
  window.onload = function() {
    var img = document.getElementById('source');
    var canvas = document.createElement('canvas');
    var container = document.getElementById('container');
    var button = document.getElementById('process');
    var dropZone = document.getElementById('drop-zone');

    document.querySelector('input').addEventListener('change', function(e) {
      setupUI(e.target.files[0], img, canvas, button, dropZone);
    });
    
    dropZone.addEventListener('drop', function(e) {
      setupUI(e.dataTransfer.files[0], img, canvas, button, dropZone);
    });

    dropZone.addEventListener('dragenter', function() {
      this.classList.remove('empty');
      this.classList.add('full');
    });

    dropZone.addEventListener('dragleave', function() {
      this.classList.remove('full');
      this.classList.add('empty');
    });
    
    button.addEventListener('click', function() {
      processPhoto(canvas, container);
    });
  };

  window.addEventListener('drop', function(e) {
    e.preventDefault();
  });

  window.addEventListener('dragover', function(e) {
    e.preventDefault();
  });

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

  function setupUI(file, img, canvas, button, dropZone) {
    setupImage(file, img).then(function() {
      setupCanvas(img, canvas);
      button.classList.remove('invisible');
      dropZone.classList.add('none');
    });
  }

  function setupImage(file, img) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function(e) {
        img.onload = function() {
          resolve();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function setupCanvas(img, canvas) {
    var ctx = canvas.getContext('2d');
    canvas.width = img.clientWidth;
    canvas.height = img.clientHeight;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  }
})(window, document);
