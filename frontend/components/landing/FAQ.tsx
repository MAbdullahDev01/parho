import { Accordion } from "@/components/ui/Accordion";
import { faqs } from "@/lib/Data";

export function FAQ() {
  const items = faqs.map((f, i) => ({
    value: `faq-${i}`,
    question: f.q,
    answer: f.a,
  }));

  return (
    <section id="pricing" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold text-emerald-600">FAQ</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Questions parents ask before booking
          </h2>
        </div>

        <div className="mt-12">
          <Accordion items={items} />
        </div>
      </div>
    </section>
  );
}