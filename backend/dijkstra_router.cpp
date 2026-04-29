#include "dijkstra_router.hpp"
#include <queue>

const double INFINITY_VAL = 1e18;

std::vector<double> runDijkstraAlgorithm(int totalNodes, const std::vector<std::vector<Edge>>& adjacencyList, int sourceNode) {
    std::vector<double> shortestDistances(totalNodes, INFINITY_VAL);
    std::priority_queue<std::pair<double, int>, std::vector<std::pair<double, int>>, std::greater<>> priorityQueue;

    shortestDistances[sourceNode] = 0.0;
    priorityQueue.push({0.0, sourceNode});

    while (!priorityQueue.empty()) {
    
        double currentDistance = priorityQueue.top().first;
        int currentNode = priorityQueue.top().second;
        priorityQueue.pop();

        // Skip this entry if we already found a shorter path to the currentNode
        if (currentDistance > shortestDistances[currentNode]) {
            continue;
        }

        // Check all adjacent nodes (edges)
        for (const Edge& edge : adjacencyList[currentNode]) {
            double newDistance = shortestDistances[currentNode] + edge.travelWeight;
            if (newDistance < shortestDistances[edge.destinationNode]) {
                shortestDistances[edge.destinationNode] = newDistance;
                priorityQueue.push({newDistance, edge.destinationNode});
            }
        }
    }

    return shortestDistances;
}
