module( 'RekordSync' );

var $injector = angular.injector(['ng', 'ngMock', 'rekord', 'rekord-test']);

test( 'Database', function(assert)
{
  var done = assert.async();
  var prefix = 'NeurSync_Database_';

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  $injector.invoke(function()
  {
    var $scope = new MockScope();

    strictEqual( $scope.listens, 0 );
    strictEqual( $scope.evals, 0 );

    Rekord.Sync( $scope, Task );

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 0 );

    Task.Database.updated();

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 1 );
    strictEqual( $scope.destroys, 0 );

    $scope.$destroy();

    strictEqual( $scope.destroys, 1 );

    Task.Database.updated();

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 1 );
    strictEqual( $scope.destroys, 1 );

    done();
  });

});

test( 'Model', function(assert)
{
  var done = assert.async();
  var prefix = 'NeurSync_Model_';

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  $injector.invoke(function()
  {
    var $scope = new MockScope();

    strictEqual( $scope.listens, 0 );
    strictEqual( $scope.evals, 0 );

    var t0 = Task.create({name: 't0'});

    Rekord.Sync( $scope, t0 );

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 0 );

    t0.$save();

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 1 );
    strictEqual( $scope.destroys, 0 );

    $scope.$destroy();

    strictEqual( $scope.destroys, 1 );

    t0.$save();

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 1 );
    strictEqual( $scope.destroys, 1 );

    done();
  });

});

test( 'Collection', function(assert)
{
  var done = assert.async();
  var prefix = 'NeurSync_Collection_';

  $injector.invoke(function()
  {
    var $scope = new MockScope();

    strictEqual( $scope.listens, 0 );
    strictEqual( $scope.evals, 0 );

    var c0 = Rekord.collect(1, 2, 3, 4);

    Rekord.Sync( $scope, c0 );

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 0 );

    c0.add( 5 );

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 1 );
    strictEqual( $scope.destroys, 0 );

    $scope.$destroy();

    strictEqual( $scope.destroys, 1 );

    c0.add( 6 );

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 1 );
    strictEqual( $scope.destroys, 1 );

    done();
  });

});

test( 'Page', function(assert)
{
  var done = assert.async();
  var prefix = 'NeurSync_Page_';

  $injector.invoke(function()
  {
    var $scope = new MockScope();

    strictEqual( $scope.listens, 0 );
    strictEqual( $scope.evals, 0 );

    var c0 = Rekord.collect(1, 2, 3, 4);
    var p0 = c0.page( 2 );

    Rekord.Sync( $scope, p0 );

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 0 );

    c0.add( 5 );

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 1 );
    strictEqual( $scope.destroys, 0 );

    p0.next();

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 2 );
    strictEqual( $scope.destroys, 0 );

    $scope.$destroy();

    strictEqual( $scope.destroys, 1 );

    c0.add( 6 );

    strictEqual( $scope.listens, 1 );
    strictEqual( $scope.evals, 2 );
    strictEqual( $scope.destroys, 1 );

    done();
  });

});

module( 'RekordSelect' );

