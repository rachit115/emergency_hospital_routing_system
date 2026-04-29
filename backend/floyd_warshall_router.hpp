#ifndef FLOYD_WARSHALL_ROUTER_HPP
#define FLOYD_WARSHALL_ROUTER_HPP

#include <vector>
#include "models.hpp"

std::vector<double> runFloydWarshallAlgorithm(int totalNodes, const std::vector<std::vector<Edge>>& adjacencyList, int sourceNode);

#endif // FLOYD_WARSHALL_ROUTER_HPP
