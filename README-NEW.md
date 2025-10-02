# ⭐ StarFrame Animation Studio Website

A beautiful, warm animation studio website inspired by your vision and the cozy aesthetic of Blublu Studios. This project includes two distinct versions to choose from.

## 🏡 **NEW: Blublu-Inspired Version** (Recommended)

The latest version designed specifically for your studio with warm, cozy aesthetics and your actual team information.

### ✨ **What Makes It Special**

- **Warm Color Palette**: Cream backgrounds, golden browns, and soft peachy tones
- **Your Actual Team**: Features Vipshyana, Poulomi, and Samarth with their real roles
- **Core Services Focus**: 2D Animation, Character Design, and Digital Illustrations
- **Blublu Studios Inspired**: Cozy, welcoming design that feels like home
- **Your Philosophy**: Incorporates your studio's warm, inclusive vision

### 🎨 **Design Features**

- **Typography**: Elegant Playfair Display for headings, clean Inter for body text
- **Layout**: Masonry portfolio grid, beautiful service cards, team showcase
- **Animations**: Smooth scroll reveals, hover effects, parallax backgrounds
- **Real Images**: Uses your provided artwork and character designs
- **Mobile First**: Fully responsive design that works on all devices

### 💼 **Your Team Showcase**

#### 🎨 **Vipshyana - Creative Director & Lead Artist**
- The visionary behind StarFrame's magical look and feel
- Specializes in character design, illustration, and animation
- Shapes artistic direction and ensures each piece tells its story

#### 📖 **Poulomi - Story & Design Lead**  
- Develops scripts, storyboards, and designs that bring characters to life
- Visual storytelling expert rooted in emotion and meaning
- Co-directs creative projects alongside Vipshyana

#### ⚙️ **Samarth - Technical Producer & Manager**
- Organizational anchor handling timelines and client communication
- Manages technical workflows and ensures smooth deliveries
- Creates the foundation that allows creativity to flourish

### 🛠️ **Services Offered**

1. **2D Animation** - Starting from $800
   - Character animation, short films, explainer videos
   - Hand-crafted with emotional depth

2. **Character Design** - Starting from $300  
   - Original characters, concept art, character sheets
   - Every character has a story to tell

3. **Digital Illustrations** - Starting from $200
   - Book illustrations, concept art, promotional art
   - Crafted with love and attention to detail

## 🎬 **Original Version**

The first version with Disney-inspired modern aesthetics and comprehensive features.

### Features
- Purple gradient color scheme
- Complete portfolio with filtering
- Tutorial section for learning
- Multiple team member profiles
- Traditional animation studio layout

## 🚀 **Getting Started**

### Quick Launch
1. Navigate to the project folder: `cd /home/sam/starframe-website`
2. Open `launcher.html` in your browser to choose between versions
3. Or directly access:
   - **New Version**: `index-new.html`
   - **Original Version**: `index.html`

### Web Server Setup
```bash
# Start local server
cd /home/sam/starframe-website
python3 -m http.server 8081

# Access at http://localhost:8081
```

## 📁 **Project Structure**

```
starframe-website/
├── launcher.html              # Version selector page
├── index-new.html            # Blublu-inspired version (RECOMMENDED)
├── index.html                # Original version
├── css/
│   ├── style-new.css        # Warm, cozy styling
│   └── style.css            # Original styling
├── js/
│   ├── script-new.js        # Enhanced interactions
│   └── script.js            # Original functionality
├── images/
│   └── StarFrame Animation Studio/  # Your artwork
└── README-NEW.md            # This file
```

## 🎯 **Key Features (Both Versions)**

### Interactive Elements
- **Smooth Scrolling**: Buttery smooth navigation between sections
- **Form Validation**: Real-time feedback on commission forms
- **Portfolio Filtering**: Filter work by category (2D, Character Design, Digital Art)
- **Hover Effects**: Beautiful micro-interactions throughout
- **Mobile Menu**: Responsive hamburger navigation

### Animations & Effects
- **Scroll Reveals**: Elements animate in as you scroll
- **Parallax Background**: Hero image moves subtly with scroll
- **Hover Transforms**: Cards lift and scale on interaction
- **Loading Transitions**: Smooth page load animations
- **Progress Indicator**: Shows scroll progress at top of page

