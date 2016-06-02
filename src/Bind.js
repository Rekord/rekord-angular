function Bind( scope, target, callback )
{
  if ( !(this instanceof Bind) )
  {
    return new Bind( scope, target, callback );
  }

  this.scope = scope;
  this.target = target;
  this.callback = callback;

  this.on();
}

Bind.prototype =
{
  on: function()
  {
    var target = this.target;

    if ( Rekord.isRekord( target ) )
    {
      target = this.target = target.Database;
    }

    this.off = target[ target.$change ? '$change' : 'change' ]( this.notify, this );

    this.scope.$on( '$destroy', this.off );
  },
  notify: function()
  {
    this.scope.$evalAsync();

    if ( isFunction( this.callback ) )
    {
      this.callback.apply( this.target );
    }

    Rekord.debug( Rekord.Debugs.ScopeDigest, this, this.scope );

    /* IDEALLY we would call digest for best performance... no good way to do that yet
    if( !scope.$$phase )
    {
      scope.$digest();

      if ( this.callback )
      {
        this.callback.apply( this.target );
      }

      Rekord.debug( Rekord.Debugs.ScopeDigest, this, scope );
    }
    */
  }
};
