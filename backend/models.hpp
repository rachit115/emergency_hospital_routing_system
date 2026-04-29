#ifndef MODELS_HPP
#define MODELS_HPP

#include <string>

// Struct representing a hospital or dispensary in the network
struct Hospital {
    int id;
    std::string name;
    double latitude;
    double longitude;
    int capacity;
    int currentPatients;
    int icuCapacity;
    int icuOccupancy;
    int totalDoctors;
    int availableDoctors;
    double rating;
    std::string type; // "hospital" or "dispensary"
};

// Struct representing the patient needing emergency care
struct Patient {
    std::string name;
    int age;
    std::string condition;
    bool isUnconscious;
    bool isBleeding;
    double latitude;
    double longitude;
};

// Struct for representing edges in the routing graph
struct Edge {
    int destinationNode;
    double travelWeight; // Includes distance and traffic factor
};

// Struct to hold the calculated score and eligibility of each hospital
struct ScoredHospital {
    int hospitalId;
    double travelDistance;
    double finalScore;
    bool isEligible;
};

#endif // MODELS_HPP
