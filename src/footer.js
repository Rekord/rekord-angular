
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
