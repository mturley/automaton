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
  },
  renderGraph : function(graphObj) {
    // TODO FIXME
    // right now the graph must be re-rendered whenever its data changes,
    // which is fine, except re-rendering removes and recreates the entire element.
    // 1. move the raphael init stuff to a handler for Template.rendered
    //    (and retain the raphael object for reuse)
    // 2. when the graph is re-rendered, instead of emptying the render pane,
    //    just clear the raphael canvas and start over from there.
    if(graphObj == undefined) {
      graphObj = Graphs.findOne({'_id':Session.get('activeGraph')});
    }
    var el;
    if(Raphael && $("#render-pane").length === 1 && graphObj != undefined) {
      $("#render-pane").empty();

      var redraw, g, renderer, layouter;
      var width = graphObj.width;
      var height = graphObj.height;
      g = new Graph();
      g.addNode("strawberry");
      g.addNode("cherry");
      g.addNode("1", { label : "START" });
      var st = {
        directed: true,
        label: "EdgeLabel!",
        "label-style" : {
          "font-size": 18
        }
      };
      g.addEdge("strawberry", "cherry", st);
      g.addEdge("strawberry", "1");
      layouter = new Graph.Layout.Spring(g);
      renderer = new Graph.Renderer.Raphael('render-pane', g, width, height);
      redraw = function() {
        layouter.layout();
        renderer.draw();
      };
      redraw();
    } else {
      console.log("Tried to render before canvas element existed!");
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
  var graph = Graphs.findOne({'_id':Session.get('activeGraph')});
  // fn.renderGraph(graph);
  // may need this to get raphael to acknowledge switching graphs
  return graph;
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
      'title'         : 'Untitled Automaton',
      'width'         : 640,
      'height'        : 300
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
});
Template.graphEditor.rendered = function() {
  console.log("GRAPHEDITOR TEMPLATE WAS RENDERED!");
  fn.renderGraph();
};

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