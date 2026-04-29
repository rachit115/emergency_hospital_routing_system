

#include <iostream>
#include <vector>
#include <string>
#include <chrono>
#include <algorithm>

#include "models.hpp"
#include "utils.hpp"
#include "dijkstra_router.hpp"
#include "bfs_router.hpp"
#include "bellman_ford_router.hpp"
#include "dfs_router.hpp"
#include "astar_router.hpp"
#include "floyd_warshall_router.hpp"
#include "json_parser.hpp"

using namespace std;
using namespace std::chrono;

int main() {
    // Read JSON input from standard input
    string currentLine, fullInputJson;
    while (getline(cin, currentLine)) {
        fullInputJson += currentLine;
    }

    // --- Parse Patient Data ---
    Patient patientData;
    size_t patientStartPos = fullInputJson.find("\"patient\":{");
    if (patientStartPos == string::npos) { 
        cerr << "Error: No patient data found in JSON"; 
        return 1; 
    }
    
    size_t patientEndPos = fullInputJson.find("},", patientStartPos) + 1;
    string patientJsonChunk = fullInputJson.substr(patientStartPos, patientEndPos - patientStartPos);

    patientData.name = extractStringValue(patientJsonChunk, "name");
    patientData.age = static_cast<int>(extractNumericValue(patientJsonChunk, "age"));
    patientData.condition = extractStringValue(patientJsonChunk, "condition");
    patientData.latitude = extractNumericValue(patientJsonChunk, "lat");
    patientData.longitude = extractNumericValue(patientJsonChunk, "lng");
    patientData.isUnconscious = extractBooleanValue(patientJsonChunk, "unconscious");
    patientData.isBleeding = extractBooleanValue(patientJsonChunk, "bleeding");

    // --- Parse Hospitals Array ---
    vector<Hospital> hospitalList;
    size_t hospitalsArrayStartPos = fullInputJson.find("\"hospitals\":[");
    
    if (hospitalsArrayStartPos != string::npos) {
        hospitalsArrayStartPos += 13;
        size_t currentPos = hospitalsArrayStartPos;
        
        while (currentPos < fullInputJson.size()) {
            size_t objectStartPos = fullInputJson.find("{", currentPos);
            if (objectStartPos == string::npos) break;
            
            // Find matching closing brace for this hospital object
            int nestedDepth = 0;
            size_t objectEndPos = objectStartPos;
            for (; objectEndPos < fullInputJson.size(); objectEndPos++) {
                if (fullInputJson[objectEndPos] == '{') {
                    nestedDepth++;
                } else if (fullInputJson[objectEndPos] == '}') { 
                    nestedDepth--; 
                    if (nestedDepth == 0) break; 
                }
            }
            
            string hospitalJsonChunk = fullInputJson.substr(objectStartPos, objectEndPos - objectStartPos + 1);

            Hospital currentHospital;
            currentHospital.id = static_cast<int>(extractNumericValue(hospitalJsonChunk, "id"));
            currentHospital.name = extractStringValue(hospitalJsonChunk, "name");
            currentHospital.latitude = extractNumericValue(hospitalJsonChunk, "lat");
            currentHospital.longitude = extractNumericValue(hospitalJsonChunk, "lng");
            currentHospital.capacity = static_cast<int>(extractNumericValue(hospitalJsonChunk, "cap"));
            currentHospital.currentPatients = static_cast<int>(extractNumericValue(hospitalJsonChunk, "pts"));
            currentHospital.icuCapacity = static_cast<int>(extractNumericValue(hospitalJsonChunk, "icu"));
            currentHospital.icuOccupancy = static_cast<int>(extractNumericValue(hospitalJsonChunk, "icuOcc"));
            currentHospital.totalDoctors = static_cast<int>(extractNumericValue(hospitalJsonChunk, "docs"));
            currentHospital.availableDoctors = static_cast<int>(extractNumericValue(hospitalJsonChunk, "aDocs"));
            currentHospital.rating = extractNumericValue(hospitalJsonChunk, "rating");
            currentHospital.type = extractStringValue(hospitalJsonChunk, "type");
            
            if (currentHospital.type.empty()) {
                currentHospital.type = "hospital";
            }

            hospitalList.push_back(currentHospital);
            currentPos = objectEndPos + 1;
            
            if (fullInputJson[currentPos] == ']') break;
        }
    }

    int totalHospitals = hospitalList.size();
    if (totalHospitals == 0) { 
        cerr << "Error: No hospitals found in JSON"; 
        return 1; 
    }

    // --- Extract Algorithm Selection ---
    string algorithmName = extractStringValue(fullInputJson, "algo");
    if (algorithmName.empty()) {
        algorithmName = "Dijkstra";
    }

    // --- Calculate Patient Severity ---
    int patientSeverityScore = calculateSeverityScore(patientData.age, patientData.condition, patientData.isUnconscious, patientData.isBleeding);
    bool requiresIcu = patientSeverityScore >= 3;

    // --- Build Routing Graph ---
    // Node 0 is the Patient. Nodes 1 to N are the Hospitals.
    int totalGraphNodes = totalHospitals + 1;
    vector<vector<Edge>> routingGraphAdjacencyList(totalGraphNodes);

    for (int i = 0; i < totalHospitals; i++) {
        double dist = calculateHaversineDistance(patientData.latitude, patientData.longitude, hospitalList[i].latitude, hospitalList[i].longitude) * 1.3;
        routingGraphAdjacencyList[0].push_back({i + 1, dist});
        routingGraphAdjacencyList[i+1].push_back({0, dist});
    }

    // Add cross-connections between hospitals to make it a real network
    // This ensures different algorithms might find different paths if weights vary
    for (int i = 0; i < totalHospitals; i++) {
        for (int j = i + 1; j < totalHospitals; j++) {
            // Only connect nearby hospitals (e.g., within 5km of each other)
            double hDist = calculateHaversineDistance(hospitalList[i].latitude, hospitalList[i].longitude, hospitalList[j].latitude, hospitalList[j].longitude);
            if (hDist < 5.0) {
                routingGraphAdjacencyList[i+1].push_back({j + 1, hDist * 1.1});
                routingGraphAdjacencyList[j+1].push_back({i + 1, hDist * 1.1});
            }
        }
    }

    // --- Run All 6 Routing Algorithms (Multi-run for accuracy) ---
    const int RUN_COUNT = 1000;
    struct AlgoRun {
        string name;
        vector<double> distances;
        double timeMs;
    };
    vector<AlgoRun> allRuns;

    // Dijkstra
    {
        auto s = high_resolution_clock::now();
        vector<double> dists;
        for(int i=0; i<RUN_COUNT; i++) dists = runDijkstraAlgorithm(totalGraphNodes, routingGraphAdjacencyList, 0);
        auto e = high_resolution_clock::now();
        allRuns.push_back({"Dijkstra", dists, duration<double, milli>(e - s).count() / RUN_COUNT});
    }
    // BFS
    {
        auto s = high_resolution_clock::now();
        vector<double> dists;
        for(int i=0; i<RUN_COUNT; i++) dists = runBFSAlgorithm(totalGraphNodes, routingGraphAdjacencyList, 0);
        auto e = high_resolution_clock::now();
        allRuns.push_back({"BFS", dists, duration<double, milli>(e - s).count() / RUN_COUNT});
    }
    // Bellman-Ford
    {
        auto s = high_resolution_clock::now();
        vector<double> dists;
        for(int i=0; i<RUN_COUNT; i++) dists = runBellmanFordAlgorithm(totalGraphNodes, routingGraphAdjacencyList, 0);
        auto e = high_resolution_clock::now();
        allRuns.push_back({"Bellman-Ford", dists, duration<double, milli>(e - s).count() / RUN_COUNT});
    }
    // DFS
    {
        auto s = high_resolution_clock::now();
        vector<double> dists;
        for(int i=0; i<RUN_COUNT; i++) dists = runDFSAlgorithm(totalGraphNodes, routingGraphAdjacencyList, 0);
        auto e = high_resolution_clock::now();
        allRuns.push_back({"DFS", dists, duration<double, milli>(e - s).count() / RUN_COUNT});
    }
    // A*
    {
        auto s = high_resolution_clock::now();
        vector<double> dists;
        for(int i=0; i<RUN_COUNT; i++) dists = runAStarAlgorithm(totalGraphNodes, routingGraphAdjacencyList, 0, hospitalList, patientData);
        auto e = high_resolution_clock::now();
        allRuns.push_back({"A*", dists, duration<double, milli>(e - s).count() / RUN_COUNT});
    }
    // Floyd-Warshall
    {
        auto s = high_resolution_clock::now();
        vector<double> dists;
        for(int i=0; i<RUN_COUNT; i++) dists = runFloydWarshallAlgorithm(totalGraphNodes, routingGraphAdjacencyList, 0);
        auto e = high_resolution_clock::now();
        allRuns.push_back({"Floyd-Warshall", dists, duration<double, milli>(e - s).count() / RUN_COUNT});
    }

    // Default result (still used for backwards compatibility and main ranked list)
    double algorithmExecutionTimeMs = 0;
    vector<double> shortestDistancesFromPatient;
    for(const auto& run : allRuns) {
        if(run.name == algorithmName) {
            shortestDistancesFromPatient = run.distances;
            algorithmExecutionTimeMs = run.timeMs;
            break;
        }
    }
    if(shortestDistancesFromPatient.empty()) {
        shortestDistancesFromPatient = allRuns[0].distances;
        algorithmExecutionTimeMs = allRuns[0].timeMs;
    }

    // --- Score All Hospitals ---
    vector<ScoredHospital> scoredHospitalsList;
    
    for (int i = 0; i < totalHospitals; i++) {
        const Hospital& hospital = hospitalList[i];
        
        // Check if hospital is eligible to take the patient
        bool isEligible = (hospital.capacity - hospital.currentPatients) > 0 && 
                          hospital.availableDoctors > 0 && 
                          (!requiresIcu || (hospital.icuCapacity - hospital.icuOccupancy) > 0 || hospital.type == "dispensary");

        double travelDistance = shortestDistancesFromPatient[i + 1];
        
        // Apply a huge penalty score if ineligible to push them to the bottom of the list
        double finalScore = isEligible ? calculateHospitalScore(travelDistance, hospital, patientSeverityScore) : 1e9;

        scoredHospitalsList.push_back({i, travelDistance, finalScore, isEligible});
    }

    // --- Sort Hospitals by Final Score ---
    sort(scoredHospitalsList.begin(), scoredHospitalsList.end(), [](const ScoredHospital& a, const ScoredHospital& b) {
        return a.finalScore < b.finalScore;
    });

    // --- Output Results as JSON ---
    cout << "{\n";
    cout << "  \"algo\": \"" << algorithmName << "\",\n";
    cout << "  \"algoUsed\": \"" << algorithmName << "\",\n";
    cout << "  \"severity\": " << patientSeverityScore << ",\n";
    cout << "  \"needIcu\": " << (requiresIcu ? "true" : "false") << ",\n";
    cout << "  \"algoTimeMs\": " << algorithmExecutionTimeMs << ",\n";
    cout << "  \"nodeCount\": " << totalGraphNodes << ",\n";
    cout << "  \"edgeCount\": " << totalHospitals * 2 << ",\n";
    cout << "  \"ranked\": [\n";

    for (int i = 0; i < static_cast<int>(scoredHospitalsList.size()); i++) {
        const ScoredHospital& scoredResult = scoredHospitalsList[i];
        const Hospital& hospitalData = hospitalList[scoredResult.hospitalId];
        
        // Calculate travel time in minutes (assuming 50 km/h ambulance speed)
        double travelTimeMinutes = (scoredResult.travelDistance / 50.0) * 60.0;
        
        cout << "    {\n";
        cout << "      \"id\": "       << hospitalData.id << ",\n";
        cout << "      \"name\": \""   << hospitalData.name << "\",\n";
        cout << "      \"dist\": "     << scoredResult.travelDistance << ",\n";
        cout << "      \"travelTimeMin\": " << travelTimeMinutes << ",\n";
        cout << "      \"score\": "    << scoredResult.finalScore << ",\n";
        cout << "      \"eligible\": " << (scoredResult.isEligible ? "true" : "false") << ",\n";
        cout << "      \"load\": "     << (static_cast<double>(hospitalData.currentPatients) / hospitalData.capacity) << ",\n";
        cout << "      \"icuFree\": "  << (hospitalData.icuCapacity - hospitalData.icuOccupancy) << ",\n";
        cout << "      \"aDoc\": "     << hospitalData.availableDoctors << ",\n";
        cout << "      \"rating\": "   << hospitalData.rating << "\n";
        cout << "    }" << (i < static_cast<int>(scoredHospitalsList.size()) - 1 ? "," : "") << "\n";
    }

    cout << "  ],\n";
    cout << "  \"algoResults\": {\n";
    for (int i = 0; i < static_cast<int>(allRuns.size()); i++) {
        const auto& run = allRuns[i];
        cout << "    \"" << run.name << "\": {\n";
        cout << "      \"algoTimeMs\": " << run.timeMs << ",\n";
        cout << "      \"topHospital\": {\n";
        
        // Find top eligible hospital for this specific algo
        int topId = -1;
        double minDist = 1e18;
        for(int j=0; j<totalHospitals; j++) {
            bool isEligible = (hospitalList[j].capacity - hospitalList[j].currentPatients) > 0 && hospitalList[j].availableDoctors > 0;
            if(isEligible && run.distances[j+1] < minDist) {
                minDist = run.distances[j+1];
                topId = hospitalList[j].id;
            }
        }
        cout << "        \"id\": " << topId << ",\n";
        cout << "        \"dist\": " << (topId == -1 ? 0 : minDist) << "\n";
        cout << "      }\n";
        cout << "    }" << (i < static_cast<int>(allRuns.size()) - 1 ? "," : "") << "\n";
    }
    cout << "  }\n";
    cout << "}\n";
    
    return 0;
}
