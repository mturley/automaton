Graphs = new Meteor.Collection("graphs");
/*  Example Graph Object: {
  'type'          : 'automaton'
  'deterministic' : false,
  'owner'         : <user account id>,
  'title'         : 'My First Automaton'
  'width'         : 640,
  'height'        : 300
}  */
Vertices = new Meteor.Collection("vertices");
/* Example Vertex Object: {
  'graph_id' : <graph id>,
  'label'    : 'p',
  'colors'   : {
    'start' : true,
    'final' : false
  }
} */
Edges = new Meteor.Collection("edges");
/* Example Edge Object: {
  'graph_id'       : <graph_id>,
  'directed'       : true,
  'fromvert_label' : <string>,
  'fromvert_id'    : <vertex_id>,
  'tovert_label'   : <string>,
  'tovert_id'      : <vertex_id>,
  'label'          : '1'
} */

Simulations = new Meteor.Collection("simulations");
/* Example Simulation object: {
  'graph_id'     : <graph_id>,
  'input'        : '10010101001',
  'currentIndex' : 3
  'currentState' : <vertex_id>,
  'history' : [
    {
      'oldState'   : null,
      'inputIndex' : 0,
      'inputChar'  : '1',
      'newState'   : <vertex_id>,
      'atStart'    : true,
      'atFinal'    : false
    }, {
      'oldState'   : null,
      'inputIndex' : 1,
      'inputChar'  : '0',
      'newState'   : <vertex_id>,
      'atStart'    : false,
      'atFinal'    : false
    }
  ]
} */