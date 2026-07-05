# Spot On Shelves

A comprehensive web application for planning and installing wall shelves with precision. This tool helps users calculate optimal shelf placements, avoid obstructions, and provides detailed installation guidance for various wall types and mounting systems.

## 🎯 Features

### 📏 Precise Measurement Calculations
- Calculate exact shelf positions based on wall dimensions
- Support for both inches and centimeters
- Automatic spacing optimization between multiple shelves
- Collision detection with wall obstructions
- US/EU/UK/AU-NZ/JP obstruction presets for typical sizes and placement heights

### 🏗️ Visual Planning
- Interactive wall schematic with proportional scaling
- Real-time visualization of shelves and obstructions
- Color-coded legend for different obstruction types
- Grid overlay for easy reference
- Estimated stud-position overlay with configurable spacing and first-stud offset

### 🔧 Installation Guidance
- Customized tool recommendations based on wall material
- Step-by-step installation instructions
- Safety guidelines and best practices
- Weight capacity recommendations
- Stud finding guidance
- Weight badges that distinguish user-entered vs estimated item weights

### 🎨 Smart Alignment Options
- **Left Aligned**: Shelves aligned to the left side of the wall
- **Center Aligned**: Shelves centered on the wall
- **Right Aligned**: Shelves aligned to the right side of the wall

### 🧱 Multi-Wall Material Support
- **Drywall**: Standard residential construction
- **Plaster**: Older homes and commercial buildings
- **Concrete**: Basements and modern construction
- **Brick**: Masonry walls and exteriors

### 🔩 Mounting System Integration
- **Floating Shelves**: Hidden bracket systems
- **Bracketed Shelves**: Visible support brackets
- **L-Bracket**: Traditional angle bracket mounting

## 🚀 Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd spotOnShelves
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be available in the `dist` directory.

## 📖 How to Use

### 1. Project Setup
Start by configuring your project settings:
- **Units**: Choose between inches or centimeters
- **Wall Material**: Select your wall type (drywall, plaster, concrete, brick)
- **Mounting Type**: Choose your shelf mounting system
- **Alignment**: Set how shelves should be positioned horizontally

### 2. Wall Dimensions
Enter your wall's width and height measurements. These form the canvas for your shelf planning.

### 3. Adding Items
- Click "Add Item" to create shelves or wall-art entries (picture, poster, mirror, TV, art piece)
- Enter dimensions and weight (when known) for each item
- The system supports multiple mixed item types with independent positioning
- Weight guidance is labeled as user-entered vs estimated for clarity

### 4. Wall Obstructions (Optional)
Add any obstacles on your wall:
- **Bed**: Furniture that extends from the wall
- **Cabinet**: Built-in or mounted storage
- **Door**: Entry or closet doors
- **Window**: Any window openings
- **TV**: Mounted televisions
- **Other**: Any other obstruction

For each obstruction, specify:
- Type and dimensions (width × height)
- Position (distance from left wall and floor)

### 5. View Results
Once your inputs are valid, the application provides:
- **Visual Schematic**: Scaled diagram showing wall, shelves, and obstructions
- **Precise Measurements**: Exact positioning coordinates for each shelf
- **Installation Instructions**: Step-by-step mounting guide
- **Tools & Safety**: Customized equipment list and safety guidelines

## 🔧 Technical Architecture

### Built With
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling framework
- **Lucide React** - Beautiful icon library
- **Vite** - Fast build tool and development server

### Key Components

#### [`InputSection`](src/components/InputSection.tsx)
Orchestrates setup inputs and delegates major UI blocks to focused subcomponents:
- [`input/ItemsSection.tsx`](src/components/input/ItemsSection.tsx)
- [`input/WallDimensionsSection.tsx`](src/components/input/WallDimensionsSection.tsx)
- [`input/ObstructionsSection.tsx`](src/components/input/ObstructionsSection.tsx)
- [`input/PositioningControlsSection.tsx`](src/components/input/PositioningControlsSection.tsx)
- [`input/useBackgroundAligner.ts`](src/components/input/useBackgroundAligner.ts) for photo alignment state/logic

