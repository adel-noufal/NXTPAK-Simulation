# 📦 NXTPAK Studio
### Generative AI & 3D Digital Twin for Circular Structural Packaging

> **Co-Engineered for the NXTPAK Hackathon**  
> Organized by **DMZ Cairo**, **Elaraby Group**, and **Photon X**

---

## 🎯 Executive Summary & Mission
Factory engineers at **Elaraby Group** (Egypt's leading consumer electronics and home appliances manufacturer) currently use toxic Expanded Polystyrene (EPS Styrofoam) protective cushions inside packaging boxes for products like Tornado TVs, Sharp microwaves, and blenders. EPS takes 500+ years to degrade in Egyptian landfills, cannot be economically recycled locally, and creates substantial carbon emissions.

**NXTPAK Studio** is an industrial-grade CAD/FEA simulation web platform that replaces EPS with **100% recyclable, origami-engineered honeycomb corrugated cardboard buffers**. 

---

## 💥 Breaking Simulation & Fracture Physics Engine

As required for true packaging integrity inspection, NXTPAK Studio features a **Physical Material Fracture & Breaking Simulator**:
1. **Dynamic 3D Shard & Debris Particle Explosion**:
   - Under destructive impact or brittle failure (e.g., EPS Styrofoam or extreme 2.0m drops), physical 3D debris shards violently fragment and scatter across the floor.
   - Euler-integrated rigid body physics with gravity, air resistance, and floor collision restitution.
2. **Appliance Surface Crack Propagation**:
   - For Tornado TVs: Procedural spiderweb glass crack pattern dynamically fractures the OLED front panel.
   - For Microwaves / Blenders: Glass window / pitcher shattering with crystalline fracture audio.
3. **Visceral Synthesized Fracture Sound Effects**:
   - Web Audio API synthesizer generates sharp structural snaps, glass shattering, and secondary floor clattering debris.
4. **Frame-by-Frame Fracture Scrubbing**:
   - An interactive slider (`0% -> 100% Crack Evolution`) allows engineers and hackathon judges to inspect microsecond crack propagation and spallation frame-by-frame.
5. **Real-Time Damage & Fracture Inspector**:
   - Displays live **Structural Integrity %**, **Fragment Count**, and component damage assessment.
   - Visually proves why **Honeycomb Cardboard protects without breaking** (controlled progressive buckling), while **EPS Styrofoam shatters brittlely**, destroying the appliance!

---

## 🚀 Advanced Feature Suite

### 1. 📤 Custom 3D CAD Model Upload & Auto-Ingestion
- **Universal CAD Formats**: Drag-and-drop or upload `.OBJ`, `.STL`, `.GLTF`, and `.GLB` files directly from Autodesk Inventor, SolidWorks, Rhino, or Blender.
- **Automated Bounding Volume & Mass Estimation**: Automatically computes real-world dimensions ($L \times W \times H$ in mm) and center-of-mass.
- **Instant Generative Cushion Synthesis**: Procedurally generates custom-fitted honeycomb/origami corner cushions and protective corrugated buffers hugging the new 3D model!
- **Pre-Loaded Elaraby R&D Sample Appliances**:
  - *Tornado Front-Load Washing Machine 8kg* ($600 \times 550 \times 850\text{ mm}$, $68\text{ kg}$).
  - *Sharp Inverter AC Outdoor Unit* ($780 \times 290 \times 540\text{ mm}$, $32.5\text{ kg}$).

### 2. ⚡ High-Speed Phantom Camera Playback & FEA Probes
- `1.0x Realtime`, `0.25x Slow-Motion` (laboratory camera), and `0.1x Ultra-Slow FEA Inspection`.
- **Vertical Laser Tape Measure**: Dynamic height laser guide ($0.5\text{m}$, $1.0\text{m}$, $1.5\text{m}$).
- **Velocity Vector Arrow**: 3D vector arrow scaling with instantaneous acceleration ($v(t) = \sqrt{2gh}$).
- **Secondary Slap-Down Rebound**: Realistic rotational angular momentum transfer on 45° corner impacts.
- **Interactive 3D FEA Probe**: Hover over any corner buffer to inspect local stress ($G$), strain ($18.5\%$), and safety state.
- **Dual-Trace Oscilloscope**: Plots Deceleration ($G(t)$) alongside Cumulative Absorbed Energy ($J(t)$).

### 3. 🌐 Full Bilingual Localization (English & العربية RTL)
- Seamless one-click language switcher (`العربية` ⇄ `English`).
- Native Arabic industrial typography (`Cairo` & `Tajawal` Google Fonts).
- Authentic Egyptian industrial engineering terminology (مجموعة العربي, كرتون قرص العسل, اختبار السقوط الديناميكي).

### 4. 📱 Augmented Reality (AR) & Factory Floor Inspection Mode
- **Procedural 1:1 Scale QR Code**: Scan with iOS Safari or Android Chrome to view the packaged appliance in real-scale Augmented Reality on the factory floor (WebXR & Apple QuickLook).
- **Simulated Factory Conveyor Line**: Switches the CAD environment to an active industrial roller conveyor line with yellow/black OSHA safety warning stripes.

### 5. 🆚 Live A/B Impact Benchmark (Toxic EPS vs. NXTPAK Honeycomb)
- Direct side-by-side comparative drop test simulation.
- Dual real-time oscilloscope curves showing EPS spiking to **54.8 G** (FAIL) vs. Honeycomb cushioning to **24.2 G** (PASS).

### 6. 🖨️ Official Elaraby Engineering Report & 3D CAD Mesh Export
- **Printable Technical Specification Sheet**: Official Elaraby R&D certificate with Bill of Materials (BOM), ISTA-1A test stamp, and carbon credit audit.
- **Wavefront 3D CAD (.OBJ) Export**: Single-click export of the procedural 3D packaging assembly to import into SolidWorks, Inventor, or Siemens NX.

### 7. 📐 2D Unfolded Cut & Crease Dieline (DXF / SVG Blueprint)
- Vector CAD blueprint ready for digital CNC cutting tables (Zünd / Kongsberg).
- Red through-cut lines, dashed green crease/fold lines, and cyan perforation slots.
- Zero-glue mortise-and-tenon interlocking tabs.

### 8. 🏆 Automated Judge Pitch Demo & Interactive Slide Deck
- Single-click automated presentation in the header demonstrating generative synthesis, exploded view, drop test, and the **4.63 Million EGP** annual savings.
- **Interactive Presentation & BMC Deck (`presentation.html`)**: Standalone slide deck featuring Problem, Solution, 9-block Business Model Canvas, Factory ROI & ESG metrics, competitive moat, and speaker notes.

---

## 🛠️ Technology Stack
- **3D Graphics & WebGL**: [Three.js](https://threejs.org/) (r128) with `OrbitControls`, `OBJLoader`, `GLTFLoader`, `STLLoader`, procedural Canvas fiber textures, dynamic lighting, and shadow mapping.
- **Physics & Fracture Simulation**: Custom packaging dynamics and rigid fragment physics engine computing viscoelastic crush, crack propagation, velocity vectors, and vertex strain heatmaps.
- **Audio Synthesis**: Native Web Audio API sound synthesizer producing tactile pneumatic lifts, drop whooshes, structural snaps, glass shatters, and pass chimes.
- **UI & CAD Theme**: HTML5, Vanilla JavaScript (ES Modules), TailwindCSS, custom CSS glassmorphism, and Lucide icons.

---

## 💻 Running the Application Locally
The frontend uses HTML/CSS/JavaScript and CDN libraries. Python 3 is needed to serve the project locally. On Windows, double-click `Run-NXTPAK.bat` to start the app; keep the terminal open while using it.

To run it locally:
```bash
python -m http.server 8080 --bind 127.0.0.1
```

---

## 🏛️ Acknowledgments
Developed for the **NXTPAK Hackathon 2026** organized by:
- **DMZ Cairo**
- **Elaraby Group**
- **Photon X**
