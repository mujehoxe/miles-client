import Reactotron from "reactotron-react-native";

Reactotron.setAsyncStorageHandler()
  .configure({
    name: "React Native Demo",
  })
  .useReactNative({
    networking: true,
    editor: false, // there are more options to editor
    errors: { veto: (stackFrame) => false }, // or turn it off with false
    overlay: false, // just turning off overlay
  })
  .connect();
