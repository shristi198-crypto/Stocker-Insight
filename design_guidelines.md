# Luxury Financial Dashboard Design Guidelines

## Design Approach
**Reference-Based:** MoneyControl's data-dense patterns elevated with Bloomberg Terminal's sophistication and a luxury golden-black aesthetic. Premium, high-contrast interface for professional analysts prioritizing rapid data scanning with visual prestige.

**Core Principle:** Elite-tier information delivery through luxurious visual refinement.

## Color System
**Backgrounds:**
- Primary: #0A0A0A (rich black)
- Secondary: #1A1A1A (elevated surfaces)
- Tertiary: #2A2A2A (cards, panels)

**Golden Accents:**
- Primary Gold: #D4AF37 (buttons, borders, highlights)
- Hover Gold: #E5C158 (interactive states)
- Subtle Gold: #B89230 (dividers, icons)

**Text:**
- Primary: #FFFFFF (headlines, key data)
- Secondary: #E5E5E5 (body text)
- Tertiary: #A0A0A0 (captions, meta)

**Financial Data:**
- Gains: #10B981 (emerald green)
- Losses: #EF4444 (vibrant red)
- Neutral: #D4AF37 (golden)

## Typography System
**Fonts:** Inter (primary) + JetBrains Mono (data) via Google Fonts CDN

**Hierarchy:**
- Display: Inter 700, 3xl-5xl, text-white
- Headlines: Inter 600, 2xl-3xl, text-white
- Subheads: Inter 600, xl-2xl, text-gray-200
- Body: Inter 400, base-lg, text-gray-200
- Financial Data: JetBrains Mono 600, sm-2xl, tabular-nums
- Tickers: JetBrains Mono 700, uppercase, tracking-widest, text-gold
- Captions: Inter 400, xs-sm, text-gray-400

## Layout System
**Spacing:** Tailwind units of 2, 4, 6, 8, 12
**Container:** max-w-7xl, px-6 lg:px-8
**Grid:** 12-column with 4-6 gap

**Section Rhythm:**
- Hero: 70vh desktop, 50vh mobile
- Content: py-16 md:py-24
- Cards: p-6 md:p-8
- Dense lists: py-3 gap-2

## Component Library

**Top Navigation Bar:**
- Sticky black bar (#0A0A0A) with 1px golden bottom border
- Left: Logo (golden accent) + Markets/Analysis/Portfolio/Watchlist links (white text)
- Center: Prominent search (golden border on focus, white text)
- Right: Real-time market ticker strip (auto-scroll 3-4 indices) + theme toggle + user avatar
- Height: 16 on mobile, 20 on desktop

**Hero Section:**
- Full-width image: Modern trading floor/data center with golden accent lighting
- Overlay: Semi-transparent black gradient (top to bottom)
- Centered glass-morphism card: backdrop-blur-lg, black/20% background, golden 1px border
- Card content: "Live Market Snapshot" headline, 4 major indices (name, value, %change), time stamp
- CTA buttons: Blurred background (backdrop-blur-md), golden border, white text, no hover effects

**Market Overview Dashboard:**
- 4-column grid on desktop (2 on tablet, 1 on mobile)
- Cards: Dark gray (#1A1A1A) background, golden top border (2px), p-6
- Content: Index/stock name (white), current price (JetBrains Mono, large, white), change value + % (colored), mini sparkline chart (golden line)
- Subtle shadow for depth

**Featured Analytics Panel:**
- Two-column split: Major chart (65% width) + metrics sidebar (35%)
- Chart area: Interactive candlestick/line chart with golden accents, white axis labels, dark grid
- Sidebar: Key metrics grid (P/E, Market Cap, Volume, 52W High/Low) in compact cards
- Tabbed navigation: Overview/Technical/Fundamentals/News (golden active indicator)

**News & Insights Feed:**
- Masonry grid layout: Featured story (full-width card) + 2-column recent stories below
- Article cards: 16:9 thumbnail image, headline (white, Inter 600), source + timestamp (gray), category pill (golden border, transparent fill)
- Card background: #1A1A1A with golden left border accent

**Data Tables:**
- Alternating row colors: #1A1A1A and #0A0A0A
- Headers: Sticky, golden text, sortable (golden arrow icons)
- Cells: White text for symbols/names, colored for changes, JetBrains Mono for numbers
- Borders: Subtle golden (#B89230, 0.5px)
- Compact row height (py-3) for density

**Watchlist Panel:**
- Floating sidebar (right side on desktop, collapsible)
- Background: #2A2A2A with golden border
- Item cards: Symbol (golden), company name (white), price + change (colored), star icon for remove
- Add button: Golden fill, black text, full-width at bottom
- Drag handles: Golden color

**Footer:**
- Three-column layout: Company info/Quick links/Market data
- Background: #0A0A0A with golden top border (1px)
- Newsletter signup: Golden border input, golden button
- Market status badge: "Market Open" (green dot) or "Closed" (red dot) with countdown
- Social icons: Golden on hover
- Legal links: Small gray text

## Images & Visuals

**Hero Image:**
- Professional trading floor or modern financial data center with warm lighting
- Full-width, 70vh height
- Dark overlay gradient for text contrast

**News Thumbnails:**
- 16:9 ratio for article cards (400x225px desktop, 300x169px mobile)
- Company logos, market events, executive portraits, chart visualizations

**Chart Visualizations:**
- Candlestick charts with golden accents
- Line graphs with golden trend lines
- Bar charts for volume with golden fills
- Heatmaps for sector performance (green-golden-red gradient)

## Iconography
**Library:** Heroicons via CDN
- Trend arrows (up/down for gains/losses)
- Chart bar, chart line icons
- Bell for alerts, bookmark for watchlist
- Search, menu, user icons
- All icons: White default, golden on active/hover states

## Data Visualization Patterns
- Price charts: Golden primary line, white secondary, dark grid
- Performance badges: Colored background with white text
- Sparklines: Golden micro-charts (h-8 to h-12)
- Heatmap grid: Color intensity from red through golden to green
- Volume bars: Golden with opacity variation

## Responsive Behavior
**Desktop (lg+):** Multi-column grids, sidebar visible, expanded charts with all controls
**Tablet (md):** 2-column max, collapsible sidebar, reduced chart complexity
**Mobile (base):** Single column, hamburger menu, horizontal scroll for tables, bottom navigation (golden active tab), swipeable chart timeframes

**Critical:** Preserve data density on mobile through horizontal scrolling and collapsible sections—never hide critical information.

## Interaction Principles
- Minimal motion: Smooth scrolls, subtle fade-ins only
- Hover elevations: Increase shadow depth on cards
- Real-time updates: Pulsing golden ring on data refresh
- Focus states: Golden outline (2px)
- Loading states: Golden shimmer effect
- Modal overlays: Backdrop blur with dark background