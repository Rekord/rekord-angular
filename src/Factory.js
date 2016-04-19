Factory.helper = function(name, impl)
{
  var ref = null;

  Rekord.get( name, function(rekord)
  {
    ref = rekord;
  });

  return function FactoryImplementation()
  {
    if ( !ref )
    {
      throw name + ' Rekord failed to load or does not exist.';
    }

    return impl( ref );
  };
};

Factory.search = function(name, url, props, run, paged)
{
  return Factory.helper( name, function(model)
  {
    var search = paged ? model.searchPaged( url ) : model.search( url );

    if ( Rekord.isObject( props ) )
    {
      Rekord.transfer( props, search );
    }

    if ( run )
    {
      search.$run();
    }

    return search;
  });
};

Factory.lazyLoad = function(name, callback, context)
{
  var initialized = {};

  return Factory.helper( name, function(model)
  {
    if ( !model.Database.remoteLoaded && !(name in initialized) )
    {
      initialized[ name ] = true;

      model.Database.refresh( callback, context );
    }

    return model;
  });
};

Factory.filtered = function(name, where, value, equals)
{
  return Factory.helper( name, function(model)
  {
    return model.filtered( where, value, equals );
  });
};

Factory.all = function(name)
{
  return Factory.helper( name, function(model)
  {
    return model.all();
  });
};

Factory.create = function(name, props)
{
  return Factory.helper( name, function(model)
  {
    return model.create( props );
  });
};

Factory.fetchAll = function(name, callback, context)
{
  return Factory.helper( name, function(model)
  {
    return model.fetchAll( callback, context );
  });
};

Factory.grabAll = function(name, callback, context)
{
  return Factory.helper( name, function(model)
  {
    return model.grabAll( callback, context );
  });
};
