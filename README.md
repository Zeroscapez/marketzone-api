# MarketZone API

A RESTful backend API for a full-featured e-commerce marketplace. Built with Node.js and Express, MarketZone handles user authentication, product listings, shopping cart management, order processing, Stripe payments, and email confirmations.

**Live API:** [marketzone-api.vercel.app](https://marketzone-api.vercel.app)

---

## Features

- **Authentication** — JWT-based auth with bcrypt password hashing
- **User Management** — Registration, login, account details, and password reset
- **Product Listings** — Create, browse, and manage product listings
- **Shopping Cart** — Add, remove, and view cart items per user
- **Checkout & Payments** — Stripe payment integration with order creation
- **Order History** — Full order tracking with billing and shipping addresses
- **Reward Points** — Automatic reward points calculated per purchase (2 pts per $1)
- **Email Confirmations** — Automated order confirmation emails via Nodemailer
- **Security** — Helmet.js security headers, parameterized SQL queries, rate-aware middleware

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MySQL (mysql2 with connection pooling) |
| Authentication | JSON Web Tokens (JWT) + bcrypt |
| Payments | Stripe |
| Email | Nodemailer (Gmail SMTP) |
| Security Headers | Helmet.js |
| Deployment | Vercel |

---

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/marketzone/api/register` | No | Register a new user |
| POST | `/marketzone/api/login` | No | Login and receive JWT token |

### Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/marketzone/api/userData` | Yes | Get current user's username |
| GET | `/marketzone/api/accountDetails` | Yes | Get full account details + reward points |
| POST | `/marketzone/api/resetPassword` | Yes | Reset user password |

### Products
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/marketzone/api/products` | No | Browse all product listings |
| POST | `/marketzone/api/listProducts` | Yes | Create a new product listing |
| GET | `/marketzone/api/userProducts` | Yes | Get current user's listings |

### Cart
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/marketzone/api/cart` | Yes | Get cart items |
| POST | `/marketzone/api/addToCart` | Yes | Add product to cart |
| DELETE | `/marketzone/api/cart/:productId` | Yes | Remove item from cart |

### Orders
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/marketzone/api/checkout` | Yes | Process checkout and create order |
| GET | `/marketzone/api/orders` | Yes | Get user's order history |

---

## Authentication

Protected routes require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens are issued on login and expire after 24 hours.

---

## Getting Started

### Prerequisites
- Node.js v18+
- MySQL database
- Stripe account
- Gmail account (for email confirmations)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Zeroscapez/marketzone-api.git
cd marketzone-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PORT=3000
SECRET_KEY=your_jwt_secret_key
STRIPE_KEY=your_stripe_secret_key
EMAIL_PASS=your_gmail_app_password
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
```

4. Start the development server:
```bash
node index.js
```

The API will be running at `http://localhost:3000`.

---

## Database Schema

The API expects the following MySQL tables:

- `users` — user accounts with reward points
- `products` — product listings linked to users
- `cart` — per-user cart items
- `orders` — order records with totals
- `order_items` — individual items per order
- `billing_addresses` — billing address per order
- `shipping_addresses` — shipping address per order

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Port the server runs on |
| `SECRET_KEY` | JWT signing secret |
| `STRIPE_KEY` | Stripe secret API key |
| `EMAIL_PASS` | Gmail app password for Nodemailer |
| `DB_HOST` | MySQL host |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | MySQL database name |

---

## Contributors

- [@Zeroscapez](https://github.com/Zeroscapez)

---

## License

MIT