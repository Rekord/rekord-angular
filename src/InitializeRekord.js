
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
    all: function( success, failure )
    {
      this.execute( 'GET', null, undefined, this.database.api, success, failure, [] );
    },
    get: function( model, success, failure )
    {
      this.execute( 'GET', model, undefined, this.removeTrailingSlash( this.database.api + model.$key() ), success, failure );
    },
    create: function( model, encoded, success, failure )
    {
      this.execute( 'POST', model, encoded, this.removeTrailingSlash( this.database.api ), success, failure, {} );
    },
    update: function( model, encoded, success, failure )
    {
      this.execute( 'PUT', model, encoded, this.removeTrailingSlash( this.database.api + model.$key() ), success, failure, {} );
    },
    remove: function( model, success, failure )
    {
      this.execute( 'DELETE', model, undefined, this.removeTrailingSlash( this.database.api + model.$key() ), success, failure, {} );
    },
    query: function( url, data, success, failure )
    {
      var method = isEmpty( data ) ? 'GET' : 'POST';

      this.execute( method, null, data, url, success, failure );
    },
    execute: function( method, model, data, url, success, failure, offlineValue )
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

        var options = transfer( Rekord.Angular.options, {
          method: method,
          data: data,
          url: url
        });

        Rekord.Angular.adjustOptions( options, this.database, method, model, data, url, success, failure );
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

  function formatDate(date, format)
  {
    return $filter('date')( date, format );
  }

  Rekord.setRest( RestFactory );
  Rekord.listenToNetworkStatus();

  Rekord.formatDate = formatDate;

  Rekord.Angular =
  {
    rest: RestFactory,
    options: {},
    adjustOptions: noop,
    ajax: ajax,
    RestClass: Rest
  };
}
