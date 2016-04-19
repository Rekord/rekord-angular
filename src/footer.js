
  app
    .run( ['$http', InitializeRekord] )
    .filter( 'models', ModelFilter )
  ;

  Rekord.Bind = Bind;
  Rekord.Resolve = Resolve;
  Rekord.Select = Select;
  Rekord.Factory = Factory;
  Rekord.Debugs.ScopeDigest = 100000;

})( angular.module('rekord', []), this, angular, Rekord );
