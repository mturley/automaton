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
  'inputString'  : '10010101001',
  'currentIndex' : 3
  'currentState' : <vertex_id>,
  'complete'     : false,
  'accepted'     : false,
  'aborted'      : false,
  'history' : [  
    {
      'index'      : 0
      'oldState'   : null,
      'inputChar'  : '1',
      'newState'   : <vertex_id>,
      'atStart'    : true,
      'atFinal'    : false
    }, {
      'index'      : 1
      'oldState'   : null,
      'inputChar'  : '0',
      'newState'   : <vertex_id>,
      'atStart'    : false,
      'atFinal'    : false
    }
  ]
} */