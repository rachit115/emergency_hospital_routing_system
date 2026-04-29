#include "bfs_router.hpp"
#include <queue>
#include <vector>
#include <limits>

const double BFS_INFINITY = 1e18;

/*
  BFS Algorithm for Hospital Routing
  -----------------------------------
  BFS explores nodes level by level (nearest hop first).
  Since our graph is small (patient + hospitals), BFS visits
  each hospital exactly once. We store the actual edge weight
  (distance) when we first visit a node — that is the BFS-found distance.

  Note: BFS does NOT guarantee shortest DISTANCE in a weighted graph.
  It guarantees shortest PATH in terms of number of hops.
  For comparison/demo purposes, we record the weight of the first
  edge used to reach each node (direct patient→hospital edge).
*/
std::vector<double> runBFSAlgorithm(int totalNodes, const std::vector<std::vector<Edge>>& adjacencyList, int sourceNode) {
    std::vector<double> distances(totalNodes, BFS_INFINITY);
    std::vector<bool> visited(totalNodes, false);

    // BFS queue stores {node, distance_used_to_reach_it}
    std::queue<std::pair<int, double>> bfsQueue;

    distances[sourceNode] = 0.0;
    visited[sourceNode] = true;
    bfsQueue.push({sourceNode, 0.0});

    while (!bfsQueue.empty()) {
        int currentNode = bfsQueue.front().first;
        double currentDist = bfsQueue.front().second;
        bfsQueue.pop();

        // Explore all neighbors
        for (const Edge& edge : adjacencyList[currentNode]) {
            if (!visited[edge.destinationNode]) {
                visited[edge.destinationNode] = true;
                // Record the actual distance (weight) even though BFS
                // traverses by hops — this gives meaningful km values
                distances[edge.destinationNode] = currentDist + edge.travelWeight;
                bfsQueue.push({edge.destinationNode, distances[edge.destinationNode]});
            }
        }
    }

    return distances;
}
