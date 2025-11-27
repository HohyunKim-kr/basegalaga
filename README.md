# Base Galaga 🚀

A modern, premium sci-fi space shooter game built with Phaser 3 and integrated with Farcaster's Base network. Experience classic Galaga gameplay with a cyberpunk aesthetic and blockchain-powered features.

![Game Screenshot](https://via.placeholder.com/800x400?text=Base+Galaga+Screenshot)

## 🎮 Features

### Core Gameplay
- **10 Progressive Stages**: Increasing difficulty with unique enemy patterns
- **Boss Battles**: Epic encounters at stages 5 and 10
- **Weapon System**: Multiple weapon types with upgrade paths
  - Single Shot
  - Double Shot
  - Triple Shot
  - Spread Shot
  - Laser Beam
- **Power-up System**: Strategic item selection between stages
  - Shield Protection
  - Speed Boost
  - Fire Rate Increase
  - Health Restoration
  - Max Health Upgrade

### Premium Design
- **Cyberpunk Aesthetic**: Neon colors, glassmorphism, and sci-fi typography
- **Procedural Backgrounds**: Dynamic starfields and nebula effects
- **Particle Systems**: Explosions, trails, and visual effects
- **Responsive UI**: Optimized for both desktop and mobile

### Base Integration
- **Farcaster MiniApp**: Runs as a Farcaster Frame application
- **User Identity**: Display Farcaster username, FID, and profile
- **Social Sharing**: Share scores to Farcaster
- **Leaderboard**: Track high scores (stored locally)

### Mobile Support
- **Touch Controls**: Virtual D-pad and action buttons
- **Responsive Layout**: Adapts to different screen sizes
- **Optimized Performance**: Smooth 60 FPS gameplay

## 🛠️ Tech Stack

- **Game Engine**: [Phaser 3](https://phaser.io/) v3.87.0
- **UI Framework**: [RexUI](https://rexrainbow.github.io/phaser3-rex-notes/docs/site/ui-overview/)
- **Build Tool**: [Vite](https://vitejs.dev/) v5.4.21
- **Blockchain**: Base (Ethereum L2)
- **MiniApp SDK**: [@farcaster/miniapp-sdk](https://github.com/farcasterxyz/minikit)
- **Fonts**: Google Fonts (Orbitron, Rajdhani)

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd basegalagon
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment** (optional)
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Run development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 🎯 Game Controls

### Desktop
- **Arrow Keys**: Move spaceship
- **Space**: Fire weapons
- **Shift**: Activate special skill (when available)

### Mobile
- **Virtual D-Pad**: Move spaceship
- **Fire Button**: Auto-fire enabled
- **Skill Button**: Activate special ability

## 🏗️ Project Structure

```
basegalagon/
├── public/                 # Static assets
│   ├── enemies/           # Enemy sprites
│   ├── bg1.png           # Background images
│   └── character.png     # Player sprite
├── src/
│   ├── config/           # Configuration files
│   │   └── flockConfig.js
│   ├── entities/         # Game entities
│   │   ├── Boss.js
│   │   └── Enemy.js
│   ├── managers/         # Game managers
│   │   └── TouchControlManager.js
│   ├── scenes/           # Phaser scenes
│   │   ├── MainMenu.js
│   │   ├── GameScene.js
│   │   ├── GameOver.js
│   │   └── Leaderboard.js
│   ├── services/         # External services
│   │   └── FlockAPIService.js
│   ├── utils/            # Utility functions
│   │   ├── premiumStyle.js
│   │   ├── gameConfig.js
│   │   ├── weaponPatterns.js
│   │   ├── items.js
│   │   ├── score.js
│   │   ├── domUserHeader.js
│   │   └── rexUIHelper.js
│   └── main.js           # Entry point
├── index.html            # HTML template
├── minikit.config.ts     # Farcaster config
└── package.json
```

## 🎨 Design System

### Color Palette
- **Primary**: Deep Space Blues (#0a0f1e, #1a2332)
- **Accents**: Neon Cyan (#00f2fe), Neon Magenta (#ff00ff)
- **Highlights**: Neon Gold (#ffd700), Neon Red (#ff073a)

### Typography
- **Headers**: Orbitron (Bold, Sci-Fi)
- **Body**: Rajdhani (Clean, Modern)

### UI Components
- Holographic Buttons
- Glass Panels (Glassmorphism)
- Animated Backgrounds
- Particle Effects

## 🔧 Configuration

### Game Settings
Edit `src/utils/gameConfig.js` to modify:
- Stage configurations
- Enemy patterns
- Boss behaviors
- Scoring system

### Farcaster Integration
Edit `minikit.config.ts` to configure:
- App name and description
- Owner address
- Manifest settings

## 📱 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy to Vercel
1. Connect your repository to Vercel
2. Configure build settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Add environment variables (if needed)
4. Deploy!

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Phaser Team**: For the amazing game engine
- **RexUI**: For the UI plugin
- **Farcaster**: For the MiniApp SDK
- **Base**: For the blockchain infrastructure
- **Community**: For feedback and support

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/basegalagon/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/basegalagon/discussions)
- **Twitter**: [@yourhandle](https://twitter.com/yourhandle)

## 🎮 Play Now

Visit [https://your-app.vercel.app](https://your-app.vercel.app) to play!

---

Made with ❤️ and ☕ by [Your Name]
