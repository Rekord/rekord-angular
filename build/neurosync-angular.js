(function (app, global, undefined)
{

  var NeuroSettings = {
    debug: false
  };

  var NeuroResolve = {

  };

  app
    .constant( 'NeuroResolve', NeuroResolve )
    .constant( 'NeuroSettings', NeuroSettings )
    .factory( 'Neuro', ['$http', NeuroFactory] )
    .factory( 'NeuroBind', NeuroBindFactory )
  ;

  global.NeuroBind = NeuroBind;
  global.NeuroResolve = NeuroResolve;

  function NeuroFactory($http)
  {

    Neuro.rest = function(database)
    {

      function execute( method, data, url, success, failure, offlineValue )
      {
        Neuro.debug( Neuro.Debugs.REST, this, method, url, data );

        if ( Neuro.forceOffline )
        {
          failure( offlineValue, 0 );
        }
        else
        {
          function onRestSuccess(response) 
          {
            success( response.data );
          }

          function onRestError(response) 
          {
            failure( response.data, response.status );
          }

          var options = 
          {
            method: method,
            data: data,
            url: url
          };

          $http( options ).then( onRestSuccess, onRestError );
        }
      }
      
      return {
        all: function( success, failure )
        {
          execute( 'GET', undefined, database.api, success, failure, [] );
        },
        get: function( model, success, failure )
        {
          execute( 'GET', undefined, database.api + model.$key(), success, failure );
        },
        create: function( model, encoded, success, failure )
        {
          execute( 'POST', encoded, database.api, success, failure, {} );
        },
        update: function( model, encoded, success, failure )
        {
          execute( 'PUT', encoded, database.api + model.$key(), success, failure, {} );
        },
        remove: function( model, success, failure )
        {
          execute( 'DELETE', undefined, database.api + model.$key(), success, failure, {} );
        },
        query: function( query, success, failure )
        {
          var method = query.method || 'GET';
          var data = query.data || undefined;
          var url = query.url || query;

          execute( method, data, url, success, failure );
        }
      };

    };

    var Neuro_debug = Neuro.debug;

    Neuro.debug = function()
    {
      if ( NeuroSettings.debug )
      {
        Neuro_debug.apply( this, arguments );
      }
    };

    Neuro.Debugs.ScopeEval = 100000;

    Neuro.listenToNetworkStatus();

    return Neuro;
  }

  function NeuroBindFactory()
  {
    return NeuroBind;
  }

  function NeuroBind( scope, target, callback )
  {
    if ( !(this instanceof NeuroBind) ) return new NeuroBind( scope, target, callback );

    this.scope = scope;
    this.target = target;
    this.callback = callback;

    this.notify = this.newNotification();
    this.release = this.newRelease();
    
    this.on();
  }

  NeuroBind.Events = 
  {
    Database: 'updated',
    Model: 'saved removed remote-update relation-update',
    Collection: 'add adds sort remove reset',
    Page: 'change',
    Scope: '$destroy'
  };

  NeuroBind.prototype = 
  {
    on: function()
    {
      if ( Neuro.isNeuro( this.target ) )
      {
        this.target = this.target.Database;
      }

      if ( this.target instanceof Neuro.Database )
      {
        this.target.on( NeuroBind.Events.Database, this.notify  );
      }
      else if ( this.target instanceof Neuro.Model )
      {
        this.target.$on( NeuroBind.Events.Model, this.notify );
      }
      else if ( this.target instanceof Neuro.Collection )
      {
        this.target.on( NeuroBind.Events.Collection, this.notify );
      }
      else if ( this.target instanceof Neuro.Page )
      {
        this.target.on( NeuroBind.Events.Page, this.notify );
      }

      this.scope.$on( NeuroBind.Events.Scope, this.release );
    },
    off: function()
    {
      if ( this.target instanceof Neuro.Database )
      {
        this.target.off( NeuroBind.Events.Database, this.notify );
      }
      else if ( this.target instanceof Neuro.Model )
      {
        this.target.$off( NeuroBind.Events.Model, this.notify );
      }
      else if ( this.target instanceof Neuro.Collection )
      {
        this.target.off( NeuroBind.Events.Collection, this.notify );
      }
      else if ( this.target instanceof Neuro.Page )
      {
        this.target.off( NeuroBind.Events.Page, this.notify );
      }
    },
    newRelease: function()
    {
      var binder = this;

      return function()
      {
        binder.off();
      };
    },
    newNotification: function()
    {
      var binder = this;

      return function()
      {
        binder.scope.$evalAsync(function()
        {
          if ( binder.callback )
          {
            binder.callback.apply( binder.target );
          }

          if ( NeuroSettings.debug )
          {
            Neuro.debug( '[Scope:$evalAsync]', binder.scope );
          }
        });
      };
    }
  };

  var TEMPLATE_REGEX = /\{([^\}]+)\}/;

  function buildTemplate(template, params)
  {
    return template.replace( TEMPLATE_REGEX, function(match, prop)
    {
      return prop in params ? params[ prop ] : '';
    });
  }

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

  function templateResolver(routeParams)
  {
    return function(text) 
    {
      if (angular.isString( text ) && routeParams ) 
      {
        return buildTemplate( text, routeParams );
      }

      return text;
    };
  }

  getRouteParameter.cached = null;

  NeuroResolve.factory = function( name, callback )
  {
    var param = getRouteParameter();
    var paramResolver = buildParamResolver();

    var factory = ['$q', function resolve($q, routing) 
    {
      var defer = $q.defer();
      var routeParams = paramResolver( routing );
      var templateResolver = templateResolver( routeParams );

      Neuro.get( name, function(model) 
      {
        callback( model, defer, templateResolver );
      });

      return defer.promise;
    }];

    if ( param ) 
    {
      factory.splice( 1, 0, param );
    }

    return factory;
  };

  NeuroResolve.model = function( name, input )
  {
    return NeuroResolve.factory( name, function(model, defer, templateResolver) 
    {
      model.grabModel( templateResolver( input ), function(instance) 
      {
        if ( instance ) {
          defer.resolve( instance );
        } else {
          defer.reject();
        }
      });
    });
  };

  NeuroResolve.fetch = function( name, input )
  {
    return NeuroResolve.factory( name, function(model, defer, templateResolver) 
    {
      defer.resolve( model.fetch( templateResolver( input ) ) );
    });
  };

  NeuroResolve.query = function( name, query )
  {
    return NeuroResolve.factory( name, function(model, defer, templateResolver)
    {
      var remoteQuery = model.query( templateResolver( query ) );

      remoteQuery.success(function() 
      {
        defer.resolve( remoteQuery );
      });

      remoteQuery.failure(function() 
      {
        defer.reject();
      });
    });
  };

  NeuroResolve.all = function( name )
  {
    return NeuroResolve.factory( name, function(model, defer, templateResolver)
    {
      model.Database.ready(function() 
      {
        defer.resolve( model.all() );
      });
    });
  };

  NeuroResolve.where = function( name, whereProperties, whereValue, whereEquals )
  {
    return NeuroResolve.factory( name, function(model, defer, templateResolver)
    {
      if ( angular.isObject( whereProperties ) )
      {
        for (var prop in whereProperties)
        {
          whereProperties[ prop ] = templateResolver( whereProperties[ prop ] );
        }
      }
      if ( angular.isString( whereValue ) )
      {
        whereValue = templateResolver( whereValue );
      }

      model.Database.ready(function() 
      {
        defer.resolve( model.all().filtered( whereProperties, whereValue, whereEquals ) );
      });
    });
  };

})( angular.module('neurosync', []), window );