// UMD (Universal Module Definition)
(function (root, factory)
{
  if (typeof define === 'function' && define.amd) // jshint ignore:line
  {
    // AMD. Register as an anonymous module.
    define(['Rekord', 'angular'], function(Rekord, angular) { // jshint ignore:line
      return factory(root, Rekord, angular);
    });
  }
  else if (typeof module === 'object' && module.exports)  // jshint ignore:line
  {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory(global, require('Rekord'), require('angular'));  // jshint ignore:line
  }
  else
  {
    // Browser globals (root is window)
    root.Rekord = factory(root, root.Rekord, root.angular);
  }
}(this, function(global, Rekord, ng, undefined)
{

  var app = ng.module('rekord', []);

  var isFunction = Rekord.isFunction;
  var isString = Rekord.isString;
  var isArray = Rekord.isArray;
  var isObject = Rekord.isObject;
  var isBoolean = Rekord.isBoolean;
  var isRekord = Rekord.isRekord;
  var isEmpty = Rekord.isEmpty;

  var format = Rekord.format;
  var bind = Rekord.bind;
  var noop = Rekord.noop;
  var transfer = Rekord.transfer;

  var Rekord_rest = Rekord.rest;

  var Resolve = {};
  var Factory = {};

  ng.isArray = function(a)
  {
    return a instanceof Array;
  };
