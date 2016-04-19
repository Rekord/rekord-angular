module( 'RekordResolve ui.router' );

var $injector = uiRouterInjector();

test( 'RekordResolve.fetch ui.router', function(assert)
{
  var done = assert.async();
  var prefix = 'RekordResolve_fetch_ui_';

  var TaskName = prefix + 'task';
  var Task = Rekord({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  var remote = Task.Database.rest;

  remote.map.put( '456', {id: '456', name: 't45'} );

  $injector.invoke(function($rootScope, $stateParams)
  {
    $stateParams.task_id = '456';

    var resolve = Rekord.Resolve.fetch( TaskName, '{task_id}' );
    var promise = $injector.invoke( resolve );

    promise.then(function(resolved)
    {
      strictEqual( resolved.id, '456' );
      strictEqual( resolved.name, 't45' );

      done();
    });

    $rootScope.$digest();

  });

});
