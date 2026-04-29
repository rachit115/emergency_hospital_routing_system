#ifndef ASTAR_ROUTER_HPP
#define ASTAR_ROUTER_HPP

#include <vector>
#include "models.hpp"

std::vector<double> runAStarAlgorithm(int totalNodes, const std::vector<std::vector<Edge>>& adjacencyList, int sourceNode, const std::vector<Hospital>& hospitals, const Patient& patient);

#endif // ASTAR_ROUTER_HPP
