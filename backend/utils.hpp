#ifndef UTILS_HPP
#define UTILS_HPP

#include <string>
#include "models.hpp"

// Calculates a severity score (1-4) based on patient's symptoms and age
int calculateSeverityScore(int age, const std::string& condition, bool isUnconscious, bool isBleeding);

// Calculates the straight-line Haversine distance between two GPS coordinates in kilometers
double calculateHaversineDistance(double lat1, double lng1, double lat2, double lng2);

// Calculates the final score for a hospital based on distance, capacity, and patient severity
double calculateHospitalScore(double distance, const Hospital& hospital, int severityScore);

#endif // UTILS_HPP