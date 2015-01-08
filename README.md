buffer v2
===========

Buffer class using Mootools
More extendable compared to the previous version


How to
----------

  var buffer = new Buffer({ debug: true });

  var imagesToLoad = new BufferImage(
    'https://www.google.fr/images/srpr/logo11w.png',
    function(elements, type) {
        console.log('images loaded !', buffer.get('loadedImages', 'logo11w'));
    },
    'loadedImages'
  );

  var canvas = new Element('canvas').set({ width: 100, height: 100 });

  var canvasToLoad = new BufferElement(
    canvas,
    function() {
        console.log('canvas loaded !', buffer.get('loadedCanvas')[0].getContext('2d'));
    },
    'loadedCanvas'
  );

  buffer.add(
    imagesToLoad,
    canvasToLoad
  );