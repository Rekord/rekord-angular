
// Config

QUnit.config.reorder = false;
QUnit.config.testTimeout = 30 * 1000;

Rekord.autoload = true;

Rekord.setOnline();

angular.module( 'rekord-test', [] )
  .run(function()
  {
    Rekord.store = function(database)
    {
      var store = Rekord.store[ database.name ];

      if ( !store )
      {
        store = Rekord.store[ database.name ] = new TestStore();
      }

      return store;
    };

    Rekord.live = function(database)
    {
      var live = Rekord.live[ database.name ];

      if ( !live )
      {
        live = Rekord.live[ database.name ] = new TestLive( database );
      }

      return live;
    };

    Rekord.rest = function(database)
    {
      var rest = Rekord.rest[ database.name ];

      if ( !rest )
      {
        rest = Rekord.rest[ database.name ] = new TestRest();
      }

      return rest;
    };

  })
;

angular.module( 'rekord-test-http', [] )
  .run(function()
  {
    Rekord.store = function(database)
    {
      var store = Rekord.store[ database.name ];

      if ( !store )
      {
        store = Rekord.store[ database.name ] = new TestStore();
      }

      return store;
    };

    Rekord.live = function(database)
    {
      var live = Rekord.live[ database.name ];

      if ( !live )
      {
        live = Rekord.live[ database.name ] = new TestLive( database );
      }

      return live;
    };

    Rekord.rest = Rekord.Angular.rest;
  })
  .factory('$http', function()
  {
    function $http(options)
    {
      $http.lastOptions = options;

      return {
        then: function(success, failure)
        {
          if ( $http.status === 200 )
          {
            success( {data: $http.result} );
          }
          else
          {
            failure( {data: $http.result, status: $http.status} );
          }
        }
      }
    }

    $http.status = 200;
    $http.result = null;

    angular.$http = $http;

    return $http;
  });
;

// Extra Assertions

function isInstance(model, Class, message)
{
  ok( model instanceof Class, message );
}

function isType(value, type, message)
{
  strictEqual( typeof value, type, message );
}

function hasModel(rekord, key, model, message)
{
  strictEqual( rekord.Database.get( key ), model, message );
}

// Utility Methods

function ngRouteInjector()
{
  $route = {current: {}};

  angular.module('ngRoute', []).constant('$route', $route);

  return angular.injector(['ng', 'ngMock', 'rekord', 'ngRoute', 'rekord-test']);
}

function uiRouterInjector()
{
  $stateParams = {};

  angular.module('ui.router', []).constant('$stateParams', $stateParams);

  return angular.injector(['ng', 'ngMock', 'rekord', 'ui.router', 'rekord-test']);
}

// Extending Assert

QUnit.assert.timer = function()
{
  return QUnit.assert.currentTimer = new TestTimer();
};

function TestTimer()
{
  this.callbacks = [];
  this.time = 0;
}

TestTimer.prototype =
{
  wait: function(millis, func)
  {
    var callbacks = this.callbacks;
    var at = millis + this.time;

    if ( callbacks[ at ] )
    {
      callbacks[ at ].push( func );
    }
    else
    {
      callbacks[ at ] = [ func ];
    }
  },
  run: function()
  {
    var callbacks = this.callbacks;

    for (var i = 0; i < callbacks.length; i++)
    {
      var calls = callbacks[ i ];

      this.time = i;

      if ( calls )
      {
        for (var k = 0; k < calls.length; k++)
        {
          calls[ k ]();
        }
      }
    }
  }
};

function wait(millis, func)
{
  QUnit.assert.currentTimer.wait( millis, func );
}

// Mock Angular Objects
function MockScope()
{
  this.listens = 0;
  this.evals = 0;
  this.destroys = 0;
  this.callback = null;
}

MockScope.prototype =
{
  $on: function(event, callback)
  {
    this.listens++;
    this.callback = callback;
  },

  $evalAsync: function(callback)
  {
    this.evals++;
    if (Rekord.isFunction(callback)) {
      callback();
    }
  },

  $digest: function()
  {
    this.evals++;
  },

  $destroy: function()
  {
    if ( this.callback )
    {
      this.destroys++;
      this.callback();
      this.callback = null;
    }
  }
};


// Rekord.store."database name".(put|remove|all)

function TestStore()
{
  this.map = new Rekord.Map();
  this.valid = true;
  this.delay = 0;
  this.lastKey = this.lastRecord = null;
}

