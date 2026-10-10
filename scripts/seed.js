import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnv() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const idx = trimmed.indexOf("=");
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5432/bid_ethiopia";

function quoteIdent(name) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
    throw new Error(`Invalid database name: ${name}`);
  }
  return `"${name}"`;
}

async function ensureDatabase() {
  const url = new URL(DATABASE_URL);
  // Managed hosts (Neon, etc.) already provide a database — skip CREATE DATABASE.
  if (url.hostname.includes("neon.tech") || url.hostname.includes("neon.cloud")) {
    return;
  }
  const dbName = decodeURIComponent(url.pathname.replace(/^\//, "") || "bid_ethiopia");
  const adminUrl = new URL(url);
  adminUrl.pathname = "/postgres";
  const admin = new pg.Client({ connectionString: adminUrl.toString() });
  await admin.connect();
  const existing = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
  if (!existing.rowCount) {
    await admin.query(`CREATE DATABASE ${quoteIdent(dbName)}`);
    console.log("Created database", dbName);
  }
  await admin.end();
}

const CATEGORIES = [
  {
    slug: "vehicles",
    name: "Vehicles",
    description: "Cars, trucks, motorcycles, and commercial fleets from across Ethiopia.",
  },
  {
    slug: "real-estate",
    name: "Real Estate",
    description: "Homes, plots, and commercial buildings offered through sealed and live sale.",
  },
  {
    slug: "art-antiques",
    name: "Art & Antiques",
    description: "Paintings, manuscripts, liturgical objects, and heritage pieces.",
  },
  {
    slug: "electronics",
    name: "Electronics",
    description: "Phones, computers, audiovisual equipment, and office tech.",
  },
  {
    slug: "jewelry",
    name: "Jewelry",
    description: "Gold, filigree, watches, and gemstone lots.",
  },
  {
    slug: "industrial",
    name: "Industrial Equipment",
    description: "Machinery, generators, construction plant, and workshop tools.",
  },
  {
    slug: "agriculture",
    name: "Agriculture",
    description: "Coffee, livestock, farm machinery, and processing equipment.",
  },
  {
    slug: "collectibles",
    name: "Collectibles",
    description: "Coins, stamps, vintage goods, and limited Ethiopian editions.",
  },
];

const LISTINGS = [
  {
    slug: "vehicles",
    title: "2019 Toyota Hilux Double Cab",
    description:
      "Well-kept Hilux with service history, new tyres, and a canopy. Inspected in Addis Ababa. Sold as seen, with logbook.",
    images: ["/uploads/toyota-hilux.jpg"],
    startingBid: 1850000,
    bidIncrement: 25000,
    reservePrice: 2100000,
    condition: "Excellent",
    location: "Addis Ababa",
    hours: 48,
    seller: "seller",
  },
  {
    slug: "real-estate",
    title: "Bole apartment with balcony",
    description:
      "Three-bedroom apartment near Bole Road. Titled, vacant possession, and recent kitchen upgrade. Viewings by appointment.",
    images: [
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    ],
    startingBid: 4200000,
    bidIncrement: 50000,
    reservePrice: null,
    condition: "Good",
    location: "Addis Ababa",
    hours: 120,
    seller: "org",
  },
  {
    slug: "art-antiques",
    title: "Contemporary Ethiopian canvas, 2018",
    description:
      "Large mixed-media painting on canvas. Signed by the artist, framed, and stored in climate-controlled conditions.",
    images: [
      "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1200&q=80",
    ],
    startingBid: 85000,
    bidIncrement: 2500,
    reservePrice: 110000,
    condition: "Excellent",
    location: "Addis Ababa",
    hours: 72,
    seller: "seller",
  },
  {
    slug: "electronics",
    title: "Lot of office laptops, 12 units",
    description:
      "Twelve refurbished business laptops with chargers. Mixed Intel i5 generation, 8–16 GB RAM. Tested and wiped.",
    images: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80",
    ],
    startingBid: 240000,
    bidIncrement: 5000,
    reservePrice: null,
    condition: "Good",
    location: "Adama",
    hours: 36,
    seller: "org",
  },
  {
    slug: "jewelry",
    title: "22k filigree necklace set",
    description:
      "Traditional filigree necklace and earrings, hallmarked 22k. Weighed and photographed. Certificate available at the desk.",
    images: [
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80",
    ],
    startingBid: 175000,
    bidIncrement: 5000,
    reservePrice: 210000,
    condition: "Like New",
    location: "Addis Ababa",
    hours: 24,
    seller: "seller",
  },
  {
    slug: "industrial",
    title: "Perkins 50 kVA generator",
    description:
      "Diesel generator, recently serviced, with sound canopy. Hours recorded. Suitable for workshop or small plant.",
    images: [
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=80",
    ],
    startingBid: 680000,
    bidIncrement: 15000,
    reservePrice: null,
    condition: "Used",
    location: "Hawassa",
    hours: 96,
    seller: "org",
  },
  {
    slug: "agriculture",
    title: "Sidama washed coffee, 30 bags",
    description:
      "Thirty 60 kg bags of washed Sidama Grade 2. Current crop, stored dry. Sample cupping notes available.",
    images: [
      "https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1200&q=80",
    ],
    startingBid: 390000,
    bidIncrement: 10000,
    reservePrice: 450000,
    condition: "New",
    location: "Hawassa",
    hours: 60,
    seller: "org",
  },
  {
    slug: "collectibles",
    title: "Haile Selassie era coin group",
    description:
      "A small group of Ethiopian coins including silver issues. Sold as a collection. Grading is the bidder's responsibility.",
    images: ["/uploads/haile-coins-1.jpg", "/uploads/haile-coins-2.jpg"],
    startingBid: 18000,
    bidIncrement: 500,
    reservePrice: null,
    condition: "Fair",
    location: "Gondar",
    hours: 72,
    seller: "seller",
  },
  {
    slug: "vehicles",
    title: "Isuzu NPR box truck",
    description:
      "Box body commercial truck used on city routes. Engine starts cleanly. Buyer to inspect brakes and electrics.",
    images: [
      "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80",
    ],
    startingBid: 980000,
    bidIncrement: 20000,
    reservePrice: null,
    condition: "Used",
    location: "Dire Dawa",
    hours: 80,
    seller: "org",
  },
  {
    slug: "electronics",
    title: "Upcoming: cinema projector lot",
    description:
      "Two digital cinema projectors with lenses. Lot opens on a set date so technicians can inspect before bidding starts.",
    images: [
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80",
    ],
    startingBid: 310000,
    bidIncrement: 8000,
    reservePrice: 360000,
    condition: "Good",
    location: "Bahir Dar",
    hours: 72,
    seller: "org",
    startsInHours: 48,
  },
];

function asClient(target) {
  return {
    async query(text, params) {
      const result = await target.query(text, params);
      return { rows: result.rows || [] };
    },
    async end() {
      if (typeof target.end === "function") await target.end();
      if (typeof target.close === "function") await target.close();
    },
  };
}

async function connectSeed() {
  try {
    await ensureDatabase();
    const client = new pg.Client({ connectionString: DATABASE_URL });
    await client.connect();
    return asClient(client);
  } catch (error) {
    console.warn("PostgreSQL server not available, seeding local PGlite:", error.message);
    const { PGlite } = await import("@electric-sql/pglite");
    const dir = "./data/pglite";
    fs.mkdirSync(dir, { recursive: true });
    return asClient(await PGlite.create(dir));
  }
}

async function main() {
  const client = await connectSeed();

  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  for (const statement of schema
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)) {
    await client.query(statement);
  }

  await client.query("DELETE FROM payments");
  await client.query("DELETE FROM watches");
  await client.query("DELETE FROM bids");
  await client.query("DELETE FROM listings");
  await client.query("DELETE FROM categories");
  await client.query("DELETE FROM users");

  const passwordHash = await bcrypt.hash("Demo1234!", 10);

  const buyer = (
    await client.query(
      `INSERT INTO users (id, legal_name, phone, password_hash, role)
       VALUES ($1,$2,$3,$4,'BUYER') RETURNING id`,
      [randomUUID(), "Hanna Bekele", "+251911000001", passwordHash],
    )
  ).rows[0];

  const seller = (
    await client.query(
      `INSERT INTO users (id, legal_name, phone, password_hash, role, account_kind, city)
       VALUES ($1,$2,$3,$4,'SELLER','INDIVIDUAL','Addis Ababa') RETURNING id`,
      [randomUUID(), "Dawit Tesfaye", "+251911000002", passwordHash],
    )
  ).rows[0];

  const org = (
    await client.query(
      `INSERT INTO users (id, legal_name, phone, password_hash, role, account_kind, contact_name, city)
       VALUES ($1,$2,$3,$4,'BOTH','ORGANISATION',$5,'Addis Ababa') RETURNING id`,
      [
        randomUUID(),
        "Rift Valley Trading PLC",
        "+251911000003",
        passwordHash,
        "Marta Alemu",
      ],
    )
  ).rows[0];

  const sellers = { seller: seller.id, org: org.id };
  const categoryIds = {};

  for (const category of CATEGORIES) {
    const row = (
      await client.query(
        `INSERT INTO categories (id, slug, name, description) VALUES ($1,$2,$3,$4) RETURNING id`,
        [randomUUID(), category.slug, category.name, category.description],
      )
    ).rows[0];
    categoryIds[category.slug] = row.id;
  }

  for (const lot of LISTINGS) {
    const startsAt = lot.startsInHours
      ? new Date(Date.now() + lot.startsInHours * 60 * 60 * 1000)
      : new Date();
    const endsAt = new Date(startsAt.getTime() + lot.hours * 60 * 60 * 1000);
    await client.query(
      `INSERT INTO listings (
        id, title, description, images, starting_bid, current_bid, bid_increment,
        reserve_price, condition, location, status, starts_at, ends_at,
        category_id, seller_id
      ) VALUES ($1,$2,$3,$4,$5,$5,$6,$7,$8,$9,'LIVE',$10,$11,$12,$13)`,
      [
        randomUUID(),
        lot.title,
        lot.description,
        JSON.stringify(lot.images),
        lot.startingBid,
        lot.bidIncrement,
        lot.reservePrice,
        lot.condition,
        lot.location,
        startsAt,
        endsAt,
        categoryIds[lot.slug],
        sellers[lot.seller],
      ],
    );
  }

  await client.end();
  console.log("Seeded Bid Ethiopia.");
  console.log("Demo buyer:  +251911000001 / Demo1234!");
  console.log("Demo seller: +251911000002 / Demo1234!");
  console.log("Demo org:    +251911000003 / Demo1234!");
  void buyer;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
