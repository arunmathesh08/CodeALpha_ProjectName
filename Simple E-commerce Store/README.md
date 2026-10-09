# 🛒 ShopEase — Full-Stack E-Commerce Website

A complete, functional, responsive full-stack e-commerce web application built with HTML, CSS, JavaScript, Node.js, Express.js, MongoDB, and Mongoose.

---

## 📋 Project Overview

ShopEase is a modern e-commerce platform where users can:

- Browse products with beautiful product cards
- Search products in real-time by name, category, or description
- Filter products by category (Electronics, Fashion, Accessories, Home)
- Sort products by price (Low to High / High to Low)
- View detailed product information
- Add products to a shopping cart
- Manage cart quantities and remove items
- Persist cart across page refreshes (localStorage)
- Proceed through a full checkout flow
- Enter customer and delivery details with validation
- Select a demo payment method (COD or Demo Card)
- Place an order stored in MongoDB
- View order confirmation with a real generated Order ID

---

## ✨ Features

| Feature                  | Description                                              |
|--------------------------|----------------------------------------------------------|
| Product Catalog          | 8 products loaded from MongoDB via REST API              |
| Real-Time Search         | Instant search across name, category, description        |
| Category Filter          | Filter by Electronics, Fashion, Accessories, Home        |
| Price Sort               | Sort ascending or descending by price                    |
| Product Details          | Full product page with quantity selector & stock check    |
| Shopping Cart            | Add, increase, decrease, remove — persisted in localStorage |
| Checkout                 | Customer form with full validation                       |
| Demo Payment             | Cash on Delivery or Demo Card Payment                    |
| Order Processing         | Orders saved to MongoDB with unique Order IDs            |
| Order Confirmation       | Real order details displayed from backend response       |
| Responsive Design        | Works on desktop, tablet, and mobile                     |
| Loading States           | Spinners shown during API calls                          |
| Error Handling           | Graceful error messages for all failure scenarios         |
| Notifications            | Toast notifications for cart actions                     |

---

## 🛠️ Technology Stack

| Layer       | Technology           |
|-------------|----------------------|
| Frontend    | HTML5, CSS3, Vanilla JavaScript |
| Backend     | Node.js, Express.js  |
| Database    | MongoDB, Mongoose    |
| Cart        | Browser localStorage |

---

## 📦 Requirements

Before running this project, make sure you have:

- **Node.js** (v16 or higher) — [Download](https://nodejs.org/)
- **MongoDB** (local installation or MongoDB Atlas cloud) — [MongoDB Atlas](https://www.mongodb.com/atlas)
- **Modern Web Browser** (Chrome, Firefox, Edge, Safari)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Simple E-commerce Store"
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file inside the `server/` directory:

```bash
cp ../.env.example .env
```

Then edit `.env` with your MongoDB connection string:

```env
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/shopease?retryWrites=true&w=majority
PORT=5000
```

**For local MongoDB:**
```env
MONGODB_URI=mongodb://localhost:27017/shopease
PORT=5000
```

### 4. Seed Sample Products

```bash
node seed.js
```

This inserts 8 sample products into MongoDB. It's idempotent — running it again won't create duplicates.

### 5. Start the Server

```bash
npm start
```

### 6. Open in Browser

Navigate to: **http://localhost:5000**

---

## 📡 API Documentation

### Products

| Method | Endpoint             | Description          |
|--------|----------------------|----------------------|
| GET    | `/api/products`      | Get all products     |
| GET    | `/api/products/:id`  | Get product by ID    |
| POST   | `/api/products`      | Create a product     |
| PUT    | `/api/products/:id`  | Update a product     |
| DELETE | `/api/products/:id`  | Delete a product     |

### Orders

| Method | Endpoint            | Description          |
|--------|---------------------|----------------------|
| POST   | `/api/orders`       | Create an order      |
| GET    | `/api/orders/:id`   | Get order by Order ID |

### Status Codes

| Code | Meaning                    |
|------|----------------------------|
| 200  | Success                    |
| 201  | Created                    |
| 400  | Bad Request / Validation Error |
| 404  | Not Found                  |
| 500  | Internal Server Error      |

---

## 📂 Project Structure

```
ShopEase/
│
├── server/                    # Backend (Node.js + Express)
│   ├── server.js              # Express server entry point
│   ├── package.json           # Node.js dependencies
│   ├── seed.js                # Database seeding script
│   │
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   │
│   ├── models/
│   │   ├── Product.js         # Product Mongoose model
│   │   └── Order.js           # Order Mongoose model
│   │
│   ├── controllers/
│   │   ├── productController.js  # Product CRUD logic
│   │   └── orderController.js    # Order creation & retrieval
│   │
│   ├── routes/
│   │   ├── productRoutes.js   # Product API routes
│   │   └── orderRoutes.js     # Order API routes
│   │
│   └── middleware/
│       └── errorHandler.js    # Centralized error handling
│
├── client/                    # Frontend (HTML + CSS + JS)
│   ├── index.html             # Home page
│   ├── products.html          # Products listing
│   ├── product-details.html   # Single product view
│   ├── cart.html              # Shopping cart
│   ├── checkout.html          # Checkout form
│   ├── order-success.html     # Order confirmation
│   │
│   ├── css/
│   │   └── style.css          # Complete stylesheet
│   │
│   └── js/
│       ├── app.js             # Shared utilities & cart management
│       ├── products.js        # Products page logic
│       ├── product-details.js # Product details logic
│       ├── cart.js            # Cart page logic
│       └── checkout.js        # Checkout & order submission
│
├── .env.example               # Environment variable template
├── .gitignore                 # Git ignore rules
└── README.md                  # This file
```

---

## 🔧 Troubleshooting

### MongoDB Connection Failure
- Verify your `MONGODB_URI` in the `.env` file is correct
- For Atlas: ensure your IP is whitelisted in Network Access
- For local: ensure `mongod` service is running

### Port Already in Use
```bash
# Change PORT in .env file, or kill the process using port 5000
# On Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### API Not Reachable
- Make sure the server is running (`npm start`)
- Check the console for error messages
- Verify you're accessing `http://localhost:5000`

### Missing Dependencies
```bash
cd server
npm install
```

### Products Not Showing
- Run the seed script: `node seed.js`
- Verify MongoDB connection in server console

### Cart Not Persisting
- Make sure localStorage is enabled in your browser
- Check for browser privacy/incognito mode restrictions

---

## 👨‍💻 User Flow

```
HOME → PRODUCTS → SEARCH/FILTER/SORT → VIEW PRODUCT → ADD TO CART
→ CART → CHECKOUT → CUSTOMER DETAILS → DEMO PAYMENT → PLACE ORDER
→ EXPRESS API → MONGODB → ORDER SUCCESS
```

---

## 📄 License

This project is for educational purposes.

---

**© 2026 ShopEase. All rights reserved.**
