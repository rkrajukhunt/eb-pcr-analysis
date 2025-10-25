# Feature Documentation

This document describes the features implemented in the EB PCR Analysis application.

## PCR Trend Indicators

### Overview
Visual indicators that show PCR (Put-Call Ratio) trends with arrows, colors, and percentage changes to help traders quickly identify market sentiment shifts.

### Features

#### 1. **Trend Direction**
- **Up Arrow** 🔼 (Green): PCR is increasing
- **Down Arrow** 🔽 (Red): PCR is decreasing
- **Flat Line** ➡️ (Grey): PCR is stable/neutral

#### 2. **Percentage Change**
Shows the percentage change from the previous reading:
- `+2.45%` - PCR increased by 2.45%
- `-1.80%` - PCR decreased by 1.80%

#### 3. **Absolute Change**
Displays the actual PCR value change:
- `+0.0250` - PCR increased by 0.025
- `-0.0180` - PCR decreased by 0.018

### Where You'll See Trend Indicators

#### 1. **PCR Analysis Table**
Each row in the PCR data table shows:
- PCR value in a colored chip (Green/Red/Orange based on threshold)
- Trend arrow with percentage change next to the PCR value
- Only shown when trend is not neutral (>0.5% change)

Example:
```
PCR: [1.25] ↑ +0.0150 (+1.21%)
```

#### 2. **Dashboard Summary Card**
The "Current PCR" card displays:
- Large PCR value
- Trend indicator below with change details
- "No change" message when trend is neutral

Example:
```
┌─────────────────┐
│      1.25       │  ← Current PCR
│   Current PCR   │
│  ↑ +0.0150      │  ← Trend indicator
│    (+1.21%)     │
└─────────────────┘
```

### How Trend is Calculated

#### Logic:
1. **Compare with Previous Reading**:
   - Current PCR vs Previous PCR from 3 minutes ago

2. **Calculate Change**:
   ```typescript
   pcrChange = currentPCR - previousPCR
   pcrChangePercent = (pcrChange / previousPCR) * 100
   ```

3. **Determine Trend**:
   - If change < 0.5%: `neutral` (no arrow shown)
   - If change > 0: `up` (green arrow ↑)
   - If change < 0: `down` (red arrow ↓)

### Color Coding

#### Trend Up (Bullish)
- **Color**: Green (#21ba45)
- **Icon**: trending_up (↗️)
- **Meaning**: PCR is increasing, more put options being bought

#### Trend Down (Bearish)
- **Color**: Red (#c10015)
- **Icon**: trending_down (↘️)
- **Meaning**: PCR is decreasing, more call options being bought

#### Trend Neutral
- **Color**: Grey (#666)
- **Icon**: trending_flat (→)
- **Meaning**: PCR change is less than 0.5%, stable

### Component Usage

The `TrendIndicator` component is reusable and can be used anywhere:

```vue
<TrendIndicator
  :trend="'up'"
  :change-percent="1.25"
  :change="0.0150"
  size="sm"
  :show-value="true"
/>
```

#### Props:
- `trend`: 'up' | 'down' | 'neutral' - Direction of change
- `changePercent`: number - Percentage change
- `change`: number (optional) - Absolute change value
- `size`: string - Icon size ('xs', 'sm', 'md', 'lg')
- `showValue`: boolean - Show the change text
- `showPercent`: boolean - Include percentage in display
- `inline`: boolean - Inline flex layout

### Technical Implementation

#### Files Modified/Created:

1. **src/types/market.ts**
   - Added `pcrChange`, `pcrChangePercent`, `trend` to PCRData interface

2. **src/services/marketData.ts**
   - Added `calculatePCRTrend()` function
   - Updated `generateMockPCRData()` to include trend data

3. **src/components/TrendIndicator.vue** (NEW)
   - Reusable component for displaying trends
   - Supports multiple sizes and display modes

4. **src/components/PCRAnalysisTable.vue**
   - Updated PCR column to show trend indicator
   - Added TrendIndicator import

5. **src/components/PCRDashboard.vue**
   - Added trend indicator to Current PCR card
   - Shows "No change" when neutral

### Benefits

1. **Quick Identification**: Instantly see if PCR is trending up or down
2. **Quantified Changes**: Know exactly how much PCR has changed
3. **Visual Clarity**: Color-coded arrows make trends obvious
4. **Context**: Percentage gives context to absolute changes
5. **Actionable**: Helps traders make faster decisions

### Future Enhancements

Potential improvements to trend indicators:

1. **Historical Trend**: Show trend over multiple time periods
2. **Trend Strength**: Indicate strong vs weak trends
3. **Alerts**: Notify when trend reverses
4. **Multi-Period**: Compare 3-min, 15-min, and hourly trends
5. **Momentum**: Calculate rate of change acceleration

### Examples

#### Example 1: Strong Bullish Trend
```
Previous PCR: 1.00
Current PCR:  1.15
Change:       +0.15 (+15.00%)
Trend:        ↑ (Up - Green)
```

#### Example 2: Mild Bearish Trend
```
Previous PCR: 1.20
Current PCR:  1.18
Change:       -0.02 (-1.67%)
Trend:        ↓ (Down - Red)
```

#### Example 3: Neutral/Stable
```
Previous PCR: 1.10
Current PCR:  1.10
Change:       +0.00 (+0.30%)
Trend:        → (Neutral - Grey - Hidden)
```

### Thresholds

Current thresholds for trend classification:

- **Neutral Threshold**: ±0.5%
  - Changes less than this are considered neutral
  - No arrow displayed

- **Significant Change**: >0.5%
  - Shows trend indicator
  - Color-coded based on direction

These thresholds can be adjusted in:
```typescript
// src/services/marketData.ts
if (Math.abs(pcrChangePercent) < 0.5) {
  trend = 'neutral'
}
```

### User Guide

**How to Read Trend Indicators:**

1. **Look for the arrow**:
   - ↑ = PCR going up (bullish)
   - ↓ = PCR going down (bearish)
   - No arrow = Stable

2. **Check the percentage**:
   - Small % (< 2%) = Mild trend
   - Medium % (2-5%) = Moderate trend
   - Large % (> 5%) = Strong trend

3. **Compare with market indicator**:
   - Trend ↑ + Bullish indicator = Strong bullish signal
   - Trend ↓ + Bearish indicator = Strong bearish signal
   - Trend contradicts indicator = Mixed signals

### Best Practices

1. **Don't Trade on Single Reading**: Use trends as confirmation, not sole signal
2. **Watch Consistency**: Multiple readings in same direction = stronger signal
3. **Consider Context**: Check OI change and volume alongside PCR trend
4. **Time of Day Matters**: Trends at market open/close can be misleading
5. **Use with Other Indicators**: Combine with price action, volume, etc.

## Conclusion

PCR Trend Indicators add a layer of visual clarity to the PCR Analysis platform, making it easier for traders to spot market sentiment shifts at a glance. The color-coded arrows and percentage changes provide immediate actionable information without needing to mentally calculate trends.
