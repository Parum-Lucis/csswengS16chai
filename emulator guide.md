# Emulator Guide

## Installation
### Install `firebase-tools`.

run the following command in your terminal:
```bash
npm install -g firebase-tools
```

`firebase-tools` is the main CLI program that can configure and control firebase proejcts. This is also how we deploy our app into our project.

We will be installing `firebase-tools` globally (marked by `-g`). This means the associated files will live with your node installation and not in /node_modules. I was just a little scared of cross-platform usage.

### Login to the Firebase CLI
run anywhere:
```bash
firebase login
```

Ensure that you sign in with the account associated with our Firebase project. This will give your CLI authorization to work with our project.

### Install emulators
navigate to our project's root and run
```bash
firebase init emulators
```

This will start an installation wizard. Select the following options:

1) You will be prompted "*initializing within an existing Firebase project*". Proceed (Y).
2) You will be given which emulators to install. It should automatically select the ones we are using. If not, then select:
   - Authentication Emulator
   - Functions Emulator
   - Firestore Emulator
   - Hosting Emulator (not neccesary honestly)
3) Press enter to proceed.
4) It should display the ports where the services will live. Proceed and download the emulators.

Each step can take a while, especially the downloading.


## Running & Closing 

### Compile Cloud Functions
navigate to `/functions`.

If you are not developing any cloud functions then run:
```bash
npm run build
```
This will compile our cloud functions once. The emulator needs at the very least a compiled version of the typescript project into javascript to work. If you have compiled before, then you can skip this step.

but if you are developing and writing cloud functions, then run:
```bash
npm run build:watch
```

This will compile once and keep watching for changes. Everytime it detects a change, it will recompile. The emulator will detect the recompilation and update functions accordingly.

### Running the Emulators

navigate to our project's root.

Run the following:
```bash
npm run emulators
```

This should start the emulators. If it doesn't start up, try killing all command line processes through the task manager. You might also need to install **Java** since the emulators run on that language. 

the emulator will open a GUI which can usually be found in: `http://localhost:4000/`.

our project will expect the emulator to be running. If you want to connect to the actual firebase project, set `VITE_OVERRIDE_EMULATOR` to `true` (string, since environmental variables can't be boolean) in your `.env` file. You will have to create your own `.env` and place it in the root.

Another terminal might open. This is the actual emulator running in a Java shell. **do not touch this**.

At this point, you should be able to proceed and develop normally. You will no longer have to check the Firebase console. Instead, you can go to the emulator GUI and inspect the what your code does there. 

### Closing the Emulators

Open the terminal where you ran your emulator. It should be the one that contains the links and not the Java shell.

Hit `Ctrl + C`. This will safely shutdown the emulators. It should indicate that it's winding down, but if for some reason nothing happened, give it a moment (maybe 30 seconds??) and then close the terminal.

You might be left with the Java shell still. After closing the other terminal, feel free to close this one too.

The emulator will attempt to save your emulator's data into `/emulator-data`. There is a high chance it will not succeed.

It usually fails by **deleting** the folder `/emulator-data` and **creating** a new one called `/firebase-export-{randomHash}`. Simply **rename** this back to `/emulator-data`. If this doesn't work, then honestly just revert it back. It's just not worth it. **NOTE:** This error is possibly caused by vite. It tracks the folder and stops anything from deleting it. 

I will create a solution for this in the future.