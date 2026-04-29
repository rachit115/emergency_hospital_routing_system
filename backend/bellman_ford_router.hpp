#ifndef BELLMAN_FORD_ROUTER_HPP
#define BELLMAN_FORD_ROUTER_HPP

#include <vector>
#include "models.hpp"


std::vector<double> runBellmanFordAlgorithm(int totalNodes, const std::vector<std::vector<Edge>>& adjacencyList, int sourceNode);

#endif // BELLMAN_FORD_ROUTER_HPP
