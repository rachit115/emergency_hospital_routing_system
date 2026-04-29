#ifndef BFS_ROUTER_HPP
#define BFS_ROUTER_HPP

#include <vector>
#include "models.hpp"

// Runs BFS to find shortest path in terms of number of hops (unweighted).
// For hospital routing: returns actual distances but explores in BFS order.
// Returns a vector of distances from the source to each node.
std::vector<double> runBFSAlgorithm(int totalNodes, const std::vector<std::vector<Edge>>& adjacencyList, int sourceNode);

#endif // BFS_ROUTER_HPP
