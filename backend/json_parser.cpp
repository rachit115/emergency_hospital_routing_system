#include "json_parser.hpp"

std::string extractStringValue(const std::string& jsonString, const std::string& key) {
    std::string searchKey = "\"" + key + "\":\"";
    size_t startPosition = jsonString.find(searchKey);
    
    if (startPosition == std::string::npos) {
        return "";
    }
    
    startPosition += searchKey.size();
    size_t endPosition = jsonString.find("\"", startPosition);
    
    return jsonString.substr(startPosition, endPosition - startPosition);
}

double extractNumericValue(const std::string& jsonString, const std::string& key) {
    std::string searchKey = "\"" + key + "\":";
    size_t startPosition = jsonString.find(searchKey);
    
    if (startPosition == std::string::npos) {
        return 0.0;
    }
    
    startPosition += searchKey.size();
    return std::stod(jsonString.substr(startPosition));
}

bool extractBooleanValue(const std::string& jsonString, const std::string& key) {
    std::string searchKey = "\"" + key + "\":";
    size_t startPosition = jsonString.find(searchKey);
    
    if (startPosition == std::string::npos) {
        return false;
    }
    
    startPosition += searchKey.size();
    return jsonString.substr(startPosition, 4) == "true";
}
