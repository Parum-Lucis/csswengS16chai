# CHAI-MET
_Community Hope Alternative Incorporated - Management and Events Tracker_

---

## Overview

CHAI-MET is a web application built using React, TypeScript, and Vite. It aims to streamline, digitalize, and, centralize project monitoring, beneficiary interaction, and event coordination for CHAI Taguig. It replaces fragmented workflows and documentation, usually paper-based risking exposure to natural elements, wear and loss, with a unified digital solution. This project was developed as part of our Software Engineering course at De La Salle University.

---

## Features

- Login and authentication
- Role-based Access Control
- Volunteer Management
- Beneficiary Management
- Event Management
- Attendance Tracking
- Calendar View
- Notification System (Email/SMS)
- Data Processing (Import/Export CSV)

---

## Tech Stack

**Frontend:**
- [React 19](https://react.dev/) – Component-based UI framework
- [React Router 7](https://reactrouter.com/) – Declarative routing for React apps
- [Tailwind CSS 4](https://tailwindcss.com/) – Utility-first CSS framework for styling
- [Lucide React](https://lucide.dev/) – Icon library
- [React Toastify](https://fkhadra.github.io/react-toastify/) – Notification system
- [UUID](https://www.npmjs.com/package/uuid) – For generating unique IDs

**Build Tools:**
- [Vite 6](https://vitejs.dev/) – Lightning-fast frontend build tool with HMR
- [TypeScript 5](https://www.typescriptlang.org/) – Typed JavaScript for maintainable code

**Backend & Hosting:**
- [Firebase](https://firebase.google.com/) – Authentication, Firestore (database), Hosting, and Emulator Suite

**Environment & Utilities:**
- [dotenv](https://www.npmjs.com/package/dotenv) – Environment variable configuration
- [date-fns](https://date-fns.org/) – Modern JavaScript date utility library
- [util](https://nodejs.org/api/util.html) – Node.js utility module

**Testing:**
- [Jest](https://jestjs.io/) – JavaScript testing framework
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) – Testing utilities for React
- [@testing-library/jest-dom](https://testing-library.com/docs/ecosystem-jest-dom/) – Custom Jest matchers for DOM assertions
- [firebase-functions-test](https://firebase.google.com/docs/functions/unit-testing) – Unit testing for Firebase Functions

**Linting & Code Quality:**
- [ESLint](https://eslint.org/) – Linting for JavaScript and TypeScript
- [TypeScript ESLint](https://typescript-eslint.io/) – Type-aware linting support
- [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks) – Enforces React Hook rules
- [eslint-plugin-react-refresh](https://www.npmjs.com/package/eslint-plugin-react-refresh) – Linting support for React Fast Refresh

**Development Utilities:**
- [vite-plugin-qrcode](https://www.npmjs.com/package/vite-plugin-qrcode) – Displays local dev server QR code for mobile access

---

## Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [Firebase CLI](https://firebase.google.com/docs/cli) (for running emulators or deploying, if applicable)

### Steps

1. **Clone the repository**

```bash
git clone https://github.com/Parum-Lucis/csswengS16chai.git
cd csswengS16chai
npm install
npm run dev
```

2. **Add `.env` in functions folder**

each of these fields are very sensitive so keep them safe!
```
IPROG_API_TOKEN=`get this from the Iprog website.`
EMAIL=`email that will be used for email notification`
APP_PASSWORD=`special password for email`
```
3. **Running locally**

Please see [Emulator guide](/emulator%20guide.md) to run the project locally.

---

### 🚀 Deployment

CHAI-MET is deployed using **Firebase Hosting**.

### 🌐 Live Website

[https://chai-met.web.app](https://chai-met.web.app)

---

### 📦 Deployment Guide

Follow these steps to deploy the CHAI-MET web application to Firebase:

#### 1. Install Firebase CLI

[follow the guide here](https://firebase.google.com/docs/cli/) to download the CLI.

#### 2. initialize firebase
```bash
firebase login
```

### 3. build project
```
npm run build
cd functions
npm run build
```

### 4. deploy!
```
firebase deploy
```


