# PPIP Mail Application

This repository contains the frontend application for the PPIP mail management system.

## System Requirements

- Node.js 20.x or newer
- npm 

## Installation

1. Clone this repository:
```bash
git clone [repository-url]
cd fe-surat-ppip
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Configure environment file:
   Create a `.env.local` file in the root directory with the following configuration:

```
NEXT_PUBLIC_BASE_URL = "http://localhost:8080/api/v1"
NEXT_PUBLIC_PUBLIC_URL = "http://localhost:8080/api"
NEXT_PUBLIC_HOST_URL = "http://localhost:3000"
```

> **Important Note:**  
> - Replace `localhost:8080` with your backend domain or hostname
> - Replace `localhost:3000` with your frontend domain or hostname

## Local Development

To run the application in development mode:

```bash
npm run dev
# or
yarn dev
```

The application will run at [http://localhost:3000](http://localhost:3000).

## Production Build

1. Build the application:
```bash
npm run build
# or
yarn build
```

2. Run the built application:
```bash
npm run start
# or
yarn start
```

## Project Structure

- `/public` - Static assets such as images and document templates
- `/src/app` - Application pages and routes
- `/src/components` - Reusable React components
- `/src/hooks` - Custom React hooks
- `/src/services` - API services and integrations
- `/src/utils` - Utility functions

## Additional Information

For more information about development and deployment, please contact the development team.