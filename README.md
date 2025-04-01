# Bit by Bit - Development Checklist

A retro-styled 8-bit golf app that tracks performance hole-by-hole and shot-by-shot using the Strokes Gained methodology.

## Tech Stack

- Expo (Managed Workflow)
- TypeScript
- React Navigation (Stack)
- AsyncStorage for local persistence
- Jest for unit/integration testing
- Functional components with hooks

---

### ✅ Initialization

- [x] Create Expo app with TypeScript support
- [x] Install React Navigation and AsyncStorage
- [x] Set up navigation with Home, Start Round, Hole Screen, and Summary screen

---

### 🏠 Home Screen

- [x] Display "Start Round" button
- [x] Display averages from last 10 rounds:
  - Driving
  - Approach
  - Short Game
  - Putting
- [x] Load data from AsyncStorage
- [x] Add test for home screen rendering and mock data display

---

### ⛳ Start Round Flow

- [x] Show existing courses (pulled from AsyncStorage)
- [x] Add option to "Add New Course" with:
  - Name
  - Tee Color (Red, White, Blue, Gold)
- [x] Save new course to AsyncStorage
- [x] Select course & tee → navigate to Hole 1
- [x] Tests for:
  - Selecting existing course
  - Adding new course
  - AsyncStorage writes

---

### 🕳 Hole Screen

- [x] If course has hole data (par & distance), prefill them
- [x] If not, require manual entry of:
  - Distance
  - Par (button selection)
- [x] Prevent shot entry until hole data is set
- [x] Log Shot 1 automatically:
  - Lie: Tee
  - Distance: full hole distance
- [x] Add "Add Shot" and "Shot Made" buttons
- [x] Add new shot entry fields:
  - Lie Condition (Fairway, Rough, Sand, Recovery, Green)
  - Distance to Hole (yards or feet)
- [x] Each time a shot is entered, calculate previous shot's distance and mark it as complete
- [x] "Shot Made" marks end of hole, enables "Next Hole" button
- [x] Tests for:
  - Data entry
  - Shot sequencing
  - Button navigation
  - Hole completion logic

---

### 🔁 Round Progression

- [x] Track hole numbers 1–18
- [x] Save shots for each hole
- [x] "Next Hole" navigates correctly
- [x] Summary screen shows after hole 18
- [x] Tests for:
  - Round state
  - Final hole transition

---

### 📊 Round Summary

- [x] Show summary of:
  - Total strokes
  - Shot count by lie type
  - Placeholder for Strokes Gained categories
- [x] "Save Round":
  - Saves shot-level data
  - Saves or updates course data (hole distances/par)
- [x] Tests for:
  - Summary rendering
  - Round save
  - Hole data persistence

---

### 🧠 Persistence (AsyncStorage)

- [x] Create reusable async helpers:
  - `saveData(key, value)`
  - `loadData(key)`
  - `deleteData(key)`
- [x] Store:
  - Courses
  - Rounds
  - Hole data
- [x] Tests for storage helpers

---

### ✅ Testing Strategy

- [x] All logic must be covered by unit or integration tests
- [x] Use mock data to validate storage, navigation, and entry flows
- [x] Prefer pure functions for shot logic, easy testability

---

### ⏳ After App is Working

- [ ] Integrate strokes gained data
- [ ] Implement stroke classification logic (Off-the-Tee, Approach, etc.)
- [ ] Add retro 8-bit styling and pixel fonts
- [ ] Add optional Firebase sync (if desired)
