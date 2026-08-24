import "server-only";

import { sortReviews, type RatingSummary, type Review, type ReviewSort } from "./types";

/**
 * Customer reviews — seed data.
 *
 * This module is the **storage layer** for reviews and the only place a review
 * row is defined. It is import-guarded with `server-only` so a stray client
 * import fails the build rather than shipping every review of every piece to
 * the browser; the page reads it and hands one product's rows down as a prop.
 * `lib/reviews/types.ts` carries the shape and the rules, because those
 * genuinely are needed on both sides of the wire.
 *
 * ---------------------------------------------------------------------------
 * PROVENANCE — unlike `lib/server/catalogue-data.ts`, **none of this is real.**
 *
 * There is no review table in `LevenonIdraak.sql` and no marketplace feed we
 * are entitled to copy, so these are written rows standing in for the shape of
 * the eventual data. They are seeded rather than empty because a review UI with
 * nothing in it cannot be judged: sort order, long-body wrapping, mixed
 * ratings, and the aggregate rounding all need rows to exercise them.
 *
 * They are written to read like real buyers of **unstitched cloth**, which is a
 * different customer to a ready-to-wear one — the recurring subjects are how
 * much cloth came on the bolt, whether the dupatta matched the shirt in
 * daylight, what the tailor made of the ground, and colour against a phone
 * screen. No claim about the brand, the workshop, or a delivery promise is made
 * here that the catalogue does not already make.
 *
 * **Nothing below may survive into production.** The moment `postReview` is
 * given a real store (see `lib/reviews/actions.ts`), this array is deleted
 * rather than merged with live rows — seeded praise sitting alongside real
 * customer copy is a lie about the product, and an averaged one at that.
 * ---------------------------------------------------------------------------
 */
