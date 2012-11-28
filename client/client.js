// Meteor.subscribe calls go in here

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
  },
  'click #myautomata li .delete-icon' : function() {
    Session.set('dialogContextGraph', this._id)
    $('#confirm-delete-dialog').modal('show');
  }
});

Template.hiddenElements.events({
  'click #confirm-delete-dialog .btn-danger' : function() {
    var g = Session.get('dialogContextGraph');
    Graphs.remove({'_id':g});
    if(Session.get('activeGraph') == g)
      Session.set('activeGraph',null);
    $('#confirm-delete-dialog').modal('hide');
  },
  'click #confirm-delete-dialog .btn-secondary' : function() {
    $('#confirm-delete-dialog').modal('hide');
  }
});

Meteor.startup(function() {
  Session.set('activeGraph',null);
  $('#confirm-delete-dialog').modal({ backdrop: true, show: false });
});