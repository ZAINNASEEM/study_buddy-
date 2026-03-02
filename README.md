# Getting Started with Create React App


This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

⚠️ If you see a "Firebase: Error (auth/configuration-not-found)" message when trying to register users, enable Email/Password sign-in in the Firebase Console:

- Go to the Firebase Console → Project settings → Authentication → Sign-in method
- Enable **Email/Password** provider

You can also set the project id as an environment variable for convenience in development:
- Add `REACT_APP_FIREBASE_PROJECT_ID=your-project-id` to a `.env` file in the project root (this is used to generate direct links to console in error messages).


In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

---

## Local Emulator Usage ⚙️

You can run Firebase local emulators (Auth, Firestore, Storage) for development and for the optional emulator integration test.

- Start the emulators (from your project root):

  - Install Firebase CLI if you don't have it already:

    ```bash
    npm i -g firebase-tools
    ```

  - Start only the necessary emulators:

    ```bash
    firebase emulators:start --only auth,firestore,storage
    ```

- Environment variables (see `.env.example`):
  - `REACT_APP_USE_FIREBASE_EMULATORS=true`
  - `REACT_APP_FIRESTORE_EMULATOR_HOST=localhost`
  - `REACT_APP_FIRESTORE_EMULATOR_PORT=8080`
  - `REACT_APP_AUTH_EMULATOR_URL=http://localhost:9099`
  - `REACT_APP_STORAGE_EMULATOR_HOST=localhost`
  - `REACT_APP_STORAGE_EMULATOR_PORT=9199`

- Run the integration test (requires emulators to be running):

  ```bash
  npm test -- src/firebase/__tests__/emulatorSync.test.js -i
  ```

> Note: The test will automatically skip unless `REACT_APP_USE_FIREBASE_EMULATORS=true` is set in the environment.
