#ifndef DIJKSTRA_ROUTER_HPP
#define DIJKSTRA_ROUTER_HPP

#include <vector>
#include "models.hpp"


std::vector<double> runDijkstraAlgorithm(int totalNodes, const std::vector<std::vector<Edge>>& adjacencyList, int sourceNode);

#endif // DIJKSTRA_ROUTER_HPP
