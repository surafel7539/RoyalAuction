import { connectDB, query, queryOne } from "./db";
import { endingSoon, effectiveEndsAt, getAuctionStatus, parseImages } from "./format";
import { LISTING_SELECT, findCategoryBySlug } from "./models";
import { isValidId, toBidDTO, toListingDTO } from "./serialize";

function applyComputedStatus(listing) {
  return { ...listing, computedStatus: getAuctionStatus(listing) };
}

function hydrateListings(docs) {
  return docs.map((listing) => applyComputedStatus(toListingDTO(listing)));
}

export async function syncEndedListings() {
  await connectDB();
  await query(
    `UPDATE listings
     SET status = 'LIVE'
     WHERE status = 'ENDED' AND ends_at > now()`,
  );
  await query(
    `UPDATE listings
     SET status = 'ENDED'
     WHERE status = 'LIVE' AND ends_at <= now()`,
  );
}

export async function buildListingQuery({
  q,
  minPrice,
  maxPrice,
  status,
  location,
  categoryId,
  categorySlug,
  sellerId,
}) {
  const where = [];
  const params = [];
  const now = new Date();

  function add(clause, value) {
    params.push(value);
    where.push(clause.replace("?", `$${params.length}`));
  }

  if (q) {
    params.push(`%${q}%`);
    const idx = `$${params.length}`;
    where.push(`(l.title ILIKE ${idx} OR l.description ILIKE ${idx} OR l.location ILIKE ${idx})`);
  }

  if (minPrice) {
    add("l.current_bid >= ?", Number(minPrice));
  }

  if (maxPrice) {
    add("l.current_bid <= ?", Number(maxPrice));
  }

  if (location && location !== "all") {
    add("l.location = ?", location);
  }

  if (sellerId && isValidId(sellerId)) {
    add("l.seller_id = ?", sellerId);
  }

  if (categoryId && isValidId(categoryId)) {
    add("l.category_id = ?", categoryId);
  } else if (categorySlug) {
    const category = await findCategoryBySlug(categorySlug);
    if (category) {
      add("l.category_id = ?", category.id);
    } else {
      where.push("FALSE");
    }
  }

  if (status === "live") {
    add("l.status = ?", "LIVE");
    add("l.ends_at > ?", now);
    add("l.starts_at <= ?", now);
  } else if (status === "ending") {
    const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    add("l.status = ?", "LIVE");
    add("l.starts_at <= ?", now);
    add("l.ends_at > ?", now);
    add("l.ends_at <= ?", soon);
  } else if (status === "ended") {
    params.push(now);
    where.push(`(l.status IN ('ENDED', 'SOLD') OR l.ends_at <= $${params.length})`);
  }

  return {
    whereSql: where.length ? `WHERE ${where.join(" AND ")}` : "",
    params,
  };
}

export function buildListingSort(sort) {
  switch (sort) {
    case "newest":
      return "l.created_at DESC";
    case "price_asc":
      return "l.current_bid ASC";
    case "price_desc":
      return "l.current_bid DESC";
    case "popular":
      return "l.bid_count DESC";
    case "ending":
    default:
      return "l.ends_at ASC";
  }
}

export async function getListings(filters = {}) {
  await connectDB();
  await syncEndedListings();
  const { whereSql, params } = await buildListingQuery(filters);
  const listings = await query(
    `${LISTING_SELECT} ${whereSql} ORDER BY ${buildListingSort(filters.sort)}`,
    params,
  );
  return hydrateListings(listings);
}

export async function getListingById(id) {
  await connectDB();
  if (!isValidId(id)) return null;
  await syncEndedListings();

  const listing = await queryOne(`${LISTING_SELECT} WHERE l.id = $1`, [id]);
  if (!listing) return null;

  const bids = await query(
    `SELECT
       b.id,
       b.amount,
       b.created_at AS "createdAt",
       b.listing_id AS "listingId",
       jsonb_build_object('id', u.id, 'legalName', u.legal_name) AS bidder
     FROM bids b
     JOIN users u ON u.id = b.bidder_id
     WHERE b.listing_id = $1
     ORDER BY b.created_at DESC`,
    [id],
  );

  return applyComputedStatus(
    toListingDTO(listing, {
      bids: bids.map(toBidDTO),
      bidCount: listing.bidCount ?? bids.length,
    }),
  );
}

function supplierFromUser(user, stats) {
  return {
    id: String(user.id),
    name: user.legalName,
    role: user.role,
    accountKind: user.accountKind === "ORGANISATION" ? "ORGANISATION" : "INDIVIDUAL",
    contactName: user.contactName || "",
    city: user.city || stats.location || "",
    lotCount: stats.count,
    image: stats.image,
  };
}

export async function getSuppliers() {
  await connectDB();
  const users = await query(
    `SELECT id, legal_name AS "legalName", role, account_kind AS "accountKind",
            contact_name AS "contactName", city
     FROM users
     WHERE role IN ('SELLER', 'BOTH')
     ORDER BY legal_name ASC`,
  );
  const listings = await query(
    `SELECT seller_id AS "sellerId", images, location, created_at AS "createdAt"
     FROM listings
     ORDER BY created_at DESC`,
  );
  const stats = new Map();
  for (const listing of listings) {
    const id = String(listing.sellerId);
    if (!stats.has(id)) stats.set(id, { count: 0, image: "", location: "" });
    const row = stats.get(id);
    row.count += 1;
    if (!row.image) row.image = parseImages(listing.images)[0] || "";
    if (!row.location && listing.location) row.location = listing.location;
  }
  return users.map((user) =>
    supplierFromUser(user, stats.get(String(user.id)) || { count: 0, image: "", location: "" }),
  );
}

