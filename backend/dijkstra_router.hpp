#ifndef DIJKSTRA_ROUTER_HPP
#define DIJKSTRA_ROUTER_HPP

#include <vector>
#include "models.hpp"

// Runs the Dijkstra algorithm to find the shortest path from the source node to all other nodes.
// Returns a vector of distances from the source to each node.
std::vector<double> runDijkstraAlgorithm(int totalNodes, const std::vector<std::vector<Edge>>& adjacencyList, int sourceNode);

#endif // DIJKSTRA_ROUTER_HPP
