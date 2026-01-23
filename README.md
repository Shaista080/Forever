# Forever E-commerce Website

Forever is a full-featured e-commerce platform built using the MERN stack and styled with Tailwind CSS. It includes a customer-facing frontend, an admin panel for managing the store, and a backend to handle data and API requests.

## Features

- **Frontend:**
  - Responsive and clean UI for browsing products.
  - User authentication (Login, Register).
  - Product search, filter, and sorting options.
  - Shopping cart functionality.
  - Checkout process with order summary and payment integration.

- **Admin Panel:**
  - Dashboard for managing products, orders, and users.
  - Add, edit, and delete products.
  - View customer orders and manage order status.

- **Backend:**
  - RESTful API for data management (products, users, orders).
  - Secure authentication using JWT.
  - Integration with MongoDB for database storage.

## Tech Stack

- **Frontend:** React, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Authentication:** JWT
- **Deployment:** Vercel

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Imtiaz4530/Forever
   ```
2. Install dependencies for the frontend:

   ```bash
   cd frontend
   npm install
   ```

3. Install dependencies for the backend:

   ```bash
   cd backend
   npm install
   ```

4. Add a `.env` file for environment variables in the frontend, admin and backend directory, including the following:

   ## Frontend & admin

   ```
   VITE_BACKEND_URL =<Your Backend URL>
   ```

   ## Backend

   ```
   MONGODB_URI=<Your MongoDB URI>
   JWT_SECRET=<Your JWT Secret>
   CLOUDINARY_API_KEY  = <Your Cloudinary API Key>
   CLOUDINARY_SECRET_KEY = <Your Cloudinary Secret key>
   CLOUDINARY_NAME = <Your Cloudinary Name>
   ADMIN_EMAIL = <Your MongoDB URI>
   ADMIN_PASSWORD = <Your Admin password>
   STRIPE_SECRET_KEY = <Your Stripe Secret>
   ```

````


### Running MongoDB with Docker

For a consistent and isolated development environment, you can run MongoDB in a Docker container.

Use the following command to start a MongoDB container:

```bash
docker run --name mongoDB -d -p 27017:27017 mongo
```

5. Run both frontend and backend:
```bash
npm run dev
````

## Screenshots

### FRONTEND

![Homepage](./frontend/public/f1.png)
![Collections](./frontend/public/f2.png)
![Login](./frontend/public/f3.png)
![Cart](./frontend/public/f4.png)
![Product Description](./frontend/public/f5.png)
![Cart with add products](./frontend/public/f6.png)
![Payment](./frontend/public/f7.png)
![Stripe](./frontend/public/f8.png)
![orders history](./frontend/public/f9.png)

### Admin Dashboard

![Login](./frontend/public/a1.png)
![Add Product](./frontend/public/a2.png)
![Lists](./frontend/public/a3.png)
![Orders](./frontend/public/a4.png)

### Cloudinary Integration

The application uses Cloudinary, a cloud-based image management service, for storing all product images. When an image is uploaded (e.g., via API endpoints or the seeding script), it is sent to Cloudinary, which returns a secure URL. This URL is then stored in the `image` field of the product document in the MongoDB database.

### Automatic Database Seeding for Products (Development Only)

To provide a consistent and populated development environment, the database seeding process is automated. The `seed.js` script (located in `backend/scripts/seed.js`) directly connects to MongoDB and utilizes the Cloudinary SDK to upload product images.

- **Purpose:** This script is designed exclusively for local development and testing. It clears existing product data and populates the database with mock data from `backend/scripts/seed-data.json`. It should **not** be used in production environments.

- **How to Run the Seed Script:**

  The seeding process is integrated into the backend development server startup.
  1.  **Start the Backend Development Server:** In the `/backend` directory, run:
      `bash
    npm run dev
    `
      This command will automatically:
  - Connect to MongoDB.
  - Clear all existing product data.
  - Upload images from `frontend/src/assets` to Cloudinary.
  - Populate the database with products from `backend/scripts/seed-data.json`.
  - Then, start the `node` server.

  Ensure your `.env` file is correctly configured with your MongoDB and Cloudinary credentials before running the script.
  NOTE: DB seeding could take up to 30 seconds, depending on the number of products and images.