export async function getSupplier(id) {
  await connectDB();
  if (!isValidId(id)) return null;
  const user = await queryOne(
    `SELECT id, legal_name AS "legalName", role, account_kind AS "accountKind",
            contact_name AS "contactName", city
     FROM users
     WHERE id = $1 AND role IN ('SELLER', 'BOTH')`,
    [id],
  );
  if (!user) return null;
  const listings = await query(
    `SELECT images, location FROM listings WHERE seller_id = $1 ORDER BY created_at DESC`,
    [user.id],
  );
  const image = listings.map((listing) => parseImages(listing.images)[0]).find(Boolean) || "";
  const location = listings.find((listing) => listing.location)?.location || "";
  return supplierFromUser(user, { count: listings.length, image, location });
}

export async function getCategories() {
  await connectDB();
  const categories = await query(
    `SELECT
       c.id,
       c.slug,
       c.name,
       c.description,
       COUNT(l.id)::int AS listings
     FROM categories c
     LEFT JOIN listings l ON l.category_id = c.id
     GROUP BY c.id
     ORDER BY c.name ASC`,
  );

  return categories.map((category) => ({
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    _count: { listings: category.listings || 0 },
  }));
}

export async function getCategoryBySlug(slug) {
  await connectDB();
  const category = await queryOne(
    `SELECT
       c.id,
       c.slug,
       c.name,
       c.description,
       COUNT(l.id)::int AS listings
     FROM categories c
     LEFT JOIN listings l ON l.category_id = c.id
     WHERE c.slug = $1
     GROUP BY c.id`,
    [slug],
  );
  if (!category) return null;
  return {
    id: category.id,
    slug: category.slug,
    name: category.name,
    description: category.description,
    _count: { listings: category.listings || 0 },
  };
}

export async function getFeaturedListings() {
  await connectDB();
  await syncEndedListings();
  const listings = await query(
    `${LISTING_SELECT}
     WHERE l.status = 'LIVE' AND l.ends_at > now() AND l.starts_at <= now()
     ORDER BY l.current_bid DESC
     LIMIT 4`,
  );
  return hydrateListings(listings);
}

export async function getScheduledListings() {
  await connectDB();
  const listings = await query(
    `${LISTING_SELECT}
     WHERE l.status NOT IN ('CANCELLED', 'SOLD', 'ENDED') AND l.starts_at > now()
     ORDER BY l.starts_at ASC`,
  );
  return hydrateListings(listings);
}

export async function getEndingSoonListings() {
  await connectDB();
  await syncEndedListings();
  const listings = await query(
    `${LISTING_SELECT}
     WHERE l.status = 'LIVE' AND l.ends_at > now() AND l.starts_at <= now()`,
  );
  return hydrateListings(listings)
    .sort((a, b) => effectiveEndsAt(a) - effectiveEndsAt(b))
    .slice(0, 4)
    .map((listing) => ({
      ...listing,
      isEndingSoon: endingSoon(listing),
    }));
}

export async function getHighestBid(listingId) {
  await connectDB();
  if (!isValidId(listingId)) return null;
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

export async function isWatching(userId, listingId) {
  await connectDB();
  if (!userId || !isValidId(listingId)) return false;
  const row = await queryOne(
    "SELECT 1 FROM watches WHERE user_id = $1 AND listing_id = $2",
    [userId, listingId],
  );
  return Boolean(row);
}

export async function getDashboardData(userId) {
  await connectDB();
  const [listings, bids, watches] = await Promise.all([
    query(`${LISTING_SELECT} WHERE l.seller_id = $1 ORDER BY l.created_at DESC`, [userId]),
    query(
      `SELECT
         b.id,
         b.amount,
         b.created_at AS "createdAt",
         b.listing_id AS "listingId"
       FROM bids b
       WHERE b.bidder_id = $1
       ORDER BY b.created_at DESC`,
      [userId],
    ),
    query(
      `SELECT w.id, w.listing_id AS "listingId"
       FROM watches w
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [userId],
    ),
  ]);

  const listingIds = [
    ...new Set([
      ...bids.map((bid) => bid.listingId),
      ...watches.map((watch) => watch.listingId),
    ]),
  ].filter(Boolean);

  const related =
    listingIds.length > 0
      ? await query(
          `${LISTING_SELECT} WHERE l.id IN (${listingIds.map((_, index) => `$${index + 1}`).join(", ")})`,
          listingIds,
        )
      : [];
  const relatedMap = Object.fromEntries(related.map((listing) => [listing.id, listing]));

  return {
    listings: hydrateListings(listings),
    bids: bids
      .filter((bid) => relatedMap[bid.listingId])
      .map((bid) => ({
        id: bid.id,
        amount: bid.amount,
        listingId: bid.listingId,
        listing: applyComputedStatus(toListingDTO(relatedMap[bid.listingId])),
      })),
    watches: watches
      .filter((watch) => relatedMap[watch.listingId])
      .map((watch) => ({
        id: watch.id,
        listing: applyComputedStatus(toListingDTO(relatedMap[watch.listingId])),
      })),
  };
}

export function canPurchaseListing(user, listing, highestBid) {
  if (!user || !listing) return false;
  if (user.id === listing.sellerId) return false;
  const status = listing.computedStatus || getAuctionStatus(listing);
  if (status === "ENDED" && highestBid?.bidder?.id === user.id) return true;
  return false;
}
