#include "bellman_ford_router.hpp"
#include <vector>

const double BF_INFINITY = 1e18;

/*
  Bellman-Ford Algorithm for Hospital Routing
  --------------------------------------------
  Bellman-Ford relaxes ALL edges (V-1) times to find shortest paths.
  Unlike Dijkstra, it can handle negative edge weights.
  For hospital routing: all weights are positive (distances in km),
  so results will match Dijkstra — but this demonstrates the algorithm.

  Time Complexity: O(V * E)  — slower than Dijkstra for large graphs
  Space Complexity: O(V)
*/
std::vector<double> runBellmanFordAlgorithm(int totalNodes, const std::vector<std::vector<Edge>>& adjacencyList, int sourceNode) {
    std::vector<double> distances(totalNodes, BF_INFINITY);
    distances[sourceNode] = 0.0;

    // Relax all edges (totalNodes - 1) times
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

    // Note: Negative cycle detection skipped — hospital distances are always positive
    // If needed, one more pass + check would detect negative cycles

    return distances;
}
