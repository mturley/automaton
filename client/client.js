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
    var gid;
    if(graphObj == undefined) {
      gid = Session.get('activeGraph');
      graphObj = Graphs.findOne({'_id': gid});
    } else {
      gid = graphObj._id;
    }
    if(Raphael && $("#render-pane").length === 1 && graphObj != undefined) {
      $("#render-pane").empty(); // this shouldn't be necessary... FIXME!

      var redraw, g, renderer, layouter;
      var width = graphObj.width;
      var height = graphObj.height;
      g = new Graph();

      $.each(Vertices.find({ graph_id : gid }).fetch(), function(i, vertex) {
        var lbl = vertex.label;
        if(vertex.colors['start']) lbl += ' [START]';
        if(vertex.colors['final']) lbl += ' [FINAL]';
        g.addNode(vertex._id, { label : lbl });
      });
      $.each(Edges.find({ graph_id : gid }).fetch(), function(i, edge) {
        g.addEdge(edge.fromvert_id, edge.tovert_id, {
          directed: true,
          label: edge.label,
          "label-style" : {
            "font-size" : 16
          }
        });
      });

      layouter = new Graph.Layout.Spring(g);
      renderer = new Graph.Renderer.Raphael('render-pane', g, width, height);
      layouter.layout();
      renderer.draw();
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
  // may need this to get dracula to acknowledge switching graphs
  return graph;
};
Template.graphEditor.editMode = function() {
  return Session.get('editMode');
};

Template.body.events({
  'click .button_new-automaton' : function() {
    fn.setActiveGraph(Graphs.insert({
      type          : 'automaton',
      deterministic : 'false',
      owner         : Meteor.userId(),
      title         : 'Untitled Automaton',
      width         : 640,
      height        : 300
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
        Graphs.update({ '_id' : Session.get('activeGraph') },{ $set: {'title' : title }});
      } else {
        $titleBox.html(oldTitle);
      }
    }
    $titleBox.on('blur.editing', saveTitle);
    $titleBox.on('keyup.editing', function(event) {
      if(event.keyCode === 13) saveTitle();
    });
  },
  'click #force-redraw' : function() {
    fn.renderGraph();
  },
  'click #add-vertex' : function() {
    var gid = Session.get('activeGraph');
    var num = Vertices.find({ 'graph_id' : gid }).count();
    // TODO account for deleted vertices?  just reorder them?
    Vertices.insert({
      graph_id : gid,
      label    : 'v'+num, // TODO allow for actual labels
      colors   : {
        'start' : false,
        'final' : false
      }
    });
    fn.renderGraph();
  },
  'click #add-edge'   : function() {
    var gid, isValidVertex, qFrom, qTo, err, vFrom, vTo, isValidChar, qChar, transChar;
    gid = Session.get('activeGraph');
    isValidVertex = function(str) {
      return str !== null && Vertices.find({ graph_id: gid, label: str }).count() === 1;
    };
    qFrom = "Which state should this transition lead OUT OF? (i.e. v1 for vertex 1)";
    qTo = "Which state should this transition lead INTO?  (i.e. v1 for vertex 1)";
    err = "That's not a valid vertex label in this graph!  Try again.";
    while(!isValidVertex(vFrom = prompt(qFrom))) {
      if(vFrom === null) return;
      alert(err);
    }
    while(!isValidVertex(vTo = prompt(qTo))) {
      if(vTo === null) return;
      alert(err);
    }
    isValidChar = function(str) {
      return str !== null && str.length === 1
        && Edges.find({ graph_id : gid, label: str, fromvert_label: vFrom }).count() === 0;
    }
    qChar = "Finally, what character from the language should the DFA accept for this transition from "+vFrom+" to "+vTo+"?";
    while(!isValidChar(transChar = prompt(qChar))) {
      if(transChar === null) return;
      alert("Invalid input: please enter exactly one character, and be sure there isn't already a transition from "+vFrom+" using that character.");
    }
    Edges.insert({
      graph_id       : gid,
      directed       : true,
      fromvert_label : vFrom,
      fromvert_id    : Vertices.findOne({ graph_id: gid, label: vFrom })._id,
      tovert_label   : vTo,
      tovert_id      : Vertices.findOne({ graph_id: gid, label: vTo })._id,
      label          : transChar
    });
    fn.renderGraph();
  },
  'click #toggle-edit-mode' : function() {
    Session.set('editMode', !Session.get('editMode'));
  }
});
Template.graphEditor.rendered = function() {
  console.log("GRAPHEDITOR TEMPLATE WAS RENDERED!");
  // TODO do we really have to re-render the entire graph when the template changes?
  fn.renderGraph();
};
Template.graphEditor.vertices = function() {
  return Vertices.find({ 'graph_id' : Session.get('activeGraph') });
};
Template.graphEditor.edges = function() {
  return Edges.find({ 'graph_id' : Session.get('activeGraph') },
    { sort: {fromvert_id: 1}});
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