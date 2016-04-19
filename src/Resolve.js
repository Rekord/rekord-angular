
function hasModule(moduleName)
{
  if ( moduleName in hasModule.tested )
  {
    return hasModule.tested[ moduleName ];
  }

  try
  {
    angular.module( moduleName );

    return hasModule.tested[ moduleName ] = true;
  }
  catch (e)
  {
    return hasModule.tested[ moduleName ] = false;
  }
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
    if ( Rekord.isString( text ) && routeParams )
    {
      return Rekord.format( text, routeParams );
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

      Rekord.get( name, function(model)
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

      if ( Rekord.isArray( arg ) )
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
  if ( Rekord.isObject( obj ) )
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

Resolve.search = function( name, query, props )
{
  return Resolve.factory( name, function(model, defer, templateResolver)
  {
    var resolvedQuery = ResolveInput( query, templateResolver );
    var remoteQuery = model.search( resolvedQuery );

    if ( Rekord.isObject( props ) )
    {
      Rekord.transfer( props, remoteQuery );
    }

    remoteQuery.$run();

    remoteQuery.$success(function()
    {
      defer.resolve( remoteQuery );
    });

    remoteQuery.$failure(function()
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
