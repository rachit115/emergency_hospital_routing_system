#include "floyd_warshall_router.hpp"

const double FW_INFINITY = 1e18;

std::vector<double> runFloydWarshallAlgorithm(int totalNodes, const std::vector<std::vector<Edge>>& adjacencyList, int sourceNode) {
    std::vector<std::vector<double>> dist(totalNodes, std::vector<double>(totalNodes, FW_INFINITY));

    for (int i = 0; i < totalNodes; i++) {
        dist[i][i] = 0.0;
        for (const auto& edge : adjacencyList[i]) {
            dist[i][edge.destinationNode] = edge.travelWeight;
        }
    }

    for (int k = 0; k < totalNodes; k++) {
        for (int i = 0; i < totalNodes; i++) {
            for (int j = 0; j < totalNodes; j++) {
                if (dist[i][k] < FW_INFINITY && dist[k][j] < FW_INFINITY) {
                    if (dist[i][k] + dist[k][j] < dist[i][j]) {
                        dist[i][j] = dist[i][k] + dist[k][j];
                    }
                }
            }
        }
    }

    return dist[sourceNode];
}
