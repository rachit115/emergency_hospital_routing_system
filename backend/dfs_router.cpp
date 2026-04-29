#include "dfs_router.hpp"
#include <stack>

const double DFS_INFINITY = 1e18;

std::vector<double> runDFSAlgorithm(int totalNodes, const std::vector<std::vector<Edge>>& adjacencyList, int sourceNode) {
    std::vector<double> distances(totalNodes, DFS_INFINITY);
    std::vector<bool> visited(totalNodes, false);
    
    distances[sourceNode] = 0.0;
    
    // Using a manual stack for DFS
    std::stack<std::pair<int, double>> s;
    s.push({sourceNode, 0.0});

    while (!s.empty()) {
        int u = s.top().first;
        double d = s.top().second;
        s.pop();

        if (visited[u]) continue;
        visited[u] = true;
        distances[u] = d;

        for (const auto& edge : adjacencyList[u]) {
            if (!visited[edge.destinationNode]) {
                s.push({edge.destinationNode, d + edge.travelWeight});
            }
        }
    }

    return distances;
}
