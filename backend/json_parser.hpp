#ifndef JSON_PARSER_HPP
#define JSON_PARSER_HPP

#include <string>

// Minimal JSON parser utilities to extract specific values by key name

// Extracts a string value for a given key from the JSON string
std::string extractStringValue(const std::string& jsonString, const std::string& key);

// Extracts a numeric value (double) for a given key from the JSON string
double extractNumericValue(const std::string& jsonString, const std::string& key);

// Extracts a boolean value for a given key from the JSON string
bool extractBooleanValue(const std::string& jsonString, const std::string& key);

#endif // JSON_PARSER_HPP