#### [`SchematicDisplay`](src/components/SchematicDisplay.tsx)
Renders the visual wall diagram with SVG, showing proportional relationships between wall, shelves, and obstructions.

#### [`MeasurementOutput`](src/components/MeasurementOutput.tsx)
Displays precise measurements and step-by-step installation instructions.

#### [`ToolsAndGuidance`](src/components/ToolsAndGuidance.tsx)
Provides customized tool recommendations, mounting advice, and safety guidelines based on project settings.

### Core Logic

#### [`calculations.ts`](src/utils/calculations.ts)
Primary entry point for calculation logic with shared submodules:
- Input validation
- Optimal shelf placement calculation
- Obstruction collision detection
- Unit conversion utilities via [`calculations/unitConversion.ts`](src/utils/calculations/unitConversion.ts)
- Stud layout helpers via [`calculations/studLayout.ts`](src/utils/calculations/studLayout.ts)
- Conflict helpers via [`calculations/conflicts.ts`](src/utils/calculations/conflicts.ts)

#### Types and Interfaces
Comprehensive TypeScript definitions in [`types/index.ts`](src/types/index.ts) ensure type safety across the application.

## 🛡️ Safety Features

The application includes comprehensive safety guidance:
- Material-specific drilling recommendations
- Weight capacity guidelines (Light: 5-15 lbs, Medium: 15-40 lbs, Heavy: 40+ lbs)
- Electrical and plumbing hazard warnings
- PPE (Personal Protective Equipment) recommendations
- Stud finding and secure mounting guidance

## 🎨 Design Philosophy

- **User-Focused**: Intuitive interface suitable for DIY enthusiasts and professionals
- **Safety-First**: Comprehensive safety warnings and best practices
- **Precision-Oriented**: Accurate calculations with clear measurement displays
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Accessible**: Clean typography, sufficient contrast, and logical navigation

## 🧪 Validation & Error Handling

The application includes robust validation:
- Positive dimension requirements
- Shelf size vs. wall size checking
- Obstruction boundary validation
- Real-time error display with specific guidance
- Prevents calculations with invalid inputs

## 📱 Responsive Design

Fully responsive layout that adapts to:
- Desktop computers (optimal experience)
- Tablets (touch-friendly interface)
- Mobile phones (compact but functional)

## ✅ Release QA Checklist (Recommended)

Before a public release, run this quick pass:
- iOS Safari + Android Chrome: verify schematic fits viewport with no horizontal clipping
- Small laptop: verify sticky schematic + tab bar behavior while scrolling
- Save / load / delete / import / export flows with and without background photos
- Print a drilling template at 100% scale and confirm the 1 in / 2 cm scale-check bars
- Validate accessibility basics: keyboard tab order, modal close, visible focus states

## ⚠️ Known Limits

- Stud overlays are estimates unless you enter measured stud locations.
- Obstruction standards are default starting presets and should be adjusted to measured values.
- Locale-based defaults are inferred from browser locale and may need manual override.
- The app does not detect hidden wiring/plumbing; always scan and verify before drilling.

## 🔄 Future Enhancements

Potential areas for expansion:
- Multiple wall support for corner installations
- 3D visualization capabilities
- Save/load project functionality
- Printable measurement templates
- Integration with home improvement retailers
- Metric/Imperial conversion tools
- Advanced load calculation features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE).

## ⚠️ Disclaimer

This tool provides calculations and guidance for shelf installation. Always:
- Verify measurements before drilling
- Mark and verify electrical, switch, and plumbing zones before drilling
- Consult professionals for complex installations
- Follow local building codes and regulations
- Use appropriate safety equipment
- Consider professional installation for heavy-duty applications

## 🆘 Support

For technical issues or feature requests, please create an issue in the repository with:
- Detailed description of the problem
- Steps to reproduce (if applicable)
- Screenshots or screen recordings
- Browser and device information

---

Built with precision, designed for safety, and crafted for confidence in your shelf installation projects.