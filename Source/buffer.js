/*
---
description: Buffer

license: MIT-style

authors: Olivier Gasc (gasc.olivier@gmail.com)

requires:
- Array
- Options
- Asset

provides: [Buffer]
...
*/

var Buffer = new Class({
    Implements: Options,

    buffer: {},

    options: {
        debug: false
    },

    initialize: function(options) {
        this.setOptions(options);
    },

    get: function(type, key) {
        if (key === undefined && this.buffer[type] !== undefined)
            return this.buffer[type];

        if (this.buffer[type] !== undefined && this.buffer[type][key] !== undefined)
            return this.buffer[type][key];

        return false;
    },

    add: function(bufferElement) {
        if (arguments.length > 1) {
            for (var i = 0, l = arguments.length; i < l; i++) {
                this.add(arguments[i]);
            }

            return this;
        }

        if (bufferElement.load === undefined)
            throw new Error('BufferElement passed to add must have a load method.');

        bufferElement.setBuffer(this);
        bufferElement.load();

        return this;
    },

    /**
     * Internal method
     */
    resolved: function(bufferResult) {
        if (this.buffer[bufferResult.type] === undefined)
            this.buffer[bufferResult.type] = {};

        for (var i in bufferResult.elements)
            this.buffer[bufferResult.type][i] = bufferResult.elements[i];

        if (bufferResult.resolve === undefined)
            throw new Error('BufferResult returned must have a resolve method.');

        return this;
    },

    remove: function(type, key) {
        if (key === undefined && this.buffer[type] !== undefined)
            delete this.buffer[type];

        if (this.buffer[type] !== undefined && this.buffer[type][key] !== undefined)
            delete this.buffer[type][key];

        return this;
    }
});

/**
 * Parent class of Buffer elements and results
 */
var BufferCommon = new Class({
    elements: {},
    buffer: null,
    type: null,
    fn: null,

    initialize: function(fn, type) {
        this.fn = fn || function() {};
        this.type = type || 'default';
    },

    setBuffer: function(buffer) {
        this.buffer = buffer;

        return this;
    }
});

/**
 * Extendable result class
 */
var BufferResult = new Class({
    Extends: BufferCommon,

    initialize: function(elements, fn, type) {
        this.parent(fn, type);

        for (var i in elements)
            this.elements[i] = elements[i];

        return this;
    },

    resolve: function() {
        this.buffer.resolved(this);

        return this.fn(this.elements, this.type);
    }
});

/**
 * Extendable source element class
 */
var BufferElement = new Class({
    Extends: BufferCommon,

    elements: [],

    initialize: function(elements, fn, type) {
        this.parent(fn, type);

        this.add(elements);
    },

    add: function(elements) {
        elements = elements instanceof Array ? elements : [elements];

        this.elements = this.elements.combine(elements);

        return this;
    },

    load: function() {
        return new BufferResult(this.elements, this.fn, this.type)
            .setBuffer(this.buffer)
            .resolve()
        ;
    },

    _getFilename: function(src) {
        var fileArray = src.split('/'),
            file = fileArray.pop(),
            filenameArray = file.split('.'),
            filename = filenameArray.shift();

        return filename;
    }
});

/**
 * Extended image source element class
 */
var BufferImage = new Class({
    Extends: BufferElement,

    initialize: function(elements, fn, type) {
        this.parent(elements, fn, type);
    },

    load: function() {
        var length = this.elements.length,
            loaded = {},
            count = 0,
            time = +new Date,
            filename;

        this.elements.each(function(src) {
            filename = this._getFilename(src);

            new Asset.image(src, {
                onLoad: function(el) {
                    loaded[filename] = el;

                    if (++count === length) {
                        return new BufferResult(
                            loaded,
                            this.fn,
                            this.type
                        ).setBuffer(this.buffer).resolve();
                    }
                }.bind(this),
                onError: function() {
                    if (this.buffer.options.debug)
                        console.error('Failed to load image', arguments);

                    if (++count === length)
                        return new BufferResult(loaded, this.type, this.fn);
                }.bind(this),
                onAbort: function() {
                    if (this.buffer.options.debug)
                        console.error('Loading image aborted', arguments);

                    if (++count === length)
                        return new BufferResult(loaded, this.type, this.fn);
                }.bind(this)
            });
        }.bind(this));
    }
});
