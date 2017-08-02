
function InitializeRekord($http, $filter)
{
  function Rest(database)
  {
    this.database = database;
  }

  Rest.prototype =
  {
    removeTrailingSlash: function(x)
    {
      return x.charAt(x.length - 1) === '/' ? x.substring(0, x.length - 1) : x;
    },
    buildURL: function(model)
    {
      return this.removeTrailingSlash( Rekord.Angular.buildURL( this.database, model ) );
    },
    all: function( options, success, failure )
    {
      this.execute( 'GET', null, undefined, this.buildURL(), options, success, failure, [] );
    },
    get: function( model, options, success, failure )
    {
      this.execute( 'GET', model, undefined, this.buildURL( model ), options, success, failure );
    },
    create: function( model, encoded, options, success, failure )
    {
      this.execute( 'POST', model, encoded, this.buildURL(), options, success, failure, {} );
    },
    update: function( model, encoded, options, success, failure )
    {
      this.execute( 'PUT', model, encoded, this.buildURL( model ), options, success, failure, {} );
    },
    remove: function( model, options, success, failure )
    {
      this.execute( 'DELETE', model, undefined, this.buildURL( model ), options, success, failure, {} );
    },
    query: function( url, data, options, success, failure )
    {
      var method = isEmpty( data ) ? 'GET' : 'POST';

      this.execute( method, null, data, url, options, success, failure );
    },
    execute: function( method, model, data, url, extraOptions, success, failure, offlineValue )
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

        var vars = transfer( Rekord.Angular.vars, transfer( model, {} ) );
        var options = transfer( Rekord.Angular.options, {
          method: method,
          data: data,
          url: url
        });

        if ( isObject( extraOptions ) )
        {
          transfer( options, extraOptions );

          if ( isObject( extraOptions.vars ) )
          {
            transfer( extraOptions.vars, vars );
          }
        }

        Rekord.Angular.adjustOptions( options, this.database, method, model, data, url, vars, success, failure );

        if ( isFormatInput( options.url ) )
        {
          options.url = format( options.url, vars );
        }

        Rekord.Angular.ajax( options, onRestSuccess, onRestError );
      }
    }
  };

  function RestFactory(database)
  {
    if ( !database.api )
    {
      return Rekord_rest.call( this, database );
    }

    return new Rest( database );
  }

  function ajax(options, success, failure)
  {
    $http( options ).then( success, failure );
  }

  function buildURL(db, model)
  {
    return model ? db.api + model.$key() : db.api;
  }

  function formatDate(date, format)
  {
    return $filter('date')( date, format );
  }

  Rekord.Rests.Angular = RestFactory;
  Rekord.setRest( RestFactory );

  Rekord.listenToNetworkStatus();

  Rekord.formatDate = formatDate;

  Rekord.Angular =
  {
    rest: RestFactory,
    options: {},
    vars: {},
    adjustOptions: noop,
    ajax: ajax,
    buildURL: buildURL,
    RestClass: Rest
  };
}
