# Financial Platform Design Guidelines
**Reference Aesthetic:** MoneyControl-inspired with modern refinement

## Design Approach
**Reference-Based:** Drawing from MoneyControl's proven financial data presentation patterns, enhanced with contemporary design principles from Bloomberg Terminal and Yahoo Finance. Focus on information density balanced with readability, rapid data scanning, and trust-building visual hierarchy.

**Core Principle:** Maximum information accessibility with minimal cognitive load.

## Typography System

**Primary Font:** Inter (via Google Fonts CDN)
**Accent Font:** JetBrains Mono (for numbers, tickers, data)

**Hierarchy:**
- Headlines: Inter 700, 2xl-4xl
- Subheads: Inter 600, xl-2xl  
- Body: Inter 400, base-lg
- Financial Data: JetBrains Mono 500, sm-xl
- Captions/Meta: Inter 400, xs-sm
- Stock Tickers: JetBrains Mono 600, uppercase, tracking-wide

## Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12 for consistency
**Container:** max-w-7xl with px-4 md:px-6 lg:px-8
**Grid System:** 12-column for flexible content blocks

**Section Rhythm:**
- Hero: 60vh on desktop, auto on mobile
- Content sections: py-12 md:py-16
- Data cards: p-4 md:p-6
- Compact lists: py-2 spacing

## Component Library

**Navigation:**
- Sticky top bar with market indices ticker strip (auto-scrolling major indices)
- Main nav: Logo + Markets/News/Portfolio/Watchlist/Analysis links
- Search bar (prominent, right-aligned)
- Theme toggle + user account icons

**Hero Section:**
- Large featured market snapshot image (trading floor, stock exchange, financial district skyline)
- Overlaid glass-morphism card with live market summary
- 3-4 key indices with real-time numbers and percentage changes
- Buttons on hero: Blur background (backdrop-blur-md), semi-transparent

**Market Data Cards:**
- Compact card design: title, current value, change (±%), mini sparkline chart
- 3-4 cards per row on desktop, stack on mobile
- Quick-scan visual: green for gains, red for losses (standard financial convention)

**News Feed:**
- Two-column layout: Main story (left, 60%) + trending stories sidebar (right, 40%)
- Article cards: thumbnail, headline, source, timestamp, category tag
- Infinite scroll or pagination

**Stock Detail Panels:**
- Split layout: Price chart (top/left major area) + key metrics grid (right sidebar)
- Tabbed interface: Overview/Charts/News/Financials/Analysis
- Real-time price ticker at top with buy/sell action buttons

**Data Tables:**
- Zebra striping for row alternation
- Sortable columns (indicator icons)
- Sticky headers on scroll
- Compact row height for density

**Watchlist Component:**
- Editable list with drag-to-reorder
- Mini cards showing: Symbol, Name, Price, Change%, Action button
- Quick add via search

**Footer:**
- Four-column structure: About/Markets/Tools/Legal
- Newsletter signup with financial insights hook
- Social links + disclaimers
- Market status indicator (Market Open/Closed with countdown)

## Iconography
**Library:** Heroicons (via CDN)
- Trend arrows for market movement
- Chart icons for analysis sections
- Bell for alerts, bookmark for watchlist
- Search, menu, user profile standards

## Images Section

**Hero Image:**
- Large, professional photograph of global financial markets (NYSE trading floor, modern trading desk with multiple monitors, or abstract financial data visualization)
- Dimensions: Full-width, 60vh height
- Treatment: Subtle overlay gradient for text legibility
- Position: Top of homepage, spanning full viewport width

**News Thumbnails:**
- 16:9 aspect ratio images for article cards
- Content: Company logos, executive headshots, market events, charts
- Size: ~300x169px for main stories, ~150x85px for sidebar items

**Stock/Company Logos:**
- Square 1:1 logos for company identifiers
- Size: 40x40px to 80x80px depending on context
- Fallback: Colored initials on solid background

**Chart Placeholders:**
- Candlestick charts, line graphs, bar charts for stock performance
- Use library like Chart.js or Recharts for live data visualization

## Data Visualization Patterns

**Price Charts:** Line/candlestick with zoom controls, timeframe selector (1D/1W/1M/3M/1Y/All)

**Performance Indicators:** Color-coded percentage badges, directional arrows

**Heatmaps:** Grid view for sector performance at-a-glance

**Mini Sparklines:** Inline trend indicators next to ticker symbols

## Interaction Notes

- Minimal animations: Subtle number count-ups on load, smooth scrolling
- Hover states: Light elevation on cards (shadow increase)
- Real-time updates: Pulsing indicator for live data refresh
- Modal overlays for stock details (quick view without navigation)

## Responsive Behavior

**Desktop (lg+):** Multi-column layouts, sidebar visible, expanded charts

**Tablet (md):** Two-column max, collapsible sidebar, reduced chart size

**Mobile (base):** Single column, hamburger menu, swipeable charts, bottom tab navigation for key sections

**Critical:** Maintain data density even on mobile—use horizontal scrolling for tables rather than hiding columns.