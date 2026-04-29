#include "bellman_ford_router.hpp"
#include <vector>

const double BF_INFINITY = 1e18;


std::vector<double> runBellmanFordAlgorithm(int totalNodes, const std::vector<std::vector<Edge>>& adjacencyList, int sourceNode) {
    std::vector<double> distances(totalNodes, BF_INFINITY);
    distances[sourceNode] = 0.0;

    
    for (int iteration = 0; iteration < totalNodes - 1; iteration++) {
        bool anyRelaxed = false; // Early exit if no relaxation happened

        // Go through every node and every edge from that node
        for (int node = 0; node < totalNodes; node++) {
            // Skip nodes not yet reachable
            if (distances[node] == BF_INFINITY) continue;

            for (const Edge& edge : adjacencyList[node]) {
                double newDist = distances[node] + edge.travelWeight;
                if (newDist < distances[edge.destinationNode]) {
                    distances[edge.destinationNode] = newDist;
                    anyRelaxed = true;
                }
            }
        }

        // If no edge was relaxed in this pass, we're done early
        if (!anyRelaxed) break;
    }

   

    return distances;
}