test( 'selectable', function(assert)
{
  var prefix = 'RekordSelect_selectable_';

  var TaskName = prefix + 'task';
  var Task = Rekord({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  var t0 = Task.create({id: '1', name: 't0'});
  var t1 = Task.create({id: '2', name: 't1'});
  var t2 = Task.create({id: '3', name: 't2'});

  var selection = Task.all().selectable( [t1] );

  strictEqual( selection[ t0.id ], void 0 );
  strictEqual( selection[ t1.id ], true );
  strictEqual( selection[ t2.id ], void 0 );

  selection[ t0.id ] = true;
  selection[ t1.id ] = false;
  selection[ t2.id ] = true;

  deepEqual( selection.$selection(), [t0, t2] );

  t0.$remove();

  deepEqual( selection.$selection(), [t2] );
});

module( 'RekordResolve' );

test( 'RekordResolve.model', function(assert)
{
  var done = assert.async();
  var prefix = 'RekordResolve_model_';

  var TaskName = prefix + 'task';
  var Task = Rekord({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  var t0 = Task.create({id: 23, name: 't23'});

  expect( 1 );

  $injector.invoke(function($rootScope)
  {
    var resolve = Rekord.Resolve.model( TaskName, 23 );
    var promise = $injector.invoke( resolve );

    promise.then(function(resolved)
    {
      strictEqual( t0, resolved );

      done();
    });

    $rootScope.$digest();

  });

});

test( 'RekordResolve.create save', function(assert)
{
  var done = assert.async();
  var prefix = 'RekordResolve_create_save_';

  var TaskName = prefix + 'task';
  var Task = Rekord({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  expect( 2 );

  $injector.invoke(function($rootScope)
  {
    var resolve = Rekord.Resolve.create( TaskName, {name: 't0'} );
    var promise = $injector.invoke( resolve );

    promise.then(function(resolved)
    {
      strictEqual( resolved.name, 't0' );
      strictEqual( resolved.$isSaved(), true );

      done();
    });

    $rootScope.$digest();

  });

});

test( 'RekordResolve.create dontSave', function(assert)
{
  var done = assert.async();
  var prefix = 'RekordResolve_create_dontSave_';

  var TaskName = prefix + 'task';
  var Task = Rekord({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  expect( 2 );

  $injector.invoke(function($rootScope)
  {
    var resolve = Rekord.Resolve.create( TaskName, {name: 't0'}, true );
    var promise = $injector.invoke( resolve );

    promise.then(function(resolved)
    {
      strictEqual( resolved.name, 't0' );
      strictEqual( resolved.$isSaved(), false );

      done();
    });

    $rootScope.$digest();

  });

});

test( 'RekordResolve.fetch', function(assert)
{
  var done = assert.async();
  var prefix = 'RekordResolve_fetch_';

  var TaskName = prefix + 'task';
  var Task = Rekord({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  var remote = Task.Database.rest;

  remote.map.put( 45, {id: 45, name: 't45'} );

  expect( 2 );

  $injector.invoke(function($rootScope)
  {
    var resolve = Rekord.Resolve.fetch( TaskName, 45 );
    var promise = $injector.invoke( resolve );

    promise.then(function(resolved)
    {
      strictEqual( resolved.id, 45 );
      strictEqual( resolved.name, 't45' );

      done();
    });

    $rootScope.$digest();

  });

});

test( 'RekordResolve.fetch cache', function(assert)
{
  var done = assert.async();
  var prefix = 'RekordResolve_fetch_cache_';

  var TaskName = prefix + 'task';
  var Task = Rekord({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  var remote = Task.Database.rest;

  remote.map.put( 45, {id: 45, name: 't45'} );

  expect( 4 );

  $injector.invoke(function($rootScope)
  {
    var resolve = Rekord.Resolve.fetch( TaskName, 45 ).cache();
    var promise = $injector.invoke( resolve );

    promise.then(function(resolved)
    {
      strictEqual( resolved.id, 45 );
      strictEqual( resolved.name, 't45' );
    });

    $rootScope.$digest();

    remote.map.put( 45, {id: 45, name: 't45Nope' } );
    promise = $injector.invoke( resolve );

    promise.then(function(resolved)
    {
      strictEqual( resolved.id, 45 );
      strictEqual( resolved.name, 't45' );

      done();
    });

    $rootScope.$digest();
  });

});

test( 'RekordResolve.fetch inject', function(assert)
{
  expect( 5 );

  var TestResolved = false;

  angular.module('RekordResolve.fetch.inject', [])
    .factory('Test', function() {
      return (TestResolved = true);
    })
  ;

  var $injector = angular.injector(['ng', 'ngMock', 'rekord', 'rekord-test', 'RekordResolve.fetch.inject']);

  var done = assert.async();
  var prefix = 'RekordResolve_fetch_inject_';

  var TaskName = prefix + 'task';
  var Task = Rekord({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  var remote = Task.Database.rest;

  remote.map.put( 45, {id: 45, name: 't45'} );

  $injector.invoke(function($rootScope)
  {
    notOk( TestResolved, 'Test Not Yet Resolved' );

    var resolve = Rekord.Resolve.fetch( TaskName, 45 ).inject('Test');

    notOk( TestResolved, 'Test Still Not Resolved' );

    var promise = $injector.invoke( resolve );

    ok( TestResolved, 'Test Resolved' );

    promise.then(function(resolved)
    {
      strictEqual( resolved.id, 45 );
      strictEqual( resolved.name, 't45' );

      done();
    });

    $rootScope.$digest();
  });

});

test( 'RekordResolve.fetchAll', function(assert)
{
  var done = assert.async();
  var prefix = 'RekordResolve_fetchAll_';

  var TaskName = prefix + 'task';
  var Task = Rekord({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  var remote = Task.Database.rest;

  remote.map.put( 45, {id: 45, name: 't45'} );
  remote.map.put( 46, {id: 46, name: 't46'} );

  expect( 5 );

  $injector.invoke(function($rootScope)
  {
    var resolve = Rekord.Resolve.fetchAll( TaskName );
    var promise = $injector.invoke( resolve );

    promise.then(function(resolved)
    {
      strictEqual( resolved.length, 2 );
      strictEqual( resolved[0].id, 45 );
      strictEqual( resolved[0].name, 't45' );
      strictEqual( resolved[1].id, 46 );
      strictEqual( resolved[1].name, 't46' );

      done();
    });

    $rootScope.$digest();

  });

});

test( 'RekordResolve.search', function(assert)
{
  var done = assert.async();
  var prefix = 'RekordResolve_search_';
  var URL = 'http://google.com';

  var TaskName = prefix + 'task';
  var Task = Rekord({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  var remote = Task.Database.rest;

  remote.queries.put( URL, [
    {id: 35, name: 't35'},
    {id: 36, name: 't36'}
  ]);

  expect( 6 );

  $injector.invoke(function($rootScope)
  {
    var resolve = Rekord.Resolve.search( TaskName, URL );
    var promise = $injector.invoke( resolve );

    promise.then(function(resolved)
    {
      var results = resolved.$results;

      isInstance( resolved, Rekord.Search );

      strictEqual( results.length, 2 );
      strictEqual( results[0].id, 35 );
      strictEqual( results[0].name, 't35' );
      strictEqual( results[1].id, 36 );
      strictEqual( results[1].name, 't36' );

      done();
    });

    $rootScope.$digest();

  });

});

test( 'RekordResolve.all', function(assert)
{
  var done = assert.async();
  var prefix = 'RekordResolve_all_';

  var TaskName = prefix + 'task';
  var Task = Rekord({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  var t0 = Task.create({name: 't0'});
  var t1 = Task.create({name: 't1'});
  var t2 = Task.create({name: 't2'});

  expect( 4 );

  $injector.invoke(function($rootScope)
  {
    var resolve = Rekord.Resolve.all( TaskName );
    var promise = $injector.invoke( resolve );

    promise.then(function(resolved)
    {
      strictEqual( resolved.length, 3 );
      strictEqual( resolved[0], t0 );
      strictEqual( resolved[1], t1 );
      strictEqual( resolved[2], t2 );

      done();
    });

    $rootScope.$digest();

  });

});

test( 'RekordResolve.where', function(assert)
{
  var done = assert.async();
  var prefix = 'RekordResolve_where_';

  var TaskName = prefix + 'task';
  var Task = Rekord({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  var t0 = Task.create({name: 't0', done: true});
  var t1 = Task.create({name: 't1'});
  var t2 = Task.create({name: 't2', done: true});

  expect( 3 );

  $injector.invoke(function($rootScope)
  {
    var resolve = Rekord.Resolve.where( TaskName, 'done', true );
    var promise = $injector.invoke( resolve );

    promise.then(function(resolved)
    {
      strictEqual( resolved.length, 2 );
      strictEqual( resolved[0], t0 );
      strictEqual( resolved[1], t2 );

      done();
    });

    $rootScope.$digest();

  });

});

module( 'RekordFactory' );

test( 'search', function(assert)
{
  var done = assert.async();
  var prefix = 'RekordFactory_search_';
  var URL = 'http://google.com';

  var TaskName = prefix + 'task';
  var Task = Rekord({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  var remote = Task.Database.rest;

  remote.queries.put( URL, [
    {id: 35, name: 't35'},
    {id: 36, name: 't36'}
  ]);

  expect( 1 );

  angular.module( 'rekord-test' )
    .factory( 'SearchedTasks', Rekord.Factory.search( TaskName, URL, {}, {}, true ) )
  ;

  var $injector = angular.injector(['ng', 'ngMock', 'rekord', 'rekord-test']);

  $injector.invoke(function(SearchedTasks)
  {
    strictEqual( SearchedTasks.$results.length, 2 );

    done();
  });
});

test( 'lazyLoad', function(assert)
{
  var done = assert.async();
  var prefix = 'RekorkFactory_lazyLoad_';

  var TaskName = prefix + 'task';
  var Task = Rekord({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false},
    loadRemote: false
  });

  var remote = Task.Database.rest;

  remote.map.put( 35, {id: 35, name: 't35'} );
  remote.map.put( 36, {id: 36, name: 't36'} );

  expect( 1 );

  angular.module( 'rekord-test' )
    .factory( 'Tasks', Rekord.Factory.lazyLoad( TaskName ) )
  ;

  var $injector = angular.injector(['ng', 'ngMock', 'rekord', 'rekord-test']);

  $injector.invoke(function(Tasks)
  {
    strictEqual( Tasks.length, 2 );

    done();
  });
});

test( 'ref', function(assert)
{
  var done = assert.async();
  var prefix = 'RekorkFactory_ref_';

  var TaskName = prefix + 'task';
  var Task = Rekord({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false},
    loadRemote: false
  });

  var ExpectedTask = Task;

  expect( 1 );

  angular.module( 'rekord-test' )
    .factory( 'Task', Rekord.Factory.ref( TaskName ) )
  ;

  var $injector = angular.injector(['ng', 'ngMock', 'rekord', 'rekord-test']);

  $injector.invoke(function(Task)
  {
    strictEqual( Task, ExpectedTask );

    done();
  });
});

test( 'filtered', function(assert)
{
  var done = assert.async();
  var prefix = 'RekorkFactory_filtered_';

  var TaskName = prefix + 'task';
  var Task = Rekord({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false},
    loadRemote: false
  });

  Task.create({name: 't0', done: true});
  Task.create({name: 't1', done: true});
  Task.create({name: 't2', done: false});

  expect( 2 );

  angular.module( 'rekord-test' )
    .factory( 'TasksDone', Rekord.Factory.filtered( TaskName, 'done', true ) )
  ;

  var $injector = angular.injector(['ng', 'ngMock', 'rekord', 'rekord-test']);

  $injector.invoke(function(TasksDone)
  {
    strictEqual( TasksDone.length, 2 );
    strictEqual( Task.all().length, 3 );

    done();
  });
});

test( 'all', function(assert)
{
  var done = assert.async();
  var prefix = 'RekorkFactory_all_';

  var TaskName = prefix + 'task';
  var Task = Rekord({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false},
    loadRemote: false
  });

  Task.create({name: 't0', done: true});
  Task.create({name: 't1', done: true});
  Task.create({name: 't2', done: false});

  expect( 1 );

  angular.module( 'rekord-test' )
    .factory( 'TasksAll', Rekord.Factory.all( TaskName ) )
  ;

  var $injector = angular.injector(['ng', 'ngMock', 'rekord', 'rekord-test']);

  $injector.invoke(function(TasksAll)
  {
    strictEqual( TasksAll.length, 3 );

    done();
  });
});

test( 'fetchAll', function(assert)
{
  var done = assert.async();
  var prefix = 'RekorkFactory_fetchAll_';

  var TaskName = prefix + 'task';
  var Task = Rekord({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  var remote = Task.Database.rest;

  remote.map.put( 35, {id: 35, name: 't35'} );
  remote.map.put( 36, {id: 36, name: 't36'} );

  expect( 1 );

  angular.module( 'rekord-test' )
    .factory( 'TasksFetched', Rekord.Factory.fetchAll( TaskName ) )
  ;

  var $injector = angular.injector(['ng', 'ngMock', 'rekord', 'rekord-test']);

  $injector.invoke(function(TasksFetched)
  {
    strictEqual( TasksFetched.length, 2 );

    done();
  });
});

test( 'grabAll', function(assert)
{
  var done = assert.async();
  var prefix = 'RekorkFactory_grabAll_';

  var TaskName = prefix + 'task';
  var Task = Rekord({
    name: TaskName,
    fields: ['name', 'done'],
    defaults: {done: false}
  });

  Task.create( {id: 34, name: 't34'} );

  var remote = Task.Database.rest;

  remote.map.put( 35, {id: 35, name: 't35'} );
  remote.map.put( 36, {id: 36, name: 't36'} );

  expect( 1 );

  angular.module( 'rekord-test' )
    .factory( 'TasksGrabbed', Rekord.Factory.grabAll( TaskName, Rekord.noop ) )
  ;

  var $injector = angular.injector(['ng', 'ngMock', 'rekord', 'rekord-test']);

  $injector.invoke(function(TasksGrabbed)
  {
    strictEqual( TasksGrabbed.length, 1 );

    done();
  });
});

module( 'Date' );

test( 'formatDate', function(assert)
{
  var done = assert.async();
  var prefix = 'Date_formatDate_';
  var date = new Date(745873459485);

  var $injector = angular.injector(['ng', 'ngMock', 'rekord', 'rekord-test']);

  $injector.invoke(function()
  {
    var formatted = Rekord.formatDate( date, 'MM/dd/yyyy' );

    strictEqual( formatted, '08/20/1993')

    done();
  });
});
