/*
  main.cpp — Hospital Routing Backend (C++)
  Team: DAA-IV-T080 | Shantanu Devrani
  
  Input (stdin):  JSON with patient + hospitals data
  Output (stdout): JSON with ranked hospitals + algorithm statistics
*/

#include <iostream>
#include <vector>
#include <string>
#include <chrono>
#include <algorithm>

#include "models.hpp"
#include "utils.hpp"
#include "dijkstra_router.hpp"
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
        // Apply traffic factor of 1.3 to the base Haversine distance
        double distanceWithTraffic = calculateHaversineDistance(patientData.latitude, patientData.longitude, hospitalList[i].latitude, hospitalList[i].longitude) * 1.3;
        
        routingGraphAdjacencyList[0].push_back({i + 1, distanceWithTraffic});   // Patient to Hospital
        routingGraphAdjacencyList[i+1].push_back({0, distanceWithTraffic});     // Hospital to Patient (undirected graph)
    }

    // --- Run Dijkstra Routing Algorithm ---
    auto executionStartTime = high_resolution_clock::now();
    
    vector<double> shortestDistancesFromPatient = runDijkstraAlgorithm(totalGraphNodes, routingGraphAdjacencyList, 0);
    
    auto executionEndTime = high_resolution_clock::now();
    double algorithmExecutionTimeMs = duration<double, milli>(executionEndTime - executionStartTime).count();

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
    cout << "  \"severity\": " << patientSeverityScore << ",\n";
    cout << "  \"needIcu\": " << (requiresIcu ? "true" : "false") << ",\n";
    cout << "  \"algoTimeMs\": " << algorithmExecutionTimeMs << ",\n";
    cout << "  \"nodeCount\": " << totalGraphNodes << ",\n";
    cout << "  \"edgeCount\": " << totalHospitals * 2 << ",\n";
    cout << "  \"ranked\": [\n";

    for (int i = 0; i < static_cast<int>(scoredHospitalsList.size()); i++) {
        const ScoredHospital& scoredResult = scoredHospitalsList[i];
        const Hospital& hospitalData = hospitalList[scoredResult.hospitalId];
        
        cout << "    {\n";
        cout << "      \"id\": "       << hospitalData.id << ",\n";
        cout << "      \"name\": \""   << hospitalData.name << "\",\n";
        cout << "      \"dist\": "     << scoredResult.travelDistance << ",\n";
        cout << "      \"score\": "    << scoredResult.finalScore << ",\n";
        cout << "      \"eligible\": " << (scoredResult.isEligible ? "true" : "false") << ",\n";
        cout << "      \"load\": "     << (static_cast<double>(hospitalData.currentPatients) / hospitalData.capacity) << ",\n";
        cout << "      \"icuFree\": "  << (hospitalData.icuCapacity - hospitalData.icuOccupancy) << ",\n";
        cout << "      \"aDoc\": "     << hospitalData.availableDoctors << ",\n";
        cout << "      \"rating\": "   << hospitalData.rating << "\n";
        cout << "    }" << (i < static_cast<int>(scoredHospitalsList.size()) - 1 ? "," : "") << "\n";
    }

    cout << "  ]\n}\n";
    
    return 0;
}
