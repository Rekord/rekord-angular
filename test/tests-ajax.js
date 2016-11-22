
QUnit.config.reorder = false;
QUnit.config.testTimeout = 30 * 1000;

Rekord.autoload = true;

Rekord.setOnline();

module('Angular');

var $injector = angular.injector(['ng', 'rekord']);

// TODO Rekord.Angular.adjustOptions
// TODO Rekord.Angular.buildURL
// TODO Rekord.Angular.Angular
// TODO override url/method through options
// TODO override url/method through global Rekord.Angular.options
// TODO params
// TODO timeout
// TODO headers

test( 'all', function(assert)
{
  var done = assert.async();
  var prefix = 'all_';

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['completed', 'title', 'userId'],
    api: 'http://jsonplaceholder.typicode.com/todos/',
    load: Rekord.Load.All,
    cache: Rekord.Cache.None
  });

  expect(1);

  $injector.invoke(function($rootScope)
  {
    Task.ready(function()
    {
      strictEqual( Task.all().length, 200 );
      done();
    });
  });
});

test( 'get', function(assert)
{
  var done = assert.async();
  var prefix = 'get_';

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['completed', 'title', 'userId'],
    api: 'http://jsonplaceholder.typicode.com/todos/'
  });

  expect(2);

  $injector.invoke(function($rootScope)
  {
    Task.fetch( 2, {}, function(t2)
    {
      strictEqual( t2.title, 'quis ut nam facilis et officia qui' );
      strictEqual( t2.completed, false );
      done();
    });
  });
});

test( 'create', function(assert)
{
  var done = assert.async();
  var prefix = 'create_';

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['completed', 'title', 'userId'],
    api: 'http://jsonplaceholder.typicode.com/todos/'
  });

  var t0 = Task.create({id: 201, title: 't0', completed: false});

  expect(1);

  $injector.invoke(function($rootScope)
  {
    t0.$once( Rekord.Model.Events.RemoteSaves, function()
    {
      strictEqual( t0.title, 't0' );
      done();
    });
  });
});


test( 'update', function(assert)
{
  var done = assert.async();
  var prefix = 'update_';

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['completed', 'title', 'userId'],
    api: 'http://jsonplaceholder.typicode.com/todos/'
  });

  var t0 = Task.create({id: 2, title: 't0', completed: false});

  expect(2);

  $injector.invoke(function($rootScope)
  {
    t0.$once( Rekord.Model.Events.RemoteSaves, function()
    {
      strictEqual( t0.title, 't0' );

      t0.title = 't0a';
      t0.$save().then(function()
      {
        strictEqual( t0.title, 't0a' );
        done();
      });
    });
  });
});

test( 'delete', function(assert)
{
  var done = assert.async();
  var prefix = 'delete_';

  var Task = Rekord({
    name: prefix + 'task',
    fields: ['completed', 'title', 'userId'],
    api: 'http://jsonplaceholder.typicode.com/todos/'
  });

  expect(4);

  $injector.invoke(function($rootScope)
  {
    Task.fetch( 2, {}, function(t2)
    {
      strictEqual( t2.title, 'quis ut nam facilis et officia qui' );
      strictEqual( t2.completed, false );
      ok( t2.$isSaved() );

      t2.$remove().then(function()
      {
        ok( t2.$isDeleted() );
        done();
      });
    });
  });
});

test( 'model var', function(assert)
{
  var done = assert.async();
  var prefix = 'model_var_';

  var Post = Rekord({
    name: prefix + 'post',
    fields: ['title', 'body', 'userId'],
    api: 'http://jsonplaceholder.typicode.com/posts/'
  });

  var Comment = Rekord({
    name: prefix + 'comment',
    fields: ['postId', 'name', 'email', 'body'],
    api: 'http://jsonplaceholder.typicode.com/posts/{postId}/comments/'
  });

  var c0 = new Comment({
    postId: 1,
    name: 'Name #6',
    email: 'email@domain.com',
    body: 'Body #6'
  });

  var p0 = c0.$save();

  expect(1);

  $injector.invoke(function($rootScope)
  {
    p0.success(function() {
      ok( c0.$isSaved() );
      done();
    });

    p0.failure(function() {
      ok( false );
    });
  });
});

test( 'global var', function(assert)
{
  var done = assert.async();
  var prefix = 'global_var_';

  Rekord.Angular.vars.favePost = 2;

  var Comment = Rekord({
    name: prefix + 'comment',
    fields: ['postId', 'name', 'email', 'body'],
    api: 'http://jsonplaceholder.typicode.com/posts/{postId}/comments/'
  });

  var s0 = Comment.search('http://jsonplaceholder.typicode.com/posts/{favePost}/comments');
  var p0 = s0.$run();

  expect(2);

  $injector.invoke(function($rootScope)
  {
    p0.success(function() {
      var first = s0.$results[0];
      ok( first );
      strictEqual( first.postId, Rekord.Angular.vars.favePost );
      done();
    });

    p0.failure(function() {
      ok( false );
    });
  });
});

test( 'options var', function(assert)
{
  var done = assert.async();
  var prefix = 'options_var_';

  var Comment = Rekord({
    name: prefix + 'comment',
    fields: ['postId', 'name', 'email', 'body'],
    api: 'http://{base}/comments/'
  });

  expect(4);

  $injector.invoke(function($rootScope)
  {
    Comment.fetch( 17, {vars:{base:'jsonplaceholder.typicode.com'}}, function(c0) {
      ok( c0 );
      strictEqual( c0.id, 17 );
      strictEqual( c0.postId, 4 );
      ok( c0.name );
      done();
    });
  });
});
