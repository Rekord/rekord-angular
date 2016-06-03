(function (global, Rekord, ng, app, undefined)
{

  var isFunction = Rekord.isFunction;
  var isString = Rekord.isString;
  var isArray = Rekord.isArray;
  var isObject = Rekord.isObject;
  var isBoolean = Rekord.isBoolean;
  var isRekord = Rekord.isRekord;
  var isEmpty = Rekord.isEmpty;

  var format = Rekord.format;
  var bind = Rekord.bind;

  var Resolve = {};
  var Factory = {};

  ng.isArray = function(a)
  {
    return a instanceof Array;
  };


function removeTrailingSlash(x)
{
  return x.charAt(x.length - 1) === '/' ? x.substring(0, x.length - 1) : x;
}

function InitializeRekord($http, $filter)
{
  function execute( method, data, url, success, failure, offlineValue )
  {
    Rekord.debug( Rekord.Debugs.REST, this, method, url, data );

    if ( Rekord.forceOffline )
    {
      failure( offlineValue, 0 );
    }
    else
    {
      var onRestSuccess = function(response)
      {
        success( response.data );
      };

      var onRestError = function(response)
      {
        failure( response.data, response.status );
      };

      var options =
      {
        method: method,
        data: data,
        url: url
      };

      $http( options ).then( onRestSuccess, onRestError );
    }
  }

  function RestFactory(database)
  {
    return {
      all: function( success, failure )
      {
        execute( 'GET', undefined, database.api, success, failure, [] );
      },
      get: function( model, success, failure )
      {
        execute( 'GET', undefined, removeTrailingSlash( database.api + model.$key() ), success, failure );
      },
      create: function( model, encoded, success, failure )
      {
        execute( 'POST', encoded, removeTrailingSlash( database.api ), success, failure, {} );
      },
      update: function( model, encoded, success, failure )
      {
        execute( 'PUT', encoded, removeTrailingSlash( database.api + model.$key() ), success, failure, {} );
      },
      remove: function( model, success, failure )
      {
        execute( 'DELETE', undefined, removeTrailingSlash( database.api + model.$key() ), success, failure, {} );
      },
      query: function( url, data, success, failure )
      {
        var method = isEmpty( data ) ? 'GET' : 'POST';

        execute( method, data, url, success, failure );
      }
    };
  }

  function formatDate(date, format)
  {
    return $filter('date')( date, format );
  }

  Rekord.setRest( RestFactory );
  Rekord.listenToNetworkStatus();

  Rekord.formatDate = formatDate;
}

function Sync( scope, target, callback )
{
  if ( !(this instanceof Sync) )
  {
    return new Sync( scope, target, callback );
  }

  this.scope = scope;
  this.target = target;
  this.callback = callback;

  this.on();
}

Sync.prototype =
{
  on: function()
  {
    var target = this.target;

    if ( isRekord( target ) )
    {
      target = this.target = target.Database;
    }

    var targetFunction = target.$change ? '$change' : 'change';

    if ( target[ targetFunction ] )
    {
      this.off = target[ targetFunction ]( this.notify, this );

      this.scope.$on( '$destroy', this.off );
    }
  },
  notify: function()
  {
    // $digest would be better for performance - but there's no official way
    // to see if a digest cycle is currently running
    this.scope.$evalAsync();

    if ( isFunction( this.callback ) )
    {
      this.callback.apply( this.target );
    }

    Rekord.debug( Rekord.Debugs.ScopeDigest, this, this.scope );
  }
};


function Select(source, select, fill)
{
  this.$onRemove  = bind( this, this.$handleRemove );
  this.$onRemoves = bind( this, this.$handleRemoves );
  this.$onCleared = bind( this, this.$handleCleared );
  this.$onReset   = bind( this, this.$handleReset );

  this.$reset( source );
  this.$select( select, fill );
}

Select.prototype =
{

  $reset: function(source)
  {
    if ( this.$source !== source )
    {
      if ( this.$source )
      {
        this.$disconnect();
      }

      this.$source = source;
      this.$connect();
    }
  },

  $connect: function()
  {
    this.$source.on( Rekord.Collection.Events.Remove, this.$onRemove );
    this.$source.on( Rekord.Collection.Events.Removes, this.$onRemoves );
    this.$source.on( Rekord.Collection.Events.Cleared, this.$onCleared );
    this.$source.on( Rekord.Collection.Events.Reset, this.$onReset );
  },

  $disconnect: function()
  {
    this.$source.off( Rekord.Collection.Events.Remove, this.$onRemove );
    this.$source.off( Rekord.Collection.Events.Removes, this.$onRemoves );
    this.$source.off( Rekord.Collection.Events.Cleared, this.$onCleared );
    this.$source.off( Rekord.Collection.Events.Reset, this.$onReset );
  },

  $select: function(select, fill)
  {
    if ( isArray( select ) )
    {
      var db = this.$source.database;
      var remove = {};

      for (var key in this)
      {
        if ( isBoolean( this[ key ] ) )
        {
          remove[ key ] = this[ key ];
        }
      }

      for (var i = 0; i < select.length; i++)
      {
        var key = db.buildKeyFromInput( select[ i ] );

        this[ key ] = true;

        delete remove[ key ];
      }

      for (var key in remove)
      {
        delete this[ key ];
      }

      if ( fill )
      {
        var keys = this.$source.keys();

        for (var i = 0; i < keys.length; i++)
        {
          var key = keys[ i ];

          if ( !this[ key ] )
          {
            this[ key ] = false;
          }
        }
      }

    }
  },

  $selection: function(out)
  {
    var source = this.$source;
    var selection = out || [];

    for (var key in this)
    {
      if ( this[ key ] === true )
      {
        var model = source.get( key );

        if ( model )
        {
          selection.push( model );
        }
      }
    }

    return selection;
  },

  $handleRemove: function(removed)
  {
    var db = this.$source.database;
    var key = db.buildKeyFromInput( removed );

    delete this[ key ];
  },

  $handleRemoves: function(removed)
  {
    for (var i = 0; i < removed.length; i++)
    {
      this.$handleRemove( removed[i] );
    }
  },

  $handleCleared: function()
  {
    for (var key in this)
    {
      if ( isBoolean( this[ key ] ) )
      {
        delete this[ key ];
      }
    }
  },

  $handleReset: function()
  {
    var source = this.$source;

    for (var key in this)
    {
      if ( isBoolean( this[ key ] ) )
      {
        if ( !source.has( key ) )
        {
          delete this[ key ];
        }
      }
    }
  }
};

Rekord.ModelCollection.prototype.selectable = function(select, fill)
{
  return new Select( this, select, fill );
};


function hasModule(moduleName)
{
  if ( moduleName in hasModule.tested )
  {
    return hasModule.tested[ moduleName ];
  }

  try
  {
    ng.module( moduleName );

    hasModule.tested[ moduleName ] = true;
  }
  catch (e)
  {
    hasModule.tested[ moduleName ] = false;
  }

  return hasModule.tested[ moduleName ];
}

hasModule.tested = {};

function getRouteParameter()
{
  return getRouteParameter.cached ? getRouteParameter.cached : getRouteParameter.cached =
    ( hasModule( 'ui.router' ) ? '$stateParams' :
      ( hasModule( 'ngRoute' ) ? '$route' :
        false ) );
}

function buildParamResolver()
{
  if ( hasModule( 'ui.router') )
  {
    return function($stateParams)
    {
      return $stateParams;
    };
  }
  else if ( hasModule( 'ngRoute') )
  {
    return function($route)
    {
      return $route.current;
    };
  }
  return function()
  {
    return false;
  };
}

function buildTemplateResolver(routeParams)
{
  return function(text)
  {
    if ( isString( text ) && routeParams )
    {
      return format( text, routeParams );
    }

    return text;
  };
}

getRouteParameter.cached = null;

Resolve.factory = function( name, callback )
{
  var param = getRouteParameter();
  var paramResolver = buildParamResolver();
  var cache = false;
  var cachedValue = void 0;

  function factory($q, routing)
  {
    var defer = $q.defer();

    if ( cachedValue !== void 0 )
    {
      defer.resolve( cachedValue );
    }
    else
    {
      var routeParams = paramResolver( routing );
      var templateResolver = buildTemplateResolver( routeParams );

      if ( cache )
      {
        defer.promise.then(function(resolvedValue)
        {
          cachedValue = resolvedValue;
        });
      }

      Rekord.get( name ).success(function(model)
      {
        callback( model, defer, templateResolver );
      });
    }

    return defer.promise;
  }

  factory.$inject = ['$q'];

  if ( param )
  {
    factory.$inject.push( param );
  }

  factory.cache = function()
  {
    cache = true;

    return factory;
  };

  factory.inject = function()
  {
    for (var i = 0; i < arguments.length; i++)
    {
      var arg = arguments[ i ];

      if ( isArray( arg ) )
      {
        factory.$inject.push.apply( factory.$inject, arg );
      }
      else
      {
        factory.$inject.push( arg );
      }
    }

    return factory;
  };

  return factory;
};

function ResolveInput(obj, resolver)
{
  if ( isObject( obj ) )
  {
    var resolved = {};

    for (var prop in obj)
    {
      resolved[ prop ] = resolver( obj[ prop ] );
    }

    return resolved;
  }

  return resolver( obj );
}

Resolve.model = function( name, input )
{
  return Resolve.factory( name, function(model, defer, templateResolver)
  {
    var resolvedInput = ResolveInput( input, templateResolver );

    model.Database.grabModel( resolvedInput, function(instance)
    {
      if ( instance )
      {
        defer.resolve( instance );
      }
      else
      {
        defer.reject();
      }
    });
  });
};

Resolve.fetch = function( name, input )
{
  return Resolve.factory( name, function(model, defer, templateResolver)
  {
    var resolvedInput = ResolveInput( input, templateResolver );

    model.fetch( resolvedInput, function(instance)
    {
      defer.resolve( instance );
    });
  });
};

Resolve.fetchAll = function( name )
{
  return Resolve.factory( name, function(model, defer, templateResolver)
  {
    model.fetchAll(function(models)
    {
      defer.resolve( models );
    });
  });
};

Resolve.grab = function( name, input )
{
  return Resolve.factory( name, function(model, defer, templateResolver)
  {
    var resolvedInput = ResolveInput( input, templateResolver );

    model.grab( resolvedInput, function(instance)
    {
      defer.resolve( instance );
    });
  });
};

Resolve.grabAll = function( name )
{
  return Resolve.factory( name, function(model, defer, templateResolver)
  {
    model.grabAll(function(models)
    {
      defer.resolve( models );
    });
  });
};

Resolve.create = function( name, properties, dontSave )
{
  return Resolve.factory( name, function(model, defer, templateResolver)
  {
    var resolvedProperties = ResolveInput( properties, templateResolver );

    if ( dontSave )
    {
      defer.resolve( new model( resolvedProperties ) );
    }
    else
    {
      var instance = model.create( resolvedProperties );

      if ( instance.$isSaved() )
      {
        defer.resolve( instance );
      }
      else
      {
        instance.$once( Rekord.Model.Events.RemoteSaves, function()
        {
          defer.resolve( instance );
        });
      }
    }
  });
};

Resolve.search = function( name, url, options, props )
{
  return Resolve.factory( name, function(model, defer, templateResolver)
  {
    var resolvedQuery = ResolveInput( url, templateResolver );
    var remoteQuery = model.search( resolvedQuery, options, props, true );

    remoteQuery.$promise.success(function()
    {
      defer.resolve( remoteQuery );
    });

    remoteQuery.$promise.failure(function()
    {
      defer.reject();
    });
  });
};

Resolve.all = function( name )
{
  return Resolve.factory( name, function(model, defer, templateResolver)
  {
    model.Database.ready(function()
    {
      defer.resolve( model.all() );
    });
  });
};

Resolve.where = function( name, whereProperties, whereValue, whereEquals )
{
  return Resolve.factory( name, function(model, defer, templateResolver)
  {
    var resolvedWhereProperties = ResolveInput( whereProperties, templateResolver );
    var resolvedWhereValue = ResolveInput( whereValue, templateResolver );

    model.Database.ready(function()
    {
      defer.resolve( model.all().filtered( resolvedWhereProperties, resolvedWhereValue, whereEquals ) );
    });
  });
};

Factory.helper = function(name, impl)
{
  var ref = null;

  Rekord.get( name ).success(function(rekord)
  {
    ref = rekord;
  });

  return function FactoryImplementation()
  {
    if ( !ref )
    {
      throw name + ' Rekord failed to load or does not exist.';
    }

    return impl( ref );
  };
};

Factory.search = function(name, url, options, props, run, paged)
{
  return Factory.helper( name, function(model)
  {
    return paged ?
      model.searchPaged( url, options, props, run ) :
      model.search( url, options, props, run );
  });
};

Factory.ref = function(name, callback, context)
{
  return Factory.helper( name, function(model)
  {
    return model;
  });
};

Factory.lazyLoad = function(name, callback, context)
{
  var initialized = {};

  return Factory.helper( name, function(model)
  {
    if ( !model.Database.remoteLoaded && !(name in initialized) )
    {
      initialized[ name ] = true;

      model.Database.refresh( callback, context );
    }

    return model;
  });
};

Factory.filtered = function(name, where, value, equals)
{
  return Factory.helper( name, function(model)
  {
    return model.filtered( where, value, equals );
  });
};

Factory.all = function(name)
{
  return Factory.helper( name, function(model)
  {
    return model.all();
  });
};

Factory.fetchAll = function(name, callback, context)
{
  return Factory.helper( name, function(model)
  {
    return model.fetchAll( callback, context );
  });
};

Factory.grabAll = function(name, callback, context)
{
  return Factory.helper( name, function(model)
  {
    return model.grabAll( callback, context );
  });
};


function ModelFilter()
{
  return function filterModels(models)
  {
    if ( !models || !models.toArray )
    {
      return models;
    }

    var array = models.toArray();
    var ids = {};

    for (var i = 0; i < array.length; i++)
    {
      var model = array[ i ];

      if ( !model.$key || model.$key() in ids )
      {
        array.splice( i--, 1 );
      }
      else
      {
        ids[ model.$key() ] = model;
      }
    }

    return array;
  };
}


  app
    .run( ['$http', '$filter', InitializeRekord] )
    .filter( 'models', ModelFilter )
  ;

  Rekord.Bind = Sync;
  Rekord.Sync = Sync;
  Rekord.Resolve = Resolve;
  Rekord.Select = Select;
  Rekord.Factory = Factory;
  Rekord.Debugs.ScopeDigest = 100000;

})( this, this.Rekord, this.angular, this.angular.module('rekord', []) );
