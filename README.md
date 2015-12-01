# neurosync-angular

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

    // Make an AJAX call to the given URL and return all results
    tasks: NeuroResolve.query( 'task', '/api/task/retired' ),

    // Make an AJAX call to the given URL using task specified in URL
    tasks: NeuroResolve.query( 'task', '/api/task/parent_task/{taskId}' ),

    // Return all existing tasks loaded in the system
    tasks: NeuroResolve.all( 'task' ),

    // Return existing tasks that meet some where condition
    tasks: NeuroResolve.where( 'task', 'done', false ),
    tasks: NeuroResolve.where( 'task', {parent_task: '{taskId}', done: true} ),

  }
  ...
}

```
