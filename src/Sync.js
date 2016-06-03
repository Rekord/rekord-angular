function Sync( scope, target, callback )
{
  if ( !(this instanceof Sync) )
  {
    return new Sync( scope, target, callback );
  }

  this.scope = scope;
  this.target = target;
  this.callback = callback;

  this.on();
}

Sync.prototype =
{
  on: function()
  {
    var target = this.target;

    if ( isRekord( target ) )
    {
      target = this.target = target.Database;
    }

    var targetFunction = target.$change ? '$change' : 'change';

    if ( target[ targetFunction ] )
    {
      this.off = target[ targetFunction ]( this.notify, this );

      this.scope.$on( '$destroy', this.off );
    }
  },
  notify: function()
  {
    // $digest would be better for performance - but there's no official way
    // to see if a digest cycle is currently running
    this.scope.$evalAsync();

    if ( isFunction( this.callback ) )
    {
      this.callback.apply( this.target );
    }

    Rekord.debug( Rekord.Debugs.ScopeDigest, this, this.scope );
  }
};
