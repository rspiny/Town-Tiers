# Town Tiers - PvP Leaderboard

A competitive PvP ranking system for Hapless Studios' Town game mode, featuring a tiered ranking system with multiple categories.

## Features

- **Leaderboard Rankings**: Top 100 players ranked by overall points, Long Range, and CQC
- **Tier System**: 10-tier ranking system (LT5 → HT1)
- **Player Profiles**: View detailed player stats including tiers and total points
- **Admin Panel**: Manage players and Discord integration
- **Search Functionality**: Find players by username, region, or faction
- **Responsive Design**: Works on desktop and mobile devices

## Tier System

Tiers are ranked from lowest to highest:
- **LT5**: 10 points
- **HT5**: 20 points
- **LT4**: 30 points
- **HT4**: 40 points
- **LT3**: 50 points
- **HT3**: 60 points
- **LT2**: 70 points
- **HT2**: 80 points
- **LT1**: 90 points
- **HT1**: 100 points

Each player has tiers for:
- **Long Range**: Primary tier category
- **CQC**: Close Quarters Combat tier category

**Overall Points** = Long Range Points + CQC Points

## Usage

### Adding Players

1. Click the **Admin Panel** button
2. Click **+ Add Player**
3. Fill in:
   - Roblox Username (required)
   - Avatar Image URL (optional)
   - Region (required)
   - Faction (optional)
   - Long Range Tier (required)
   - CQC Tier (required)
   - Notes (optional)
4. Click **Add Player**

### Managing the Discord Link

1. Open the **Admin Panel**
2. Update the Discord invite link
3. Click **Save Link**

### Viewing Leaderboards

- Click tabs to switch between **Overall**, **Long Range**, and **CQC** rankings
- Use the search bar to find specific players
- Click on any player to view detailed stats

## Files

- `index.html` - Main HTML structure
- `styles.css` - Styling and responsive design
- `data.js` - Data management and tier calculations
- `app.js` - Application logic and interactivity
- `README.md` - Documentation

## Customization

### Changing Tier Point Values

Edit the `TIER_POINTS` object in `data.js`:

```javascript
const TIER_POINTS = {
    'LT5': 10,
    'HT5': 20,
    // ... etc
};
```

### Adding More Players

Edit the `players` array in `data.js` or use the Admin Panel UI.

### Styling

Modify color variables in `styles.css`:

```css
:root {
    --primary-red: #FF4444;
    --dark-bg: #0a0a0a;
    /* ... etc */
}
```

## Browser Support

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is open source and available for modification.
