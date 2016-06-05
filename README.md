# <img src="https://raw.githubusercontent.com/Rekord/rekord/master/images/rekord-color.png" width="60"> rekord-angular

[![Build Status](https://travis-ci.org/Rekord/rekord-angular.svg)](https://travis-ci.org/Rekord/rekord-angular)
[![Dependency Status](https://david-dm.org/Rekord/rekord-angular.svg)](https://david-dm.org/Rekord/rekord-angular)
[![devDependency Status](https://david-dm.org/Rekord/rekord-angular/dev-status.svg)](https://david-dm.org/Rekord/rekord-angular#info=devDependencies)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Rekord/rekord/blob/master/LICENSE)
[![Alpha](https://img.shields.io/badge/State-Alpha-orange.svg)]()

A rekord binding to angular - implementing Rekord.rest.

The easiest way to install is by using bower via `bower install rekord-angular`.

- `rekord-angular.js` is `14KB` (`3.2KB` gzipped)
- `rekord-angular.min.js` is `6.3KB` (`2.1KB` gzipped)

### Usage Example

```javascript
// Executed after options are applied but before the store, rest, & live
// implementations are added. It's good to prepare your database in this
// function so if you switch backends there's only one place you need to do so.
// You can also pass a prepare function as a Rekord option.
Rekord.Database.Defaults.prepare = function(db, options) {
  db.api = options.api || '/api/1.0/' + options.name + '/';
};

// Default behavior
var TaskList = Rekord({
  name: 'task_list',
  field: ['name', 'done']
  // api: '/api/1.0/task_list/' is generated
});

// Override (or default behavior if prepare method isn't used like above)
var Task = Rekord({
  name: 'task',
  api: '/api/1.1/task/',
  field: ['name', 'done', 'task_list_id']
});

// NOTE: The API should typically end in a slash
```

Include `rekord` as a module dependency in your angular app definition.

There are several services which assist in making angular and rekord work nicely together:

### Rekord.Sync

Rekord.Sync will sync modifications made outside of angular to an angular scope.
Modifications outside of angular includes but is not limited to:

- Data being loaded from local storage
- Data being loaded from a REST API
- Data being returned from saving a record
- Data being broadcasted live
- Data retrieved from an automatic refresh
- A model is added/updated/removed in a separate place in the application
- A relationship is updated in a separate place in the application

```javascript
var Task = Rekord({
  name: 'task',
  fields: ['name', 'done'],
  defaults: {done: false}
});

Rekord.Sync( $scope, Task ); // Listens to all tasks

var task = Task.create({name: 'Task #1'});

Rekord.Sync( $scope, task ); // Listens to a single task

var done = Task.all().where('done', true);

Rekord.Sync( $scope, done ); // Listens to collection of all done tasks

var page = done.page( 10 );

Rekord.Sync( $scope, page ); // Listens to a page from a collection
```

### Rekord.Resolve

Rekord.Resolve generates functions for routing libraries to return an object
once it's completely loaded. This is used in routing libraries to avoid
displaying the IU before data is completely loaded. Route parameters can also be
used by specifying a string containing text in the format `{paramName}`.

```javascript
{
  url: '/task/edit/:taskId',
  ...
  resolves: {

    // Resolve task with ID 34 (assumes the task will be loaded remotely already)
    task: Rekord.Resolve.model( 'task', 34 ),

    // Resolve task specified in URL (same assumption as above)
    task: Rekord.Resolve.model( 'task', '{taskId}' ),

    // Call GET to REST API to return the task with ID 34
    task: Rekord.Resolve.fetch( 'task', 45 ),

    // Call GET to REST API to return the task specified in URL
    task: Rekord.Resolve.fetch( 'task', '{taskId}' ),

    // Create new task & save it
    task: Rekord.Resolve.create( 'task', {name: 'New Task'} ),

    // Create new unsaved task (equivalent of calling new Task)
    task: Rekord.Resolve.create( 'task', {name: 'New Task'}, true ),

    // Make an AJAX call to the given URL and return all results
    tasks: Rekord.Resolve.query( 'task', '/api/task/retired' ),

    // Make an AJAX call to the given URL using task specified in URL
    tasks: Rekord.Resolve.query( 'task', '/api/task/parent_task/{taskId}' ),

    // Return all existing tasks loaded in the system
    tasks: Rekord.Resolve.all( 'task' ),

    // Return existing tasks that meet some where condition
    tasks: Rekord.Resolve.where( 'task', 'done', false ),
    tasks: Rekord.Resolve.where( 'task', {parent_task: '{taskId}', done: true} ),

    // Grabs the model with ID 34 - if it doesn't exist locally it is fetched.
    task: Rekord.Resolve.grab( 'task', 34 ),

    // Grabs all existing tasks - if non exist locally it is all fetched.
    tasks: Rekord.Resolve.grabAll( 'task' )

  }
  ...
}

```

### Rekord.Factory

Rekord.Factory generates a factory function for angular to return a Rekord class.

```javascript
angular.module('my-module', ['rekord'])

  // Creates a reference to the model class
  .factory( 'Task', Rekord.Factory.ref( 'Task' ) )

  // Creates a search and executes it (if run is true) the first time this dependency is injected.
  .factory( 'MySearch', Rekord.Factory.search( 'Task', '/tasks/search', {done: true}, true ) )

  // If the model has loadRemote:false but you still want them to be loaded - this will load
  // the models the first time this dependency is injected
  .factory( 'Tasks', Rekord.Factory.lazyLoad( 'Task' ) )

  // Returns a live collection of models which pass the where expression.
  .factory( 'TasksDone', Rekord.Factory.filtered( 'Task', 'done', true ) )

  // Returns the collection of models that are currently loaded.
  .factory( 'TasksCached', Rekord.Factory.all( 'Task' ) )

  // Returns the collection of models that are current loaded and calls
  // on the database to be refreshed from the remote source.
  .factory( 'TasksFetched', Rekord.Factory.fetchAll( 'Task' ) )

  // Returns the collection of models that are currently loaded. If the local
  // source has been loaded an no model instances exist - the models are loaded
  // from the remote source.
  .factory( 'TasksGrabbed', Rekord.Factory.grabAll( 'Task' ) )
;
```

### Rekord.Select

Rekord.Select allows a user to make models in a collection selectable - once the
user is done selecting models they can be retrieved with `$selection()`. This
pairs perfectly with ngModel & checkboxes.

```javascript

var options = Task.all().selectable();

options[ task0.id ] = true;
options[ task1.id ] = false;
options[ task2.id ] = true;
options[ task3.id ] = true;

options.$selection(); // [task0, task2, task3]

// Existing selected options
var options = Task.all().selectable( currentUser.tasks );

// Set what's currently selected
options.$select( currentUers.tasks );

```
