// Meteor.subscribe calls go in here

Template.body.events({
  'click .button_new-automaton' : function() {
    Session.set('activeGraph',Graphs.insert({
      'type'          : 'automaton',
      'deterministic' : 'false',
      'owner'         : Meteor.userId(),
      'title'         : 'Untitled Automaton'
    }));
  },
  'click #myautomata li a' : function() {
    if(this._id != Session.get('activeGraph')) {
      Session.set('activeGraph',this._id);
    } else {
      Session.set('activeGraph',null);
    }
  }
});

Template.body.myautomata = function() {
  return Graphs.find({'owner' : Meteor.userId()});
};

Template.body.isActiveGraph = function() {
  return this._id == Session.get('activeGraph');
};

Template.body.activeGraphExists = function() {
  return Session.get('activeGraph') != null;
};

Template.body.activeGraph = function() {
  return Graphs.findOne({'_id':Session.get('activeGraph')});
};

Meteor.startup(function() {
  Session.set('activeGraph',null);
});