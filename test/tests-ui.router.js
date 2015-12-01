module( 'NeuroResolve ui.router' );

test( 'NeuroResolve.fetch ui.router', function(assert)
{
  var done = assert.async();

  uiRouterInjector(function($injector)
  {
    var prefix = 'NeuroResolve_fetch_ui_';

    var TaskName = prefix + 'task';
    var Task = Neuro({
      name: TaskName,
      fields: ['name', 'done'],
      defaults: {done: false}
    });

    var remote = Task.Database.rest;

    remote.map.put( '456', {id: '456', name: 't45'} );

    $injector.invoke(function($rootScope, $stateParams, NeuroResolve)
    {
      $stateParams.task_id = '456';

      var resolve = NeuroResolve.fetch( TaskName, '{task_id}' );
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

});