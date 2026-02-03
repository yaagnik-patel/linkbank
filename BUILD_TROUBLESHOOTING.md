# LinkBank EAS Build Troubleshooting Guide

## Fixed Issues ✅

### 1. Platform-Specific AuthContext
**Problem**: App was trying to use native Google Sign-In on web builds
**Solution**: 
- Added platform checks in `AuthContext.js`
- Moved Google Sign-In configuration inside useEffect
- Created separate `AuthContext.web.js` for web builds

### 2. Module Resolution
**Problem**: Babel alias causing issues in production builds
**Solution**:
- Updated `metro.config.js` with proper platform extension resolution
- Added module alias configuration

### 3. Plugin Configuration
**Problem**: Google Sign-In plugin not properly configured for builds
**Solution**:
- Updated `app.json` with proper plugin configuration
- Added Android build properties (SDK versions, build tools)

### 4. Build Configuration
**Problem**: EAS build not optimized for caching
**Solution**:
- Updated `eas.json` with cache settings
- Added build type specification for Android

## Build Commands

### Clean Build
```bash
# Clean and rebuild
npm run clean
npm run build:android

# Or use the build script
node build.js
```

### Development Build
```bash
eas build --platform android --profile development
```

### Production Build
```bash
eas build --platform android --profile production
```

## Common Issues & Solutions

### Issue: "Google Sign-In not available"
**Cause**: Platform check missing
**Solution**: Already fixed with Platform.OS checks

### Issue: Module resolution errors
**Cause**: Babel/Metro configuration issues
**Solution**: Metro config updated with platform extensions

### Issue: Build cache problems
**Cause**: Stale cache
**Solution**: 
```bash
eas build --clear-cache
# or
npm run clean:cache
```

### Issue: Firebase configuration errors
**Cause**: Missing or incorrect Firebase config
**Solution**: Ensure `google-services.json` is present and correctly configured

## Pre-Build Checklist

- [ ] Firebase project configured correctly
- [ ] Google Services JSON file in project root
- [ ] All dependencies installed (`npm install`)
- [ ] No syntax errors in TypeScript files
- [ ] Platform-specific imports working correctly
- [ ] Metro configuration updated

## Environment Variables

The build now includes:
- `npm_config_legacy_peer_deps=true` for dependency resolution
- Proper Android SDK versions (34)
- Cache optimization enabled

## Error Handling & Crash Detection 🛡️

### Comprehensive Error Monitoring
The app now includes:
- **Error Monitoring System**: Tracks all errors with context, timestamps, and platform info
- **Crash Detection**: Automatically detects when app is in crash state (5+ errors in 1 minute)
- **Auto-Recovery**: Attempts automatic recovery when crash state is detected
- **Health Monitoring**: Checks Firebase connectivity, network status, and memory usage

### Error Logging
All errors are logged with:
- Error message and stack trace
- Context (where error occurred)
- Platform information
- Timestamp
- Additional context data

### Recovery Strategies
When crash state is detected:
1. Clear error logs
2. Reset app state (preserves important data)
3. Clear caches
4. Attempt to recover automatically

### Debug Information
In development mode, you'll see:
- Detailed error information
- Crash state status
- System status including recent errors
- Performance metrics

### Error Categories
- **Authentication Errors**: Firebase auth issues with user-friendly messages
- **Network Errors**: Connection problems with retry suggestions
- **Component Errors**: React component failures with stack traces
- **Performance Issues**: Slow operations and memory warnings

## Next Steps

1. Run `npm run clean` to fix any dependency issues
2. Try building with `npm run build:android`
3. If still failing, clear EAS cache: `eas build --clear-cache`
4. Check build logs for specific error messages
5. Monitor console for error monitoring logs during development

## Error Monitoring in Development

During development, you'll see detailed error logs like:
```
[Error Monitor - AuthContext]: {message: "...", stack: "...", platform: "android", timestamp: "..."}
[Performance] login: 1234ms
[CrashDetector] Crash state detected, attempting recovery
[HealthMonitor] Unhealthy state detected: {...}
```

This comprehensive error handling should prevent most crashes and provide clear information about any issues that do occur.

## Support

If issues persist:
1. Check EAS build logs for specific error messages
2. Verify Firebase project settings
3. Ensure all environment variables are set correctly
4. Try building with `--verbose` flag for detailed logs
