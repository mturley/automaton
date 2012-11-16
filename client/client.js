// Meteor.subscribe calls go in here

Template.body.events({
 'click .button_new-automaton' : function() {
   alert("Coming Soon!");
  }
});

Meteor.startup(function() {
  /// startup behavior here?
});