### Professional Features
- **Commission System**: Complete form with pricing and validation
- **Portfolio Showcase**: Masonry layout with real project examples
- **Team Profiles**: Detailed team member information with social links
- **Contact Integration**: Multiple ways to reach the studio
- **SEO Optimized**: Proper meta tags and semantic HTML

## 🌟 **Your Studio Philosophy**

> *"A warm, creative studio where imagination and emotion come alive, inviting dreamers to join the journey. We are a small, creative, collaborative studio devoted to creating art and animation that feels alive—filled with soul, peace, and a quiet kind of magic."*

The new website perfectly embodies this vision with:
- Warm, inviting color palette
- Inclusive, community-focused messaging  
- Personal touch with real team stories
- Emphasis on emotional storytelling
- Cozy, home-like aesthetic

## 🎨 **Using Your Artwork**

The website incorporates your provided images:
- **Hero Background**: `landscape.jpeg` - Sets the magical tone
- **About Section**: `3ee90258-34ad-4610-8f4e-03ff7631346c.jpeg` - Creative workspace
- **Service Examples**: Various character designs and illustrations
- **Portfolio Items**: Showcasing your diverse artistic range
- **Team Photos**: Placeholder structure for your team photos

## 📱 **Responsive Design**

Both versions are fully responsive:
- **Desktop**: Full layout with sidebar navigation
- **Tablet**: Adjusted grid layouts and touch-friendly interfaces  
- **Mobile**: Single column layout with hamburger menu
- **Touch Devices**: Optimized button sizes and hover alternatives

## 🚀 **Performance Optimizations**

- **Lazy Loading**: Images load as they come into view
- **Optimized CSS**: Efficient animations using transforms
- **Minimal JavaScript**: Performance-first approach
- **Web Fonts**: Optimized font loading strategies
- **Compressed Assets**: Optimized file sizes

## 💡 **Customization Guide**

### Changing Colors (New Version)
Edit `css/style-new.css` variables:
```css
:root {
    --primary-warm: #d4a574;      /* Main brand color */
    --primary-dark: #b8935f;      /* Darker variant */
    --secondary-warm: #e8d5b7;    /* Light accent */
    --background-cream: #fefcf8;   /* Page background */
}
```

### Adding Team Photos
Replace placeholder images in the team section:
```html
<img src="images/team/vipshyana.jpg" alt="Vipshyana">
<img src="images/team/poulomi.jpg" alt="Poulomi">  
<img src="images/team/samarth.jpg" alt="Samarth">
```

### Updating Services & Pricing
Modify the pricing in the commission section:
```html
<span class="price">From $800</span>  <!-- 2D Animation -->
<span class="price">From $300</span>  <!-- Character Design -->
<span class="price">From $200</span>  <!-- Digital Illustrations -->
```

## 🎯 **Next Steps**

1. **Choose Your Version**: Use the launcher to select your preferred design
2. **Add Team Photos**: Replace placeholder images with actual team photos
3. **Update Portfolio**: Add your latest completed projects
4. **Customize Content**: Adjust pricing, services, and descriptions as needed
5. **Deploy**: Upload to your web hosting service
6. **Domain Setup**: Point your domain to the website

## 🌐 **Deployment Options**

### Simple Hosting
- **Netlify**: Drag and drop the folder for instant deployment
- **Vercel**: Connect your GitHub repository for automatic updates
- **GitHub Pages**: Free hosting with custom domain support

### Traditional Hosting  
- **cPanel**: Upload files to public_html directory
- **FTP**: Transfer files to your web server
- **WordPress**: Use as custom theme or static pages

## ✨ **Special Features**

### The Blublu-Inspired Version Includes:
- **Warm Typography**: Elegant serif headings with clean sans-serif body text
- **Cozy Color Palette**: Cream, gold, and peachy tones
- **Personal Touch**: Real team stories and authentic studio philosophy
- **Service Focus**: Highlighting your three core strengths
- **Community Feel**: Inviting language that welcomes collaborators
- **Emotional Design**: Every element designed to feel warm and inclusive

---

**Made with ❤️ for StarFrame Animation Studio**

*Where imagination and emotion come alive, inviting dreamers to join the journey.*
