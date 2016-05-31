
  app
    .run( ['$http', InitializeRekord] )
    .filter( 'models', ModelFilter )
  ;

  Rekord.Bind = Bind;
  Rekord.Resolve = Resolve;
  Rekord.Select = Select;
  Rekord.Factory = Factory;
  Rekord.Debugs.ScopeDigest = 100000;

})( this, this.Rekord, this.angular, this.angular.module('rekord', []) );
