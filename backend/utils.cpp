#include "utils.hpp"
#include <cmath>
#include <algorithm>
#include <cctype>

const double PI = 3.14159265358979323846;

int calculateSeverityScore(int age, const std::string& condition, bool isUnconscious, bool isBleeding) {
    int score = 0;

    // Age factor
    if (age < 5 || age > 70)       score += 2;
    else if (age < 15 || age > 55) score += 1;

    // Condition factor
    std::string lowercaseCondition = condition;
    for (char& character : lowercaseCondition) {
        character = std::tolower(character);
    }

    if (lowercaseCondition.find("cardiac") != std::string::npos || lowercaseCondition.find("stroke") != std::string::npos) {
        score += 3;
    } else if (lowercaseCondition.find("fracture") != std::string::npos || lowercaseCondition.find("burn") != std::string::npos
               || lowercaseCondition.find("accident") != std::string::npos) {
        score += 2;
    } else if (lowercaseCondition.find("fever") != std::string::npos || lowercaseCondition.find("pain") != std::string::npos
               || lowercaseCondition.find("cut") != std::string::npos) {
        score += 1;
    }

    // Additional symptoms
    if (isUnconscious) score += 2;
    if (isBleeding)    score += 1;

    // Normalize to 1-4 scale
    if (score >= 6) return 4;
    if (score >= 4) return 3;
    if (score >= 2) return 2;
    return 1;
}

double calculateHaversineDistance(double lat1, double lng1, double lat2, double lng2) {
    const double EarthRadiusKm = 6371.0;
    double deltaLat = (lat2 - lat1) * PI / 180.0;
    double deltaLng = (lng2 - lng1) * PI / 180.0;
    
    double a = std::sin(deltaLat/2) * std::sin(deltaLat/2)
             + std::cos(lat1 * PI / 180.0) * std::cos(lat2 * PI / 180.0) * std::sin(deltaLng/2) * std::sin(deltaLng/2);
    
    return EarthRadiusKm * 2.0 * std::atan2(std::sqrt(a), std::sqrt(1-a));
}

double calculateHospitalScore(double distance, const Hospital& hospital, int severityScore) {
    // Basic load factor calculation
    double loadFactor = static_cast<double>(hospital.currentPatients) / hospital.capacity;
    double finalScore = distance * (1.0 + loadFactor);
    
    // ICU bonus: If the patient is highly critical and the hospital has free ICU beds, prioritize this hospital
    if (severityScore == 4 && hospital.type == "hospital" && (hospital.icuCapacity - hospital.icuOccupancy) > 0) {
        finalScore *= 0.5;
    }
    
    return finalScore;
}
