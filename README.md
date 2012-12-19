# This project is still in its infancy and does not function properly.  I will update this readme when the code is stable.

## Known Issues:

* Vertex labelling is a heuristic based on the number of vertices, so removing and adding vertices can result in duplicates.  Labels need to remain unique.

* Graph rendering is totally broken and inadequate.

* No validation is in place to make sure the DFA is valid (only verifies that there is exactly one start node).

* If the simulator "gets stuck" (finds that there is no transition out of the current state for a character being read) it will halt and reject the string.

* There is no mechanism to determine the alphabet being used, let alone whether the input string is valid under that alphabet or whether the DFA is in fact deterministic.

* No support for NFAs.  If the simulation encounters more than one valid transition for a given input character, it will simply abort rather than simulate multiple paths.