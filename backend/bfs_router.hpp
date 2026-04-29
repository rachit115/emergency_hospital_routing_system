#ifndef BFS_ROUTER_HPP
#define BFS_ROUTER_HPP

#include <vector>
#include "models.hpp"


std::vector<double> runBFSAlgorithm(int totalNodes, const std::vector<std::vector<Edge>>& adjacencyList, int sourceNode);

#endif // BFS_ROUTER_HPP
