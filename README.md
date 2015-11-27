# neurosync-angular

A neurosync binding to angular - implementing Neuro.rest.

This binding also supplies a factory `NeuroBind` which is a function which accepts a `$scope` variable followed by a `Neuro` instance, `Neuro.Database` instance, or `Neuro.Model` instance. When a change event is triggered on the neurosync object it notifies the scope.

The easiest way to install is by using bower via `bower install neurosync-angular`.