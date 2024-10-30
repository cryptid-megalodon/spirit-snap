# spirit-snap

This README discusses the client side app. It details how to execute operations
like building and testing a dev version of the app.

## How to build and run a developement version of the app

1. Install dependencies

   ```bash
   npx expo install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can select between Expo Go and the developement build. Expo Go is a sandbox
that does not have all features enables. Most apps will outgrow the sandbox.
Developement mode allows you to build a full featured app outside of the Expo
Go sandbox but is slightly more heavy weight.