# neurosync-angular

[![Build Status](https://travis-ci.org/ClickerMonkey/neurosync-angular.svg)](https://travis-ci.org/ClickerMonkey/neurosync-angular)
[![Dependency Status](https://david-dm.org/ClickerMonkey/neurosync-angular.svg)](https://david-dm.org/ClickerMonkey/neurosync-angular)
[![devDependency Status](https://david-dm.org/ClickerMonkey/neurosync-angular/dev-status.svg)](https://david-dm.org/ClickerMonkey/neurosync-angular#info=devDependencies)

A neurosync binding to angular - implementing Neuro.rest.

The easiest way to install is by using bower via `bower install neurosync-angular`.

There are two services which assist in making angular and neurosync work flawlessly together:

### NeuroBind

NeuroBind will bind modifications made outside of angular to an angular scope.
Modifications outside of angular includes but is not limited to:

- Data being loaded from local storage
- Data being loaded from a REST API
- Data being returned from saving a record
- Data being broadcasted live
- Data retrieved from an automatic refresh
- A model is added/updated/removed in a separate place in the application
- A relationship is updated in a separate place in the application

```javascript
var Task = Neuro({
  name: 'task',
  fields: ['name', 'done'],
  defaults: {done: false}
});

NeuroBind( $scope, Task ); // Listens to all tasks

var task = Task.create({name: 'Task #1'});

NeuroBind( $scope, task ); // Listens to a single task

var done = Task.all().where('done', true);

NeuroBind( $scope, done ); // Listens to collection of all done tasks

var page = done.page( 10 );

NeuroBind( $scope, page ); // Listens to a page from a collection
```

### NeuroResolve

NeuroResolve generates functions for routing libraries to return an object
once it's completely loaded. This is used in routing libraries to avoid displaying the
UI before data is completely loaded. Route parameters can also be used by specifying a string containing text in the format `{paramName}`.

```javascript
{
  url: '/task/edit/:taskId',
  ...
  resolves: {
    
    // Resolve task with ID 34 (assumes the task will be loaded remotely already)
    task: NeuroResolve.model( 'task', 34 ),

    // Resolve task specified in URL (same assumption as above)
    task: NeuroResolve.model( 'task', '{taskId}' ),

    // Call GET to REST API to return the task with ID 34
    task: NeuroResolve.fetch( 'task', 45 ),

    // Call GET to REST API to return the task specified in URL
    task: NeuroResolve.fetch( 'task', '{taskId}' ),
    
    // Create new task & save it
    task: NeuroResolve.create( 'task', {name: 'New Task'} ),
    
    // Create new unsaved task (equivalent of calling new Task)
    task: NeuroResolve.create( 'task', {name: 'New Task'}, true ),

    // Make an AJAX call to the given URL and return all results
    tasks: NeuroResolve.query( 'task', '/api/task/retired' ),

    // Make an AJAX call to the given URL using task specified in URL
    tasks: NeuroResolve.query( 'task', '/api/task/parent_task/{taskId}' ),

    // Return all existing tasks loaded in the system
    tasks: NeuroResolve.all( 'task' ),

    // Return existing tasks that meet some where condition
    tasks: NeuroResolve.where( 'task', 'done', false ),
    tasks: NeuroResolve.where( 'task', {parent_task: '{taskId}', done: true} ),

    // Grabs the model with ID 34 - if it doesn't exist locally it is fetched.
    task: NeuroResolve.grab( 'task', 34 ),

    // Grabs all existing tasks - if non exist locally it is all fetched.
    tasks: NeuroResolve.grabAll( 'task' )

  }
  ...
}

```

### NeuroSelect

NeuroSelect allows a user to make models in a collection selectable - once the
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
