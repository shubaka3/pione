# Pione React App (web)

This project is a converted React Native camera app to React + TypeScript for the web (Vite).

Quick start

1. cd into the folder

```bash
cd Pione-React-app
npm install
npm run dev
```

Notes

- The app uses browser camera APIs (getUserMedia) instead of Expo Camera.
- WebSocket URL is still hard-coded to ws://192.168.0.101:3000 — change as needed.
- Converted to TypeScript in `src/` (App.tsx, main.tsx).
# React TypeScript Web Application

This project was bootstrapped with Create React App using the TypeScript template.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm test`

Launches the test runner in the interactive watch mode.

### `npm run build`

Builds the app for production to the `build` folder.

## Project Structure

```
src/
  ├── components/    # Reusable React components
  ├── hooks/        # Custom React hooks
  ├── services/     # API and other services
  ├── types/        # TypeScript type definitions
  └── App.tsx       # Main application component
```

## Technologies Used

- React 18
- TypeScript
- React Router DOM
- Axios
- Styled Components