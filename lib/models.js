import { connectDB, newId, query, queryOne } from "./db";
import { toBidDTO, toListingDTO, toUserDTO } from "./serialize";

export const LISTING_SELECT = `
  SELECT
    l.id,
    l.title,
    l.description,
    l.images,
    l.starting_bid AS "startingBid",
    l.current_bid AS "currentBid",
    l.bid_increment AS "bidIncrement",
    l.reserve_price AS "reservePrice",
    l.condition,
    l.location,
    l.status,
    l.starts_at AS "startsAt",
    l.ends_at AS "endsAt",
    l.last_bid_at AS "lastBidAt",
    l.created_at AS "createdAt",
    l.category_id AS "categoryId",
    l.seller_id AS "sellerId",
    l.buyer_id AS "buyerId",
    l.paid_at AS "paidAt",
    l.paid_amount AS "paidAmount",
    l.payment_method AS "paymentMethod",
    l.bid_count AS "bidCount",
    l.watch_count AS "watchCount",
    jsonb_build_object(
      'id', c.id,
      'slug', c.slug,
      'name', c.name,
      'description', c.description
    ) AS category,
    jsonb_build_object(
      'id', s.id,
      'legalName', s.legal_name
    ) AS seller,
    CASE WHEN buy.id IS NULL THEN NULL ELSE jsonb_build_object(
      'id', buy.id,
      'legalName', buy.legal_name
    ) END AS buyer
  FROM listings l
  JOIN categories c ON c.id = l.category_id
  JOIN users s ON s.id = l.seller_id
  LEFT JOIN users buy ON buy.id = l.buyer_id
`;

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    legalName: row.legal_name,
    phone: row.phone,
    passwordHash: row.password_hash,
    role: row.role,
    accountKind: row.account_kind,
    contactName: row.contact_name,
    city: row.city,
    createdAt: row.created_at,
  };
}

export async function findUserById(id) {
  await connectDB();
  const user = mapUser(await queryOne("SELECT * FROM users WHERE id = $1", [id]));
  if (!user) return null;
  return { ...toUserDTO(user), passwordHash: user.passwordHash };
}

export async function findUserByPhone(phone) {
  await connectDB();
  const user = mapUser(await queryOne("SELECT * FROM users WHERE phone = $1", [phone]));
  if (!user) return null;
  return { ...toUserDTO(user), passwordHash: user.passwordHash };
}

export async function createUser(data) {
  await connectDB();
  const row = await queryOne(
    `INSERT INTO users (
      id, legal_name, phone, password_hash, role, account_kind, contact_name, city
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *`,
    [
      newId(),
      data.legalName,
      data.phone,
      data.passwordHash,
      data.role || "BUYER",
      data.accountKind || null,
      data.contactName || "",
      data.city || "",
    ],
  );
  return toUserDTO(mapUser(row));
}

export async function findCategoryById(id) {
  await connectDB();
  const category = await queryOne("SELECT * FROM categories WHERE id = $1", [id]);
  if (!category) return null;
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
  };
}

export async function findCategoryBySlug(slug) {
  await connectDB();
  const category = await queryOne("SELECT * FROM categories WHERE slug = $1", [slug]);
  if (!category) return null;
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
  };
}

export async function findListingById(id) {
  await connectDB();
  const listing = await queryOne(`${LISTING_SELECT} WHERE l.id = $1`, [id]);
  return toListingDTO(listing);
}

export async function createListing(data) {
  await connectDB();
  const listing = await queryOne(
    `INSERT INTO listings (
      id, title, description, images, starting_bid, current_bid, bid_increment,
      reserve_price, condition, location, status, starts_at, ends_at, category_id, seller_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    RETURNING id`,
    [
      newId(),
      data.title,
      data.description,
      data.images,
      data.startingBid,
      data.currentBid,
      data.bidIncrement,
      data.reservePrice,
      data.condition,
      data.location,
      data.status,
      data.startsAt || new Date(),
      data.endsAt,
      data.categoryId,
      data.sellerId,
    ],
  );
  return { id: listing.id };
}

export async function countBids(listingId) {
  await connectDB();
  const row = await queryOne("SELECT COUNT(*)::int AS count FROM bids WHERE listing_id = $1", [
    listingId,
  ]);
  return row?.count || 0;
}

export async function cancelListing(listingId) {
  await connectDB();
  await query("UPDATE listings SET status = 'CANCELLED' WHERE id = $1", [listingId]);
}

export async function updateListingBid(listingId, userId, amount) {
  await connectDB();
  const updated = await queryOne(
    `UPDATE listings
     SET current_bid = $3, last_bid_at = now(), bid_count = bid_count + 1
     WHERE id = $1
       AND seller_id <> $2
       AND status = 'LIVE'
       AND ends_at > now()
       AND current_bid <= $3
     RETURNING id`,
    [listingId, userId, amount],
  );
  return Boolean(updated);
}

export async function insertBid({ amount, listingId, bidderId }) {
  await connectDB();
  await query("INSERT INTO bids (id, amount, listing_id, bidder_id) VALUES ($1,$2,$3,$4)", [
    newId(),
    amount,
    listingId,
    bidderId,
  ]);
}

export async function findHighestBid(listingId) {
  await connectDB();
  const bid = await queryOne(
    `SELECT
       b.id,
       b.amount,
       b.created_at AS "createdAt",
       b.listing_id AS "listingId",
       jsonb_build_object('id', u.id, 'legalName', u.legal_name) AS bidder
     FROM bids b
     JOIN users u ON u.id = b.bidder_id
     WHERE b.listing_id = $1
     ORDER BY b.amount DESC, b.created_at ASC
     LIMIT 1`,
    [listingId],
  );
  return bid ? toBidDTO(bid) : null;
}

export async function findWatch(userId, listingId) {
  await connectDB();
  return queryOne("SELECT * FROM watches WHERE user_id = $1 AND listing_id = $2", [
    userId,
    listingId,
  ]);
}

export async function insertWatch(userId, listingId) {
  await connectDB();
  await query("INSERT INTO watches (id, user_id, listing_id) VALUES ($1,$2,$3)", [
    newId(),
    userId,
    listingId,
  ]);
  await query("UPDATE listings SET watch_count = watch_count + 1 WHERE id = $1", [listingId]);
}

export async function deleteWatch(userId, listingId) {
  await connectDB();
  const result = await queryOne(
    "DELETE FROM watches WHERE user_id = $1 AND listing_id = $2 RETURNING id",
    [userId, listingId],
  );
  if (result) {
    await query(
      "UPDATE listings SET watch_count = GREATEST(watch_count - 1, 0) WHERE id = $1",
      [listingId],
    );
  }
}

export async function markListingSold({ listingId, userId, amount, paymentMethod }) {
  await connectDB();
  const updated = await queryOne(
    `UPDATE listings
     SET status = 'SOLD', buyer_id = $2, paid_at = now(), paid_amount = $3, payment_method = $4
     WHERE id = $1
       AND seller_id <> $2
       AND status NOT IN ('CANCELLED', 'SOLD')
     RETURNING id`,
    [listingId, userId, amount, paymentMethod],
  );
  return Boolean(updated);
}

export async function insertPayment(data) {
  await connectDB();
  await query(
    `INSERT INTO payments (
      id, amount, method, reference, payer_name, payer_phone, last4, listing_id, buyer_id
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      newId(),
      data.amount,
      data.method,
      data.reference,
      data.payerName,
      data.payerPhone,
      data.last4,
      data.listingId,
      data.buyerId,
    ],
  );
}
