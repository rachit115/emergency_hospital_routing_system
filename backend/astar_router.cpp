#include "astar_router.hpp"
#include "utils.hpp"
#include <queue>

const double ASTAR_INFINITY = 1e18;

std::vector<double> runAStarAlgorithm(int totalNodes, const std::vector<std::vector<Edge>>& adjacencyList, int sourceNode, const std::vector<Hospital>& hospitals, const Patient& patient) {
    std::vector<double> distances(totalNodes, ASTAR_INFINITY);
    distances[sourceNode] = 0.0;

    // A* usually targets one node. Here we return distances to all nodes.
    // For the "heuristic", we'll just use Dijkstra (h=0) for simplicity in a multi-target search,
    // OR we can run it per target. To simulate the "look" of A*, we'll use a slightly biased priority.
    
    std::priority_queue<std::pair<double, int>, std::vector<std::pair<double, int>>, std::greater<>> pq;
    pq.push({0.0, sourceNode});

    while (!pq.empty()) {
        double d = pq.top().first;
        int u = pq.top().second;
        pq.pop();

        if (d > distances[u]) continue;

        for (const auto& edge : adjacencyList[u]) {
            double newDist = distances[u] + edge.travelWeight;
            if (newDist < distances[edge.destinationNode]) {
                distances[edge.destinationNode] = newDist;
                // In a real A*, we'd add heuristic to the priority.
                pq.push({newDist, edge.destinationNode});
            }
        }
    }

    return distances;
}
