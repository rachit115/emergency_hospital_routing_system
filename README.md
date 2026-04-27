# emergency_hospital_routing_system
DAA 2nd year project 
🚑 Emergency Hospital Routing System

A full-stack web application that intelligently allocates patients to the most suitable hospital based on severity, distance, and resource availability using advanced graph algorithms.

🚀 Features
🧠 Smart Hospital Allocation

Automatically selects best hospital based on:

Patient severity (Low / Medium / High / Critical)
Distance from patient (real road distance using OSRM)
Hospital load (beds occupied vs capacity)
ICU availability (for critical cases)

👉 Uses optimized scoring:

score = distance × (1 + load)
🗺️ Real-Time Map Visualization
Displays patient & hospitals on map
Shows shortest route (fastest path)
Also shows alternative routes
Animated ambulance movement 🚑
📊 Multi-Algorithm Support

User can choose:

Dijkstra (Recommended ✅)
BFS (Unweighted demo)
Bellman-Ford (Negative edge demo)
📋 Hospital Comparison System
All hospitals ranked dynamically
Shows:
Distance
Load %
ICU availability
Doctors available
Final score
📊 Result Dashboard
Best hospital selection
Route distance & time
Algorithm performance (time, nodes, edges)
Comparison table
Explanation of selection
🏥 Hospital Check-In Panel
Select room type
Choose doctor
Budget calculation
Cost summary
Rating system ⭐
📍 Smart Location Search
Search places using name
Auto-suggestions (Nominatim API)
Auto-fill GPS coordinates
🚨 Emergency Mode
Uses current GPS automatically
Skips manual input
Faster allocation
🔄 Dynamic UI System
Tabs (Patient / Hospitals / Algorithm)
Sidebar + Map layout
Live updates using JS
🏗️ Tech Stack
Layer	Technology
Frontend	HTML, CSS, JavaScript
Map	Leaflet.js
API	OSRM, Nominatim
Backend	Node.js
Algorithm	C++ (Dijkstra Implementation)
Architecture	Modular + API-based
🗄️ Data Structure
🔹 Patient Input
Age
Condition
Symptoms (bleeding, unconscious)
Location (lat, lng)
🔹 Hospital Data
Capacity
Current patients
ICU beds
Doctors available
Rating
🔄 Application Flow

1️⃣ User enters patient details
2️⃣ Location fetched (manual / GPS)
3️⃣ Severity calculated
4️⃣ Algorithm runs (C++ backend)
5️⃣ Hospitals ranked
6️⃣ Best hospital selected
7️⃣ Map routes displayed
8️⃣ Result dashboard shown
9️⃣ User can proceed to check-in
