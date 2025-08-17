# 🎨 Figma Design System

A modern, beautiful web design system inspired by Figma's design principles. This project showcases a complete design system with interactive components, smooth animations, and a responsive layout.

![Figma Design System](https://img.shields.io/badge/Design-Figma%20Style-blueviolet)
![Responsive](https://img.shields.io/badge/Responsive-Yes-green)
![Modern UI](https://img.shields.io/badge/UI-Modern-blue)

## ✨ Features

### 🎯 Core Components
- **Navigation Bar** - Fixed header with smooth scroll effects and mobile menu
- **Hero Section** - Eye-catching hero with floating animated cards
- **Feature Cards** - Interactive cards with hover effects
- **Component Showcase** - Tabbed interface displaying various UI components
- **Modal System** - Beautiful modal with backdrop blur
- **Forms** - Styled form elements with validation
- **Statistics** - Animated number counters
- **CTA Section** - Call-to-action with gradient backgrounds
- **Footer** - Comprehensive footer with social links

### 🎨 Design System
- **Color Palette** - Carefully selected colors with primary, secondary, and neutral tones
- **Typography** - Inter font with consistent sizing system
- **Spacing** - Systematic spacing using CSS custom properties
- **Shadows** - Multiple shadow levels for depth
- **Border Radius** - Consistent corner radius system
- **Transitions** - Smooth animations throughout

### 🚀 Interactive Features
- Tab switching for component showcase
- Modal open/close functionality
- Mobile responsive menu
- Scroll-based animations
- Parallax effects
- Button ripple effects
- Form validation
- Number counter animations

## 📁 Project Structure

```
figma-design-system/
├── index.html          # Main HTML file
├── styles.css          # Complete CSS with design tokens
├── script.js           # JavaScript for interactivity
├── package.json        # Project configuration
└── README.md          # Documentation (this file)
```

## 🚀 Quick Start

### Option 1: Direct Opening
Simply open the `index.html` file in your web browser.

### Option 2: Using Python (Recommended)
```bash
# Python 3
python3 -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```
Then open http://localhost:8000 in your browser.

### Option 3: Using Node.js
```bash
# Install dependencies (optional)
npm install

# Run with live-server
npm run serve

# Or run with browser-sync for auto-reload
npm run dev
```

## 🎨 Customization

### Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --primary-color: #667EEA;
    --secondary-color: #764BA2;
    --success-color: #48BB78;
    /* ... more colors */
}
```

### Typography
Change the font family or sizes:
```css
:root {
    --font-family: 'Inter', sans-serif;
    --font-size-base: 1rem;
    /* ... more sizes */
}
```

### Spacing
Adjust the spacing system:
```css
:root {
    --spacing-xs: 0.25rem;
    --spacing-sm: 0.5rem;
    /* ... more spacing */
}
```

## 📱 Responsive Design

The design system is fully responsive with breakpoints at:
- **Mobile**: < 480px
- **Tablet**: < 768px
- **Desktop**: > 768px

## 🌟 Key Features Explained

### Floating Cards Animation
The hero section features floating cards that move up and down continuously, creating a dynamic visual effect.

### Tab Component
Click on different tabs in the Components Showcase section to see various UI elements.

### Modal System
Click the "Open Modal" button to see the modal component with backdrop blur effect.

### Scroll Animations
Elements animate into view as you scroll down the page using Intersection Observer API.

### Mobile Menu
On mobile devices, click the hamburger menu to see the responsive navigation.

## 🛠️ Technologies Used

- **HTML5** - Semantic markup
- **CSS3** - Modern CSS with custom properties
- **JavaScript** - Vanilla JS for interactivity
- **Google Fonts** - Inter font family
- **CSS Grid & Flexbox** - Modern layout techniques

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Feel free to:
1. Fork the project
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 👏 Acknowledgments

- Inspired by Figma's design principles
- Uses Inter font by Rasmus Andersson
- Icons and graphics are inline SVG

## 📞 Contact

For questions or suggestions, please open an issue on GitHub.

---

Made with ❤️ by DesignFlow Team