TestStore.prototype =
{
  finishDelayed: function(success, failure, arg0, arg1)
  {
    var store = this;

    if ( store.delay > 0 )
    {
      wait( store.delay, function()
      {
        store.finish( success, failure, arg0, arg1 );

      });
    }
    else
    {
      store.finish( success, failure, arg0, arg1 );
    }
  },
  finish: function(success, failure, arg0, arg1)
  {
    if ( this.valid )
    {
      if ( success ) success( arg0, arg1 );
    }
    else
    {
      if ( failure ) failure( arg0, arg1 );
    }
  },
  get: function(key, success, failure)
  {
    this.lastKey = key;

    var map = this.map;
    function onGet()
    {
      var model = map.get( key );
      if ( model ) {
        success.call( this, key, model );
      } else {
        failure.apply( this );
      }
    }

    this.finishDelayed( onGet, failure );
  },
  save: function(model, success, failure)
  {
    this.put( model.$key(), model, success, failure );
  },
  put: function(key, record, success, failure)
  {
    this.lastKey = key;
    this.lastRecord = record;

    var map = this.map;
    function onPut()
    {
      map.put( key, record );
      success.apply( this, arguments );
    }

    this.finishDelayed( onPut, failure, key, record );
  },
  remove: function(key, success, failure)
  {
    this.lastKey = key;

    var map = this.map;
    var removed = map.get( key );
    function onRemove()
    {
      map.remove( key );
      success.apply( this, arguments );
    }

    this.finishDelayed( onRemove, failure, key, removed );
  },
  all: function(success, failure)
  {
    this.finishDelayed( success, failure, this.map.values, this.map.keys );
  }
};


// Rekord.live."database name".(save|remove)

function TestLive(database)
{
  this.database = database;
  this.onHandleMessage = null;
  this.lastMessage = null;
}

TestLive.prototype =
{
  save: function(model, data)
  {
    this.lastMessage = {
      op: 'SAVE',
      key: model.$key(),
      model: data
    };

    if ( this.onHandleMessage )
    {
      this.onHandleMessage( this.lastMessage );
    }
  },
  remove: function(model)
  {
    this.lastMessage = {
      op: 'REMOVE',
      key: model.$key()
    };

    if ( this.onHandleMessage )
    {
      this.onHandleMessage( this.lastMessage );
    }
  },
  liveSave: function(data)
  {
    var key = this.database.keyHandler.buildKeyFromInput( data );

    this.database.liveSave( key, data );
  },
  liveRemove: function(input)
  {
    var key = this.database.keyHandler.buildKeyFromInput( input );

    this.database.liveRemove( key );
  }
};

// Rekord.rest."database name".(all|create|update|remove)

function TestRest()
{
  this.map = new Rekord.Map();
  this.queries = new Rekord.Map();
  this.status = 200;
  this.returnValue = false;
  this.delay = 0;
  this.lastModel = this.lastRecord = this.lastOptions = null;
}

TestRest.prototype =
{
  finishDelayed: function(success, failure, returnValue)
  {
    var rest = this;

    if ( rest.delay > 0 )
    {
      wait( rest.delay, function()
      {
        rest.finish( success, failure, returnValue );

      });
    }
    else
    {
      rest.finish( success, failure, returnValue );
    }
  },
  finish: function(success, failure, returnValue)
  {
    var offline = !Rekord.online || Rekord.forceOffline;
    var status = offline ? 0 : this.status;
    var successful = status >= 200 && status < 300;
    var returnedValue = this.returnValue || returnValue;

    if ( successful )
    {
      if ( success ) success( returnedValue, status );
    }
    else
    {
      if ( failure ) failure( returnedValue, status );
    }
  },
  get: function(model, options, success, failure)
  {
    this.lastModel = model;
    this.lastOptions = options;

    var map = this.map;
    function onGet()
    {
      var cached = map.get( model.$key() );
      if ( cached ) {
        success.call( this, cached );
      } else {
        failure.call( this, null, -1 );
      }
    }

    this.finishDelayed( onGet, failure, null );
  },
  create: function(model, encoded, options, success, failure)
  {
    this.lastModel = model;
    this.lastRecord = encoded;
    this.lastOptions = options;

    var map = this.map;
    function onCreate()
    {
      map.put( model.$key(), encoded );
      success.apply( this, arguments );
    }

    this.finishDelayed( onCreate, failure, {} );
  },
  update: function(model, encoded, options, success, failure)
  {
    this.lastModel = model;
    this.lastRecord = encoded;
    this.lastOptions = options;

    var map = this.map;
    function onUpdate()
    {
      var existing = map.get( model.$key() );
      Rekord.transfer( encoded, existing );
      success.apply( this, arguments );
    }

    this.finishDelayed( onUpdate, failure, {} );
  },
  remove: function(model, options, success, failure)
  {
    this.lastModel = model;
    this.lastOptions = options;

    var map = this.map;
    function onRemove()
    {
      map.remove( model.$key() );
      success.apply( this, arguments );
    }

    this.finishDelayed( onRemove, failure, {} );
  },
  all: function(options, success, failure)
  {
    this.lastOptions = options;

    this.finishDelayed( success, failure, this.map.values );
  },
  query: function(url, query, options, success, failure)
  {
    this.lastOptions = options;

    this.finishDelayed( success, failure, this.queries.get( url ) );
  }
};
