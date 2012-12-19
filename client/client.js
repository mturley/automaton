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
  },
  simulateInit : function(inputstr) {
    var gid, s, startNode;
    gid = Session.get('activeGraph');
    s = Vertices.find({ graph_id : gid, 'colors.start' : true });
    if(s.count() !== 1) {
      alert("ERROR: simulateInit was called on a DFA which does not have exactly one start node.  Aborting.");
      return;
    }
    startNode = s.fetch()[0];
    Simulations.remove({}); // WARNING: destroys all old simulation data.
    // if we ever want a browsable simulation history, remove the above line.
    Session.set('activeSimulation', Simulations.insert({
      graph_id     : gid,
      inputString  : inputstr,
      currentIndex : 0,
      currentState : startNode._id,
      complete     : false,
      accepted     : false,
      aborted      : false,
      history      : []
    }));
  },
  simulateStep : function() {
    // returns true if done simulating, false otherwise.
    var sim, cur, idx, ch, e, edge, newStateObj, stepObj;
    var isComplete = false, isAccepted = false, isAborted = false;
    sim = Simulations.findOne(Session.get('activeSimulation'));
    cur = sim.currentState;
    if(!sim || !sim.hasOwnProperty('currentState')) {
      alert("ERROR: simulateStep was called while activeSimulation was invalid.  Aborting.");
      return true;
    }
    // grab the next character to read
    idx = sim.currentIndex;
    ch = sim.inputString[idx];
    // look for a matching transition
    e = Edges.find({
      graph_id    : sim.graph_id,
      fromvert_id : cur,
      label       : ch
    });
    if(e.count() === 0) {
      // no edge to follow!  reject string and complete simulation.
      stepObj = {
        index     : idx,
        oldState  : sim.currentState,
        inputChar : ch,
        newState  : null,
        atStart   : false,
        atFinal   : false
      };
      isComplete = true;
    } else if(e.count() > 1) {
      alert("More than one edge to follow!  Currently the simulator does not support NFAs.  Aborting.");
      stepObj = {
        index     : idx,
        oldState  : sim.currentState,
        inputChar : ch,
        newState  : null,
        atStart   : false,
        atFinal   : false
      };
      isComplete = true;
      isAborted = true;
    } else {
      // we have a valid edge to follow!
      edge = e.fetch()[0];
      newStateObj = Vertices.findOne(edge.tovert_id);
      cur = newStateObj._id;
      stepObj = {
        index     : idx,
        oldState  : sim.currentState,
        inputChar : ch,
        newState  : cur,
        atStart   : newStateObj.colors['start'],
        atFinal   : newStateObj.colors['final']
      };
      if(idx+1 >= sim.inputString.length) {
        // we've reached the end of our input.
        isComplete = true;
        isAccepted = stepObj.atFinal;
      }
    }
    Simulations.update(sim._id, { $set : {
      currentIndex : idx+1,
      currentState : cur,
      complete     : isComplete,
      accepted     : isAccepted,
      aborted      : isAborted
    }});
    if(stepObj !== undefined) {
      Simulations.update(sim._id, { $push : {
        history : stepObj
      }});
    }
    return isComplete;
  },
  simulateAll : function() {
    while(!fn.simulateStep()) {}
    console.log("finished test simulation: ",Simulations.findOne(Session.get('activeSimulation')));
  }
};

Meteor.startup(function() {
  Backbone.history.start({ pushState: true })
  $('#confirm-delete-dialog').modal({ backdrop: true, show: false });
  Session.set('activeSimulation', null);
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
  'click #edit-pane li.vert a.start' : function() {
    var vertid = this._id;
    var newval = !this.colors.start;
    if(newval && Vertices.find({
        graph_id : Session.get('activeGraph'),
        'colors.start' : true }).count() > 0) {
      alert("Error: There must only be one start state at a time!");
      return;
    }
    Vertices.update(vertid, { $set: { 'colors.start' : newval }});
  },
  'click #edit-pane li.vert a.final' : function() {
    var vertid = this._id;
    var newval = !this.colors.final;
    Vertices.update(vertid, { $set: { 'colors.final' : newval }});
  },
  'click #edit-pane li.vert i.delete' : function() {
    var vertid = this._id;
    var selector = { $or: [{fromvert_id : vertid}, {tovert_id : vertid}] };
    var numEdges = Edges.find(selector).count();
    if(numEdges > 0 && !confirm("This vertex has "+numEdges+" incident edges!  Removing this vertex will also remove all associated transitions in and out of this vertex.  Are you sure you want to do that?")) {
      return;
    }
    if(numEdges > 0) Edges.remove(selector);
    Vertices.remove(vertid);
  },
  'click #edit-pane li.edge i.delete' : function() {
    Edges.remove(this._id);
  },
  'click #toggle-edit-mode' : function() {
    var editing = Session.get('editMode');
    var gid = Session.get('activeGraph');
    if(editing && Vertices.find({
      graph_id: gid, 'colors.start': true
    }).count() !== 1) {
      alert("I politely refuse to attempt simulation of a DFA without exactly one start state!");
    } else {
      Session.set('editMode', !editing);
      Session.set('activeSimulation', null);
    }
  },
  'click #do-simulate' : function() {
    var str = $('#string-input').val();
    if(str.length > 0) fn.simulateInit(str);
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

Template.simulationResults.events({
  'click #sim-step' : function() {
    fn.simulateStep();
  },
  'click #sim-all' : function() {
    fn.simulateAll();
  }
});
Template.simulationResults.simulating = function() {
  return Session.get('activeSimulation') !== null;
};
Template.simulationResults.history = function() {
  return Simulations.findOne(Session.get('activeSimulation'))['history'];
};
Template.simulationResults.oldState_label = function() {
  var vertid = this.oldState;
  if(vertid === null) return '--';
  return Vertices.findOne(vertid).label;
};
Template.simulationResults.newState_label = function() {
  var vertid = this.newState;
  if(vertid === null) return '--';
  return Vertices.findOne(vertid).label;
};
Template.simulationResults.inputString = function() {
  return Simulations.findOne(Session.get('activeSimulation'))['inputString'];
}
Template.simulationResults.incomplete = function() {
  return !Simulations.findOne(Session.get('activeSimulation'))['complete'];
};
Template.simulationResults.aborted = function() {
  return Simulations.findOne(Session.get('activeSimulation'))['aborted'];
};
Template.simulationResults.accepted = function() {
  return Simulations.findOne(Session.get('activeSimulation'))['accepted'];
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