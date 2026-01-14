# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-01-14

### 🎉 Major Improvements

#### Added
- **iframe Size Manipulation**: Revolutionary approach to enable high quality
  - iframes now render at 1280x720 internally
  - CSS `transform: scale()` used for visual sizing
  - YouTube detects the larger size and enables HD options
- **Debug Mode**: Added `debugHolodexQuality()` function for detailed diagnostics
- **Visual Debug Helper**: URL parameter `?debug=1` shows iframe sizes on-screen
- **Enhanced Quality Monitoring**: Automatic quality re-application every 3 seconds
- **Improved postMessage Integration**: Direct iframe communication for quality control

#### Changed
- **Core Algorithm**: Switched from min-size CSS to actual iframe dimensions with transform scaling
- **Content Script**: Complete rewrite to handle iframe scaling and container resizing
- **Injected Script**: Enhanced YT.Player wrapper with state change monitoring
- **Quality Application**: Multiple fallback methods for setting quality
- **Window Resize Handling**: Dynamic scale recalculation on window resize

#### Technical Details
- **Key Insight**: YouTube checks actual iframe render size, not CSS dimensions
- **Solution**: Render large iframe (1280x720), scale down with CSS transform
- **Benefit**: Mimics fullscreen behavior without requiring fullscreen mode
- **Result**: High quality options (720p, 1080p, 1440p, 4K) become available

### Fixed
- Previous version's ineffective min-size approach
- Quality settings not being applied consistently
- Player dimensions not triggering HD options

### Documentation
- Updated README with v2 architecture explanation
- Added detailed technical implementation notes
- Included new debug commands and usage examples

---

## [1.0.0] - 2026-01-14

### Initial Release

#### Added
- Basic Chrome extension structure
- Popup UI for quality selection
- Content script for iframe detection
- Injected script for YT.Player API interception
- Support for quality levels: 360p to 4K
- Settings synchronization via Chrome Storage
- Japanese localization (UI and documentation)
- Icon generation script using pngjs

#### Features
- Quality parameter injection (vq, hd)
- Min-size CSS enforcement
- YouTube Player API wrapping
- Manual quality control functions
- Settings persistence

#### Known Issues
- Quality improvements not consistently applied
- Min-size approach insufficient for YouTube's detection
- Required fullscreen for reliable quality change

---

## Release Notes

### v1.1.0 - The Scale Transform Update

This update fundamentally changes how the extension works, based on the discovery that **fullscreen mode enables quality changes because YouTube detects the actual iframe size**.

**Before (v1.0.0):**
- Set CSS min-width/min-height on iframes ❌
- YouTube ignored CSS-only sizing
- Required manual fullscreen + quality change

**After (v1.1.0):**
- Set actual iframe width/height to 1280x720 ✅
- Use CSS transform: scale() for visual sizing ✅
- YouTube detects large size, enables HD options ✅
- Works automatically without fullscreen! ✅

This approach mimics what happens during fullscreen mode, but applies it to all players at all times.

### Testing Recommendations

1. **Load the updated extension** in Chrome
2. **Visit** https://holodex.net/multiview
3. **Open Developer Console** (F12)
4. **Look for**:
   ```
   [Holodex Quality Enhancer] Enhanced iframe: 1280x720 scaled to XX%
   [Holodex Quality Enhancer] Available quality levels: ["hd1080", "hd720", ...]
   ```
5. **Run debug command**: `debugHolodexQuality()`
6. **Check quality**: Should see higher than 360p options available

### Feedback

If quality is still not improving:
1. Check console for error messages
2. Run `debugHolodexQuality()` and share output
3. Try `setHolodexQuality('hd1080')` manually
4. Open issue on GitHub with details

---

[1.1.0]: https://github.com/shirota773/high-qualirize-holodex/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/shirota773/high-qualirize-holodex/releases/tag/v1.0.0
