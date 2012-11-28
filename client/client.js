var UrlRouter = Backbone.Router.extend({
  routes: {
    ''         : 'home',
    'edit/:id' : 'edit'
  },
  home: function() {
    fn.setActiveGraph(null);
  },
  edit: function(graph_id) {
    fn.setActiveGraph(graph_id);
    console.log("STUFF WITH id ",graph_id);
  }
});
var Router = new UrlRouter;

var fn = {
  setActiveGraph : function(graph_id) {
    Session.set('activeGraph',graph_id);
    if(graph_id == null) {
      Router.navigate('');
    } else {
      Router.navigate('edit/'+graph_id);
    }
  }
};

Meteor.startup(function() {
  Backbone.history.start({ pushState: true })
  $('#confirm-delete-dialog').modal({ backdrop: true, show: false });
});

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

Template.body.numSavedAutomata = function() {
  return Graphs.count({'_id':Session.get('activeGraph')});
};

Template.body.events({
  'click .button_new-automaton' : function() {
    fn.setActiveGraph(Graphs.insert({
      'type'          : 'automaton',
      'deterministic' : 'false',
      'owner'         : Meteor.userId(),
      'title'         : 'Untitled Automaton'
    }));
  },
  'click #myautomata li a' : function(event) {
    if(this._id != Session.get('activeGraph')) {
      fn.setActiveGraph(this._id);
    } else {
      fn.setActiveGraph(null);
    }
    event.preventDefault();
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
      fn.setActiveGraph(null);
    $('#confirm-delete-dialog').modal('hide');
  },
  'click #confirm-delete-dialog .btn-secondary' : function() {
    $('#confirm-delete-dialog').modal('hide');
  }
});