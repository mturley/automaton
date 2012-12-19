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
      var dragger = function () {
        this.ox = this.type == "rect" ? this.attr("x") : this.attr("cx");
        this.oy = this.type == "rect" ? this.attr("y") : this.attr("cy");
        this.animate({"fill-opacity": .2}, 500);
      },
      move = function (dx, dy) {
        var att = this.type == "rect" ? {x: this.ox + dx, y: this.oy + dy} : {cx: this.ox + dx, cy: this.oy + dy};
        this.attr(att);
        for (var i = connections.length; i--;) {
          r.connection(connections[i]);
        }
        r.safari();
      },
      up = function () {
        this.animate({"fill-opacity": 0}, 500);
      },
      r = Raphael("render-pane", graphObj.width, graphObj.height),
      connections = [],
      shapes = [
        r.ellipse(190, 100, 30, 20),
        r.rect(290, 80, 60, 40, 10),
        r.rect(290, 180, 60, 40, 2),
        r.ellipse(450, 100, 20, 20)
      ];
      for (var i = 0, ii = shapes.length; i < ii; i++) {
        var color = Raphael.getColor();
        shapes[i].attr({fill: color, stroke: color, "fill-opacity": 0, "stroke-width": 2, cursor: "move"});
        shapes[i].drag(move, dragger, up);
      }
      connections.push(r.connection(shapes[0], shapes[1], "#000"));
      connections.push(r.connection(shapes[1], shapes[2], "#000", "#000|5"));
      connections.push(r.connection(shapes[1], shapes[3], "#000", "#000"));
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