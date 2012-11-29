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
  }
});
var Router = new UrlRouter;

var fn = {
  setActiveGraph : function(graph_id) {
    Session.set('activeGraph',graph_id);
    Session.set('editMode',true);
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

Template.body.myautomata = function() {
  return Graphs.find({'owner' : Meteor.userId()});
};
Template.body.isActiveGraph = function() {
  return this._id == Session.get('activeGraph');
};
Template.body.activeGraphExists = function() {
  return Session.get('activeGraph') != null;
};
Template.body.numSavedAutomata = function() {
  return Graphs.find({'_id':Session.get('activeGraph')}).count();
};

Template.graphEditor.activeGraph = function() {
  return Graphs.findOne({'_id':Session.get('activeGraph')});
};
Template.graphEditor.editMode = function() {
  return Session.get('editMode');
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

Template.graphEditor.events({
  'click .editable-title' : function() {
    var $titleBox = $('.editable-title .content');
    $titleBox.addClass('editing').attr('contenteditable','true');
    $('.editable-title')
    var saveTitle = function() {
      $titleBox.off('blur.editing keyup.editing');
      $titleBox.removeClass('editing').removeAttr('contenteditable');
      var oldTitle = Graphs.findOne({ '_id' : Session.get('activeGraph') }).title;
      var title = $titleBox.text();
      if(title !== '') {
        Graphs.update({ '_id' : Session.get('activeGraph') },{ 'title' : title });
      } else {
        $titleBox.html(oldTitle);
      }
    }
    $titleBox.on('blur.editing', saveTitle);
    $titleBox.on('keyup.editing', function(event) {
      if(event.keyCode === 13) saveTitle();
    });
  },
  'click #toggle-edit-mode' : function() {
    Session.set('editMode', !Session.get('editMode'));
  }
})

Template.hiddenElements.events({
  'click #confirm-delete-dialog .btn-danger' : function() {
    var g = Session.get('dialogContextGraph');
    Graphs.remove({ '_id' : g });
    if(Session.get('activeGraph') == g)
      fn.setActiveGraph(null);
    $('#confirm-delete-dialog').modal('hide');
  },
  'click #confirm-delete-dialog .btn-secondary' : function() {
    $('#confirm-delete-dialog').modal('hide');
  }
});