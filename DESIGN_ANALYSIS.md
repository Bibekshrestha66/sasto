# Sajhabazaar UI/UX Design Analysis

## Key Design Elements

### Header & Navigation
- **Logo**: "Sasto" in green (left side)
- **Navigation**: Home, Auctions, Rent, Categories, About, Help
- **Search Bar**: Prominent search input with placeholder "Search for anything..."
- **Auth Buttons**: Login button (white text), Post Ad button (bright green background)
- **Design**: Clean, minimal white background with green accents

### Hero Section
- **Background**: Bright green gradient
- **Text**: White text - "Nepal's #1 Marketplace" (large heading)
- **Subheading**: "Buy, Sell, Rent, Auction - Everything you need in one place"
- **Quick Category Tags**: Mobile Phones, Cars & Vehicles, Property, Electronics (green badges)

### Live Auctions Section
- **Title**: "Live Auctions" with auction icon
- **Subtitle**: "Bid on exclusive items ending soon"
- **Cards**: Grid layout with green dashed borders
- **Card Content**:
  - "Live Auction" badge (orange/red)
  - Time remaining (e.g., "2h 45m")
  - Item title
  - Price in green (NPR format)
  - Number of bids
- **View All**: Green button with arrow

### Browse Categories Section
- **Grid Layout**: 6 columns on desktop
- **Category Cards**: Green dashed border boxes
- **Icons**: Large category icons (phone, TV, car, house, briefcase, wrench, etc.)
- **Category Name**: Below icon
- **Ad Count**: "2,450+ ads" format
- **View All**: Link to see more categories

### Featured Ads Section
- **Title**: "Featured Ads" with "View All" link
- **Grid Layout**: 3 columns
- **Card Design**:
  - Image placeholder (light gray)
  - "Featured" green badge
  - Item title
  - Price in green
  - Location with pin icon
  - Rating with star icon and seller name
  - "View" button (yellow background)
- **Dashed Green Border**: Around each card

### Color Scheme
- **Primary Green**: #00AA44 or similar (used for accents, buttons, prices)
- **Accent Orange**: For "Live Auction" badges
- **Yellow**: For "View" buttons and highlights
- **White**: Main background
- **Light Gray**: Image placeholders
- **Dark Gray**: Text and icons

### Typography
- **Headings**: Bold, dark gray/black
- **Body Text**: Regular weight, dark gray
- **Prices**: Bold, green color
- **Small Text**: Muted gray for secondary info

### Spacing & Layout
- **Container**: Centered with max-width
- **Padding**: Generous white space
- **Card Borders**: Green dashed borders (not solid)
- **Grid Gaps**: Consistent spacing between cards

### Interactive Elements
- **Buttons**: Green background with white text (Post Ad, View All)
- **Links**: Green text color
- **Hover Effects**: Likely subtle shadow or scale effects

### Footer
- **Links**: Multiple columns with Quick Links, Support, Company, Legal
- **Social Media**: Facebook, Instagram buttons
- **Copyright**: "Made with Manus"

## Design Patterns to Implement

1. **Green Dashed Borders**: Use for card containers instead of solid borders
2. **Green Accent Color**: Primary action buttons, prices, links
3. **Orange Badges**: For "Live Auction" status
4. **Yellow Buttons**: For secondary actions like "View"
5. **Generous Spacing**: White space between sections
6. **Icon-Based Categories**: Visual representation of categories
7. **Card-Based Layout**: Grid layout for listings and categories
8. **Location & Rating Info**: Include in listing cards
9. **Ad Count**: Show number of ads in each category
10. **Featured Badge**: Highlight featured listings

## Implementation Notes

- Use TailwindCSS with custom green color (#00AA44)
- Create reusable card components with dashed borders
- Implement responsive grid layouts (6 cols for categories, 3 cols for featured ads)
- Use consistent icon set for categories
- Ensure mobile responsiveness (stack to 1-2 columns on mobile)
