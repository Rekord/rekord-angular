(function (global, Rekord, ng, app, undefined)
{

  var isFunction = Rekord.isFunction;
  var isString = Rekord.isString;
  var isArray = Rekord.isArray;
  var isObject = Rekord.isObject;
  var isBoolean = Rekord.isBoolean;
  var isRekord = Rekord.isRekord;

  var format = Rekord.format;
  var bind = Rekord.bind;

  var Resolve = {};
  var Factory = {};

  ng.isArray = function(a)
  {
    return a instanceof Array;
  };
