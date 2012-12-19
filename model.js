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
    'final' : false,
  },
  'xpos' : 35,
  'ypos' : 35
} */
Edges = new Meteor.Collection("edges");
/* Example Edge Object: {
  'graph_id'    : <graph_id>,
  'directed'    : true,
  'fromvert_id' : <vertex_id>,
  'tovert_id'   : <vertex_id>,
  'label'       : '1',
  'positioning' : 'direct'
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