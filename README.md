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


### Cloudinary Integration and Database Seeding

The application is configured to upload all product images to Cloudinary, a cloud-based image management service.

*   **How it Works:** When a product is added via the API (either individually or in bulk), the backend server first uploads the image files to Cloudinary. Cloudinary then returns a unique, secure URL for each image. This URL is what gets stored in the `image` field of the product document in the MongoDB database.

*   **Why the DB Seed Script Isn't for Production:** A seed script (`backend/scripts/products_seed.js`) was created to quickly populate the database with mock data. However, this script should **only be used for local development and testing**. It bypasses the API and therefore does not upload any images to Cloudinary. It inserts placeholder image paths directly into the database. If you use this script to populate a staging or production database, all your products will have broken images. **Always use the API to add products in a live environment.**

### Automatic Database Seeding for Products

Populating the database with initial data (seeding) is a common requirement. However, since this project requires uploading product images to Cloudinary, a simple database script is not sufficient as it would bypass the image upload process.

*   **The Problem:** How to automatically seed the database with products when creating those products requires calling an API (to upload images) that is part of the very server we are trying to initialize.

*   **The Solution:** The best practice is to use a standalone script that calls the running server's API. This ensures all application logic, including image uploads, is executed. A `seed.js` script has been created for this purpose. It reads product data from a local JSON file `seed-data.json`, and then programmatically calls the `/api/product/add-bulk` endpoint to seed the database correctly.

*   **How to Run the Seed Script:**

   **Pre-requisites:** The backend server must be running.

    3.  **Run the Seed Script:** In a **new terminal window**, navigate to the `/backend` directory and run:
        ```bash
        npm run db:seed
        ```

    This will populate your database with the products from `backend/scripts/seed-data.json` and upload all associated images to Cloudinary. Ensure your `.env` file is correctly configured with your Admin and Cloudinary credentials before running the script. 
    NOTE: DB seeding could take up to 30 seconds. 


## Other Resolved Issues

### 1. JWT Token Authentication

*   **Problem:** The way admin login was set up was insecure and non-standard:
	•	Instead of using a proper, secure JWT (JSON Web Token), the system created a fake token by just joining the admin’s email and password into a string.
	•	This “token” was sent using a custom header called token (which is not how it’s usually done).
	•	Because of this, whenever someone tried to access admin-only routes, they got “Not Authorized” errors — since the system wasn’t verifying the token properly.

*   **Solution:** The authentication system was rewritten to use proper JWT best practices:
	1.	✅ When an admin logs in, a real JWT is created.
	•	This token includes some useful information, like "role": "admin".
	2.	✅ The token is now sent in the standard Authorization header (like this: Authorization: Bearer <token>), which is how most APIs expect it.
	3.	✅ The middleware that protects admin routes now:
	•	Reads the JWT from the correct header,
	•	Verifies the token is valid (not tampered with),
	•	And checks if the user really has an admin role.

   Why this is better:
	•	More secure: Real JWTs can’t be easily forged.
	•	More compatible: Works like most other APIs and clients expect.
	•	More flexible: You can later add more user roles or data into the JWT.

### 2. Bulk Product Upload

*   **Problem:** The API lacked a feature to add multiple products in a single request. The existing `POST /api/product/add` endpoint only supported adding one product at a time, which is inefficient for populating the database or managing large inventories.

*   **Solution:** A new endpoint, `POST /api/product/add-bulk`, was created to handle bulk product uploads.
    *   This endpoint accepts a `multipart/form-data` request.
    *   The product data is sent as a JSON string under a single field named `products`.
    *   Image files are sent with field names that follow a specific convention (`product_0_image_0`, `product_1_image_0`, etc.) to map them to their corresponding product in the JSON array.
    *   The backend controller (`addProductsBulk`) parses this data, uploads all images to Cloudinary, and then creates all the product documents in the database in a single, efficient `insertMany` operation.