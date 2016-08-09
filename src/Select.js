
function Select(source, select, fill)
{
  this.$onRemove  = bind( this, this.$handleRemove );
  this.$onRemoves = bind( this, this.$handleRemoves );
  this.$onCleared = bind( this, this.$handleCleared );
  this.$onReset   = bind( this, this.$handleReset );

  this.$reset( source );
  this.$select( select, fill );
}

Select.prototype =
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
    this.$source.on( Rekord.Collection.Events.Remove, this.$onRemove );
    this.$source.on( Rekord.Collection.Events.Removes, this.$onRemoves );
    this.$source.on( Rekord.Collection.Events.Cleared, this.$onCleared );
    this.$source.on( Rekord.Collection.Events.Reset, this.$onReset );
  },

  $disconnect: function()
  {
    this.$source.off( Rekord.Collection.Events.Remove, this.$onRemove );
    this.$source.off( Rekord.Collection.Events.Removes, this.$onRemoves );
    this.$source.off( Rekord.Collection.Events.Cleared, this.$onCleared );
    this.$source.off( Rekord.Collection.Events.Reset, this.$onReset );
  },

  $select: function(select, fill)
  {
    if ( isArray( select ) )
    {
      var db = this.$source.database;
      var remove = {};

      for (var key in this)
      {
        if ( isBoolean( this[ key ] ) )
        {
          remove[ key ] = this[ key ];
        }
      }

      for (var i = 0; i < select.length; i++)
      {
        var key = db.keyHandler.buildKeyFromInput( select[ i ] );

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
    var key = db.keyHandler.buildKeyFromInput( removed );

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
      if ( isBoolean( this[ key ] ) )
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
      if ( isBoolean( this[ key ] ) )
      {
        if ( !source.has( key ) )
        {
          delete this[ key ];
        }
      }
    }
  }
};

Rekord.ModelCollection.prototype.selectable = function(select, fill)
{
  return new Select( this, select, fill );
};