const REVIEWS: Review[] = [
  /* ---- Lawn ------------------------------------------------------------ */
  {
    id: "rv-scifflie-lawn-suit-01",
    productSlug: "scifflie-lawn-suit",
    author: "Ayesha Siddiqui",
    rating: 5,
    body:
      "The schiffli is denser than the photographs suggest and it did not pucker when the shirt was cut. Enough cloth in the shirt piece for a long kameez with the daman border still landing where it should.",
    createdAt: "2026-03-14T09:20:00.000Z",
  },
  {
    id: "rv-scifflie-lawn-suit-02",
    productSlug: "scifflie-lawn-suit",
    author: "Hina Raza",
    rating: 4,
    body:
      "Light, cool, stitched up beautifully. A star off because four or five of the attached beads came away in the first hand wash. The lace and the embroidery held fine.",
    createdAt: "2026-01-22T14:05:00.000Z",
  },
  {
    id: "rv-scifflie-lawn-suit-03",
    productSlug: "scifflie-lawn-suit",
    author: "Komal Nasir",
    rating: 5,
    body:
      "Third suit I have ordered. The cambric trouser is the right weight — it falls straight and does not cling.",
    createdAt: "2025-12-08T07:41:00.000Z",
  },
  {
    id: "rv-scifflie-lawn-suit-04",
    productSlug: "scifflie-lawn-suit",
    author: "Rabia Aslam",
    rating: 3,
    body:
      "The cloth is good but the dupatta reads grey in daylight where the picture showed lilac. My tailor got a nice fall out of it so I kept it, and I would want to see the shade in person next time.",
    createdAt: "2026-06-02T16:30:00.000Z",
  },

  {
    id: "rv-airjet-lawn-suit-01",
    productSlug: "airjet-lawn-suit",
    author: "Sana Iqbal",
    rating: 4,
    body:
      "Proper 90/70 lawn, crisp out of the packet and softer after two washes. The print is sharp and has not faded.",
    createdAt: "2025-11-19T10:15:00.000Z",
  },
  {
    id: "rv-airjet-lawn-suit-02",
    productSlug: "airjet-lawn-suit",
    author: "Maryam Butt",
    rating: 5,
    body:
      "I bought this for everyday college wear and it has been through six or seven washes now. Still even in colour, no pilling at the sleeves. The neck patch sat exactly where the tailor placed it.",
    createdAt: "2026-02-05T11:50:00.000Z",
  },
  {
    id: "rv-airjet-lawn-suit-03",
    productSlug: "airjet-lawn-suit",
    author: "Nida Khan",
    rating: 4,
    body:
      "Good value for the price. The chiffon dupatta is very light — I would have preferred it a shade deeper to match the shirt.",
    createdAt: "2026-04-27T08:25:00.000Z",
  },
  {
    id: "rv-airjet-lawn-suit-04",
    productSlug: "airjet-lawn-suit",
    author: "Bushra Latif",
    rating: 3,
    body:
      "Cloth is exactly as described. My complaint is the trouser piece — it was short for a tall cut and my tailor had to join at the bottom, which shows. Fine if you are average height.",
    createdAt: "2026-07-11T13:10:00.000Z",
  },
  {
    id: "rv-airjet-lawn-suit-05",
    productSlug: "airjet-lawn-suit",
    author: "Areeba Zaman",
    rating: 4,
    body:
      "Arrived in four days, folded properly, no creasing to steam out. Simple suit, does what it says.",
    createdAt: "2026-08-03T06:55:00.000Z",
  },

  /* ---- Chiffon --------------------------------------------------------- */
  {
    id: "rv-adda-work-chiffon-01",
    productSlug: "adda-work-chiffon",
    author: "Fatima Qureshi",
    rating: 5,
    body:
      "The adda work at the neck is genuinely hand done — the hook line reads on the reverse and no two motifs are identical. It is why the sequence sits flat instead of dragging the weave out of true.",
    createdAt: "2026-05-18T15:40:00.000Z",
  },
  {
    id: "rv-adda-work-chiffon-02",
    productSlug: "adda-work-chiffon",
    author: "Zara Malik",
    rating: 5,
    body:
      "Wore it to a family mehndi. The weight sits at the hem and the neck and nowhere else, exactly as the description says.",
    createdAt: "2026-02-27T19:05:00.000Z",
  },
  {
    id: "rv-adda-work-chiffon-03",
    productSlug: "adda-work-chiffon",
    author: "Mehwish Anwar",
    rating: 4,
    body:
      "Beautiful chiffon, but do not take this one to a cheap tailor. Mine charged extra and was right to — the ground slips under the machine and the first side seam had to come out and go in again.",
    createdAt: "2025-12-30T12:20:00.000Z",
  },
  {
    id: "rv-adda-work-chiffon-04",
    productSlug: "adda-work-chiffon",
    author: "Sadia Farooq",
    rating: 4,
    body:
      "Satin trouser is lovely and the shirt does not catch on it. I needed a separate inner, which is expected with chiffon but worth budgeting for.",
    createdAt: "2026-06-21T09:00:00.000Z",
  },

  {
    id: "rv-embroidered-chiffon-01",
    productSlug: "embroidered-chiffon",
    author: "Iqra Javed",
    rating: 4,
    body:
      "The back being embroidered too makes a real difference when the dupatta is off the shoulder. Not something most suits at this price bother with.",
    createdAt: "2026-01-09T17:35:00.000Z",
  },
  {
    id: "rv-embroidered-chiffon-02",
    productSlug: "embroidered-chiffon",
    author: "Naila Sheikh",
    rating: 3,
    body:
      "Colour is a fair bit warmer than my screen showed — closer to dull gold than the ivory I ordered for. The embroidery is neat and the four-sided dupatta border is well finished, so three rather than two.",
    createdAt: "2026-03-30T10:45:00.000Z",
  },
  {
    id: "rv-embroidered-chiffon-03",
    productSlug: "embroidered-chiffon",
    author: "Hira Baig",
    rating: 5,
    body:
      "Sleeves are cut long, which I appreciate. Nothing had to be pieced and nothing was short.",
    createdAt: "2026-07-24T08:10:00.000Z",
  },
  {
    id: "rv-embroidered-chiffon-04",
    productSlug: "embroidered-chiffon",
    author: "Uzma Rehman",
    rating: 5,
    body:
      "Ordered on a Sunday, had it by Wednesday, at the tailor by Thursday. It holds no crease at all, so it came back from him looking the way it did in the packet.",
    createdAt: "2025-11-27T14:25:00.000Z",
  },

  /* ---- Cotton ---------------------------------------------------------- */
  {
    id: "rv-monsoon-blooms-01",
    productSlug: "monsoon-blooms",
    author: "Amna Tariq",
    rating: 5,
    body:
      "I held the front panel up to a window the way the description suggests, and the work is honest — the shadow stitches read from behind. Real chikankari, not a machine imitation of it.",
    createdAt: "2026-04-12T11:30:00.000Z",
  },
  {
    id: "rv-monsoon-blooms-02",
    productSlug: "monsoon-blooms",
    author: "Saba Mirza",
    rating: 4,
    body:
      "Cotton is soft and takes the humidity well. The organza dupatta stands away from the body, which takes getting used to but does look sharp.",
    createdAt: "2026-06-08T13:55:00.000Z",
  },
  {
    id: "rv-monsoon-blooms-03",
    productSlug: "monsoon-blooms",
    author: "Tehmina Gul",
    rating: 5,
    body:
      "My mother has worn chikankari her whole life and she went through this one stitch by stitch before she approved of it. The neck patch is separate handwork and it is the best part of the suit.",
    createdAt: "2026-01-16T09:15:00.000Z",
  },
  {
    id: "rv-monsoon-blooms-04",
    productSlug: "monsoon-blooms",
    author: "Noreen Ashraf",
    rating: 3,
    body:
      "Lovely work, but tonal white on white shows every mark and mine picked up a stain at the daman the first time out. Hand wash only is not a suggestion here. Buy it knowing that.",
    createdAt: "2026-08-09T16:20:00.000Z",
  },
  {
    id: "rv-monsoon-blooms-05",
    productSlug: "monsoon-blooms",
    author: "Kiran Ansari",
    rating: 4,
    body:
      "Enough cloth for a long shirt and full sleeves with a little left over. Trouser piece is plain cotton and perfectly good.",
    createdAt: "2025-12-19T07:50:00.000Z",
  },

  {
    id: "rv-cross-stitch-cotton-01",
    productSlug: "cross-stitch-cotton",
    author: "Anum Bhatti",
    rating: 5,
    body:
      "The counted stitch stays true across the whole panel, which on a black ground is where cheaper suits come apart. Colours are bright against it and have not dulled in the wash.",
    createdAt: "2026-02-14T10:05:00.000Z",
  },
  {
    id: "rv-cross-stitch-cotton-02",
    productSlug: "cross-stitch-cotton",
    author: "Shazia Nawaz",
    rating: 4,
    body:
      "My everyday winter suit now. Soft cotton, warm enough with a shawl, and the plain lawn trouser was a sensible choice.",
    createdAt: "2025-11-30T15:45:00.000Z",
  },
  {
    id: "rv-cross-stitch-cotton-03",
    productSlug: "cross-stitch-cotton",
    author: "Rida Kamal",
    rating: 4,
    body:
      "Good suit for the money. The chiffon dupatta carries the same motif lighter and ties the three pieces together nicely.",
    createdAt: "2026-05-03T12:35:00.000Z",
  },
  {
    id: "rv-cross-stitch-cotton-04",
    productSlug: "cross-stitch-cotton",
    author: "Ghazala Rashid",
    rating: 2,
    body:
      "The black ran in the first wash and marked the dupatta, washed alone in cold water as instructed. The embroidery is good work and I am sorry to rate it this way, but the dyeing let it down.",
    createdAt: "2026-07-02T08:40:00.000Z",
  },

  /* ---- Net ------------------------------------------------------------- */
  {
    id: "rv-spengle-net-suit-01",
    productSlug: "spengle-net-suit",
    author: "Mahnoor Zubair",
    rating: 5,
    body:
      "This was my walima suit. The spengle work is heavy in the hand and it is what gives the net its structure — on a hanger it keeps its own shape. The photographs did not oversell it.",
    createdAt: "2026-03-05T18:00:00.000Z",
  },
  {
    id: "rv-spengle-net-suit-02",
    productSlug: "spengle-net-suit",
    author: "Sidra Hameed",
    rating: 5,
    body:
      "The shamoz inner coming with it saved me a separate trip and a separate bill. Thoughtful.",
    createdAt: "2026-05-27T11:25:00.000Z",
  },
  {
    id: "rv-spengle-net-suit-03",
    productSlug: "spengle-net-suit",
    author: "Warda Sattar",
    rating: 4,
    body:
      "Cutwork on all four sides of the dupatta is done properly, following the motif rather than a straight hem. It is heavy to wear for a full evening, which is the cost of that much work and not a fault.",
    createdAt: "2026-01-31T20:10:00.000Z",
  },
  {
    id: "rv-spengle-net-suit-04",
    productSlug: "spengle-net-suit",
    author: "Zainab Chaudhry",
    rating: 5,
    body:
      "Expensive, and worth it. My tailor asked where it was from before I had finished unfolding it.",
    createdAt: "2025-12-12T14:15:00.000Z",
  },

  {
    id: "rv-sequence-net-suit-01",
    productSlug: "sequence-net-suit",
    author: "Aiman Farooq",
    rating: 4,
    body:
      "Held still it reads solid, and the mesh shows the moment you move — that description is accurate. Adda work at the neck is clean.",
    createdAt: "2026-04-20T17:20:00.000Z",
  },
  {
    id: "rv-sequence-net-suit-02",
    productSlug: "sequence-net-suit",
    author: "Sundas Baig",
    rating: 3,
    body:
      "The suit is good but the printed silk dupatta and the sequence shirt do not sit together as well in person as in the picture. Two ideas in one suit. The malai trouser is soft and I have no complaint there.",
    createdAt: "2026-06-15T09:35:00.000Z",
  },
  {
    id: "rv-sequence-net-suit-03",
    productSlug: "sequence-net-suit",
    author: "Erum Qureshi",
    rating: 5,
    body:
      "Sequence density is the real thing, not scattered about. Nothing has come loose after two wears.",
    createdAt: "2026-02-22T13:45:00.000Z",
  },

  /* ---- Organza --------------------------------------------------------- */
  {
    id: "rv-tussel-organza-suit-01",
    productSlug: "tussel-organza-suit",
    author: "Javeria Ahmed",
    rating: 5,
    body:
      "The tussels do swing clear of the cloth, because the organza is stiff enough to hold them off it. I expected them to tangle and they have not, through a whole evening.",
    createdAt: "2026-03-21T21:00:00.000Z",
  },
  {
    id: "rv-tussel-organza-suit-02",
    productSlug: "tussel-organza-suit",
    author: "Kanwal Shah",
    rating: 4,
    body:
      "Kiran lace at the dupatta edge is a nice finish. Warn your tailor that organza shows every stitch on both faces before he starts on it.",
    createdAt: "2026-05-09T10:30:00.000Z",
  },
  {
    id: "rv-tussel-organza-suit-03",
    productSlug: "tussel-organza-suit",
    author: "Palwasha Khan",
    rating: 4,
    body:
      "Silk trouser is very quiet against the shirt, which is right. Colour matched the photograph closely in daylight.",
    createdAt: "2025-12-27T12:05:00.000Z",
  },
  {
    id: "rv-tussel-organza-suit-04",
    productSlug: "tussel-organza-suit",
    author: "Nazia Aslam",
    rating: 3,
    body:
      "Well made, but organza creases sitting down and mine came back from one function needing a press. That is the cloth and they say so, so read the description before ordering for a long event.",
    createdAt: "2026-07-19T15:50:00.000Z",
  },
  {
    id: "rv-tussel-organza-suit-05",
    productSlug: "tussel-organza-suit",
    author: "Hafsa Mir",
    rating: 5,
    body:
      "The neck is worked on the adda and it shows. Best gala I have had stitched in years.",
    createdAt: "2026-01-26T08:20:00.000Z",
  },

  {
    id: "rv-festive-organza-suit-01",
    productSlug: "festive-organza-suit",
    author: "Beenish Iqbal",
    rating: 5,
    body:
      "Leaving the back plain was the right decision. There is a great deal happening at the front and the flat panel behind is what keeps the whole thing from reading as noise.",
    createdAt: "2026-04-04T16:40:00.000Z",
  },
  {
    id: "rv-festive-organza-suit-02",
    productSlug: "festive-organza-suit",
    author: "Rimsha Akhtar",
    rating: 4,
    body:
      "Daman patches are set on cleanly and the handwork sits over the sequence rather than fighting it. Sleeves are heavy but the cut carries them.",
    createdAt: "2026-02-11T11:15:00.000Z",
  },
  {
    id: "rv-festive-organza-suit-03",
    productSlug: "festive-organza-suit",
    author: "Samina Yousaf",
    rating: 2,
    body:
      "Two of the hanging tussels came away at the daman before it had even been stitched, and one patch was set slightly off square. My tailor corrected both, but at this price I should not have paid him to.",
    createdAt: "2026-08-14T10:00:00.000Z",
  },

  /* ---- Silk ------------------------------------------------------------ */
  {
    id: "rv-handwork-silk-suit-01",
    productSlug: "handwork-silk-suit",
    author: "Alina Dar",
    rating: 4,
    body:
      "The stones follow the printed motif instead of ignoring it, which is unusual and is the whole appeal. The gala is the heaviest part, as described.",
    createdAt: "2026-05-22T14:10:00.000Z",
  },
  {
    id: "rv-handwork-silk-suit-02",
    productSlug: "handwork-silk-suit",
    author: "Sumbul Raza",
    rating: 5,
    body:
      "All three pieces cut from the same silk is why it reads as one suit and not three separate things. It does change with the light across a room — I did not believe that line until I wore it.",
    createdAt: "2026-01-03T19:25:00.000Z",
  },
  {
    id: "rv-handwork-silk-suit-03",
    productSlug: "handwork-silk-suit",
    author: "Tooba Siddiq",
    rating: 4,
    body:
      "Print is crisp and the colour is close to the screen. A few stones needed setting again after a wash, so wash it gently and dry it flat.",
    createdAt: "2026-06-29T09:45:00.000Z",
  },
  {
    id: "rv-handwork-silk-suit-04",
    productSlug: "handwork-silk-suit",
    author: "Farah Nadeem",
    rating: 3,
    body:
      "Good cloth, but the shirt piece was tight once the tailor had allowed for the print repeat. He matched it in the end. Ask for the measurements first if you take a long kameez.",
    createdAt: "2025-11-22T13:30:00.000Z",
  },

  {
    id: "rv-shamoz-silk-suit-01",
    productSlug: "shamoz-silk-suit",
    author: "Laiba Munir",
    rating: 4,
    body:
      "Matte rather than shining, which is what I wanted and is hard to find. Falls in long folds and looks dearer than it was.",
    createdAt: "2026-03-27T10:50:00.000Z",
  },
  {
    id: "rv-shamoz-silk-suit-02",
    productSlug: "shamoz-silk-suit",
    author: "Aroosa Malik",
    rating: 5,
    body:
      "The print carries from the shirt onto the trouser and my tailor matched the two so it runs continuous. Ten minutes of his attention and it looks made to order. No embroidery to catch on anything.",
    createdAt: "2026-05-31T12:00:00.000Z",
  },
  {
    id: "rv-shamoz-silk-suit-03",
    productSlug: "shamoz-silk-suit",
    author: "Shumaila Aziz",
    rating: 3,
    body:
      "Plainer in person than in the listing photographs, and the dupatta is the same silk so there is no contrast anywhere in it. Well made, and it fits what it costs. I wanted a little more from it.",
    createdAt: "2026-07-28T15:15:00.000Z",
  },
  {
    id: "rv-shamoz-silk-suit-04",
    productSlug: "shamoz-silk-suit",
    author: "Zoya Haider",
    rating: 4,
    body:
      "Mid-weight and it drapes well. Good office suit. Delivery was two days later than the estimate, packaging was fine.",
    createdAt: "2025-12-04T08:05:00.000Z",
  },
  {
    id: "rv-shamoz-silk-suit-05",
    productSlug: "shamoz-silk-suit",
    author: "Amara Rauf",
    rating: 5,
    body:
      "The only suit I own that I can put on without thinking about it. Bought a second in another colour.",
    createdAt: "2026-02-18T17:40:00.000Z",
  },
];

/**
 * Reviews for one piece, **newest first** unless another order is asked for.
 *
 * The rows are copied on the way out — callers sort them and prepend optimistic
 * entries to them, and none of that may reach the module-level table.
 */
export function getReviews(slug: string, sort?: ReviewSort): Review[] {
  const key = slug.trim().toLowerCase();
  return sortReviews(
    REVIEWS.filter((review) => review.productSlug.toLowerCase() === key),
    sort,
  );
}

/**
 * The aggregate the product header and the JSON-LD both read.
 *
 * Rounded to one decimal, which is as much precision as a mean of a handful of
 * integers honestly carries. A piece with no reviews returns
 * `{ average: 0, count: 0 }` and callers are expected to render nothing at all
 * for it — "0 reviews" beside a price reads as a verdict rather than as an
 * absence, and an `aggregateRating` of zero is invalid structured data.
 */
export function getAverageRating(slug: string): RatingSummary {
  const rows = getReviews(slug);
  if (rows.length === 0) return { average: 0, count: 0 };

  const total = rows.reduce((sum, review) => sum + review.rating, 0);
  return {
    average: Math.round((total / rows.length) * 10) / 10,
    count: rows.length,
  };
}

export type { Rating, RatingSummary, Review } from "./types";
