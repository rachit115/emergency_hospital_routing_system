#ifndef BELLMAN_FORD_ROUTER_HPP
#define BELLMAN_FORD_ROUTER_HPP

#include <vector>
#include "models.hpp"

// Runs Bellman-Ford algorithm to find shortest path from source to all nodes.
// Works on graphs with negative weights (though hospital routing has none).
// Returns a vector of distances from the source to each node.
std::vector<double> runBellmanFordAlgorithm(int totalNodes, const std::vector<std::vector<Edge>>& adjacencyList, int sourceNode);

#endif // BELLMAN_FORD_ROUTER_HPP
