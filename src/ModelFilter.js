
function ModelFilter()
{
  return function filterModels(models)
  {
    if ( !models || !models.toArray )
    {
      return models;
    }

    var array = models.toArray();
    var ids = {};

    for (var i = 0; i < array.length; i++)
    {
      var model = array[ i ];

      if ( !model.$key || model.$key() in ids )
      {
        array.splice( i--, 1 );
      }
      else
      {
        ids[ model.$key() ] = model;
      }
    }

    return array;
  };
}
