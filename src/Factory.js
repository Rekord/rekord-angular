Factory.helper = function(name, impl)
{
  var ref = null;

  Rekord.get( name ).success(function(rekord)
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

Factory.search = function(name, url, options, props, run, paged)
{
  return Factory.helper( name, function(model)
  {
    return paged ?
      model.searchPaged( url, options, props, run ) :
      model.search( url, options, props, run );
  });
};

Factory.ref = function(name, callback, context)
{
  return Factory.helper( name, function(model)
  {
    return model;
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
