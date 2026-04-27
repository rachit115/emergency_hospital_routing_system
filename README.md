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

All hospitals are ranked dynamically:

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
Live updates using JavaScript
🏗️ Tech Stack
Layer	Technology
Frontend	HTML, CSS, JavaScript
Map	Leaflet.js
API	OSRM, Nominatim
Backend	Node.js
Algorithm	C++ (Dijkstra)
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
User enters patient details
Location fetched (manual / GPS)
Severity calculated
Algorithm runs (C++ backend)
Hospitals ranked
Best hospital selected
Map routes displayed
Result dashboard shown
User proceeds to check-in
⚙️ How to Run
🔧 Requirements
Node.js (v16+)
g++ Compiler
npm / npx
🛠️ Setup & Execution
1️⃣ Clone Repository
git clone https://github.com/your-username/Hospital-Routing-System.git
cd Hospital-Routing-System
2️⃣ Compile C++ Backend
g++ -std=c++17 -O2 -o dijkstra *.cpp
3️⃣ Start Backend Server
node server.js
4️⃣ Run Frontend
npx serve .
