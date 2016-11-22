
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

Resolve.fetch = function( name, input, options )
{
  return Resolve.factory( name, function(model, defer, templateResolver)
  {
    var resolvedInput = ResolveInput( input, templateResolver );

    model.fetch( resolvedInput, options, function(instance)
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

Resolve.create = function( name, properties, dontSave, cascade, options )
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
      var instance = model.create( resolvedProperties, cascade, options );

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

Resolve.searchAt = function( name, index, url, paging, options, props )
{
  return Resolve.factory( name, function(model, defer, templateResolver)
  {
    var resolvedIndex = ResolveInput( index, templateResolver );
    var resolvedQuery = ResolveInput( url, templateResolver );
    var promise = model.searchAt( resolvedIndex, resolvedQuery, paging, options, props );

    promise.complete(function(result)
    {
      defer.resolve( result );
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

Resolve.ready = function( name )
{
  return Resolve.factory( name, function(model, defer, templateResolver)
  {
    model.Database.ready(function()
    {
      defer.resolve( model );
    });
  });
};
