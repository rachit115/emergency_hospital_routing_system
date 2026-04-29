#ifndef DFS_ROUTER_HPP
#define DFS_ROUTER_HPP

#include <vector>
#include "models.hpp"

std::vector<double> runDFSAlgorithm(int totalNodes, const std::vector<std::vector<Edge>>& adjacencyList, int sourceNode);

#endif // DFS_ROUTER_HPP
