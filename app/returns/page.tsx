import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/sections/content-page";

export const metadata: Metadata = {
  title: "Returns",
  description:
    "How returns work on unstitched cloth from Levenon, and what happens once a piece has been cut.",
  alternates: { canonical: "/returns",
  },
};

/*
 * States no fixed returns window on purpose.
 *
 * There is no returns system in this codebase — no RMA, no policy record, no
 * window stored anywhere — so "14 days" would be a number invented on a
 * marketing page that no part of the shop could enforce or even remember. What
 * IS structurally true and worth telling a customer plainly is the thing
 * specific to this product: once unstitched cloth has been cut, it cannot go
 * back on the rail. That is a real constraint of the goods, not a policy
 * choice, and it is the single most useful sentence on this page.
 */
export default function ReturnsPage() {
  return (
    <ContentPage
      eyebrow="Care"
      title="Returns"
      intro="Every piece here is unstitched cloth. That changes what a return can be, so it is worth reading before your tailor makes the first cut."
    >
      <ContentSection heading="Before it is cut">
        <p>
          If the cloth arrives and it is not what you expected — wrong piece,
          damage in transit, a fault in the weave or the embroidery — message us
          on the same WhatsApp thread the order was placed in, with a photo. We
          will sort it out from there.
        </p>
        <p>
          Keep it folded as it arrived until you are sure. Uncut cloth in its
          original condition is the only thing that can go back.
        </p>
      </ContentSection>

      <ContentSection heading="After it is cut">
        <p>
          Once a piece has been cut to your measurements it cannot be returned.
          This is not a policy we are choosing — a cut length of cloth cannot be
          sold to anyone else, and the whole point of buying unstitched is that
          the fit decisions are yours rather than ours.
        </p>
        <p>
          If you are unsure about the cloth or the quantity, ask in the chat
          before you take it to a tailor. That conversation is free and it is a
          great deal cheaper than a cut you regret.
        </p>
      </ContentSection>

      <ContentSection heading="Faults we have missed">
        <p>
          Every panel is checked on the roll before it is folded, but small runs
          are checked by people and people miss things. If you find a fault we
          should have caught, tell us — including after cutting — and we will
          make it right.
        </p>
        <p>
          Order details are on{" "}
          <Link
            href="/track"
            className="text-ink underline decoration-hairline underline-offset-4 transition-colors duration-200 ease-state hover:text-purple-500 hover:decoration-purple-500"
          >
            Track order
          </Link>
          .
        </p>
      </ContentSection>
    </ContentPage>
  );
}
