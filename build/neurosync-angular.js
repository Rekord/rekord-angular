(function (app, global, undefined)
{

  var NeuroSettings = {
    debug: false
  };

  var NeuroResolve = {

  };

  app
    .constant( 'NeuroSettings', NeuroSettings )
    .constant( 'Neuro', Neuro )
    .constant( 'NeuroBind', NeuroBind )
    .constant( 'NeuroResolve', NeuroResolve )
    .constant( 'NeuroSelect', NeuroSelect )
    .run( ['$http', InitializeNeuro] )
  ;

  global.NeuroBind = NeuroBind;
  global.NeuroResolve = NeuroResolve;
  global.NeuroSelect = NeuroSelect;

  function InitializeNeuro($http)
  {
    Neuro.rest = function(database)
    {

      function removeTrailingSlash(x)
      {
        return x.charAt(x.length - 1) === '/' ? x.substring(0, x.length - 1) : x;
      }

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
    Database:     'updated',
    Model:        'saved removed remote-update relation-update',
    Collection:   'add adds sort remove reset',
    Page:         'change',
    Scope:        '$destroy'
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

  function NeuroSelect(source, select, fill)
  {
    this.$onRemove  = Neuro.bind( this, this.$handleRemove );
    this.$onRemoves = Neuro.bind( this, this.$handleRemoves );
    this.$onCleared = Neuro.bind( this, this.$handleCleared );
    this.$onReset   = Neuro.bind( this, this.$handleReset );

    this.$reset( source );
    this.$select( select, fill );
  }

  NeuroSelect.prototype = 
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
      this.$source.on( Neuro.Collection.Events.Remove, this.$onRemove );
      this.$source.on( Neuro.Collection.Events.Removes, this.$onRemoves );
      this.$source.on( Neuro.Collection.Events.Cleared, this.$onCleared );
      this.$source.on( Neuro.Collection.Events.Reset, this.$onReset );
    },

    $disconnect: function()
    {
      this.$source.off( Neuro.Collection.Events.Remove, this.$onRemove );
      this.$source.off( Neuro.Collection.Events.Removes, this.$onRemoves );
      this.$source.off( Neuro.Collection.Events.Cleared, this.$onCleared );
      this.$source.off( Neuro.Collection.Events.Reset, this.$onReset );
    },

    $select: function(select, fill)
    {
      if ( Neuro.isArray( select ) )
      {
        var db = this.$source.database;
        var remove = {};

        for (var key in this)
        {
          if ( typeof this[ key ] === 'boolean' )
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
        if ( typeof this[ key ] === 'boolean' )
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
        if ( typeof this[ key ] === 'boolean' )
        {
          if ( !source.has( key ) )
          {
            delete this[ key ];
          }
        }
      }
    }
  };

  Neuro.ModelCollection.prototype.selectable = function(select, fill)
  {
    return new NeuroSelect( this, select, fill );
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

  function buildTemplateResolver(routeParams)
  {
    return function(text) 
    {
      if (Neuro.isString( text ) && routeParams ) 
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

        Neuro.get( name, function(model) 
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

        if ( Neuro.isArray( arg ) )
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

  NeuroResolve.model = function( name, input )
  {
    return NeuroResolve.factory( name, function(model, defer, templateResolver) 
    {
      model.Database.grabModel( templateResolver( input ), function(instance) 
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

  NeuroResolve.fetch = function( name, input )
  {
    return NeuroResolve.factory( name, function(model, defer, templateResolver) 
    {
      var db = model.Database;
      var key = db.buildKeyFromInput( templateResolver( input ) );
      var instance = db.get( key );

      if ( !instance )
      {
        instance = db.buildObjectFromKey( key );

        if ( Neuro.isObject( input ) )
        {
          instance.$set( input );
        }
      }

      instance.$once( Neuro.Model.Events.RemoteGets, function()
      {
        defer.resolve( instance );
      });

      instance.$refresh();
    });
  };

  NeuroResolve.fetchAll = function( name )
  {
    return NeuroResolve.factory( name, function(model, defer, templateResolver) 
    {
      model.fetchAll(function(models)
      {
        defer.resolve( models );
      });
    });
  };

  NeuroResolve.create = function( name, properties, dontSave )
  {
    return NeuroResolve.factory( name, function(model, defer, templateResolver) 
    {
      if ( dontSave )
      {
        defer.resolve( new model( properties ) );
      }
      else
      {
        var instance = model.create( properties );

        if ( instance.$isSaved() )
        {
          defer.resolve( instance );
        }
        else
        {
          instance.$once( Neuro.Model.Events.RemoteSaves, function()
          {
            defer.resolve( instance );
          });
        }
      }
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
      if ( Neuro.isObject( whereProperties ) )
      {
        for (var prop in whereProperties)
        {
          whereProperties[ prop ] = templateResolver( whereProperties[ prop ] );
        }
      }
      if ( Neuro.isString( whereValue ) )
      {
        whereValue = templateResolver( whereValue );
      }

      model.Database.ready(function() 
      {
        defer.resolve( model.all().filtered( whereProperties, whereValue, whereEquals ) );
      });
    });
  };

})( angular.module('neurosync', []), this );