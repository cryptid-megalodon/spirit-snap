# spirit-snap

This README discusses the client side app. It details how to execute operations
like building and testing a dev version of the app.

## How to build and run a developement version of the app

1. Install dependencies

   ```bash
   npx expo install
   ```

2. Prebuild the native code (if needed)

   ```bash
   npx expo prebuild
   ```

3. Start the app

   ```bash
    # If running android.
    npx expo run:andriod
    # If running iOS.
    npx expo run:ios
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You should use the developement build. It is the build users will see in
production where Expo Go is a sandbox that may differ from prod.