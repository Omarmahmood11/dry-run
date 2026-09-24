import Link from 'next/link';

// Shared class strings keep the prose consistent without introducing components.
const sectionClassName = 'border-t border-dr-border pt-8 mt-10';
const headingClassName = 'text-lg font-semibold tracking-tight text-dr-ink mb-4';
const paragraphClassName = 'mb-4 leading-7 text-dr-ink';

export default function FindingsPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <header className="mb-6">
        <Link
          href="/"
          className="text-sm font-medium text-dr-ink-muted hover:text-dr-ink underline hover:no-underline"
        >
          &larr; Back to Dry Run
        </Link>
      </header>

      <main className="max-w-[680px] text-[15px] text-dr-ink">
        <h1 className="text-3xl font-semibold tracking-tight text-dr-ink">
          Findings
        </h1>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>What this is</h2>
          <p className={paragraphClassName}>
            Everything I got wrong while building this.
          </p>
          <p className={paragraphClassName}>
            Demos are easy to make look clean. I wanted somewhere to put the part that wasn’t.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>Two ideas I killed first</h2>
          <p className={paragraphClassName}>
            The first one was an escalation layer. Help the AI decide when it’s unsure enough to
            hand an invoice to a human. I was pretty pleased with it for about a day.
          </p>
          <p className={paragraphClassName}>
            Then I read their FAQ, which says their agent already escalates on its own, and their
            homepage, which has a customer quote describing exactly that. So I’d have been pitching
            them a feature that’s in their own marketing copy. That would have been a bad first
            thirty seconds.
          </p>
          <p className={paragraphClassName}>
            The second was a coordination layer. Zamp have shipped fifteen-plus job roles and
            nothing on their site showed those roles working together, so it looked like an
            opening. It wasn’t. They published a post on 3 September about delegation between
            agents, shared state, supervisor agents, something they call an AI agent org chart.
            Three days before I had the idea.
          </p>
          <p className={paragraphClassName}>
            Both times I found out by reading rather than building, which is the cheap way round.
            The lesson isn’t complicated. Read what the company has actually said before deciding
            what they’re missing.
          </p>
          <p className={paragraphClassName}>
            The third idea came from a post by someone senior in their founder’s office. He said
            the blocker in enterprise agent rollouts is almost never the model, it’s the hundred
            people who touch the agent after launch. A claims manager tweaking a rule. An analyst
            moving a threshold. That’s a problem somebody inside the company named out loud, which
            is a better place to start than a gap I’d imagined.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>My data was wrong six times</h2>
          <p className={paragraphClassName}>
            Every number this tool shows comes out of 400 synthetic invoices. If those are bad then
            the whole thing is a random number generator with a nice interface.
          </p>
          <p className={paragraphClassName}>
            They were bad. Repeatedly. And I only ever caught it by reading the data, never by
            testing it.
          </p>
          <p className={paragraphClassName}>
            <strong className="font-semibold">All the fraud was at the end.</strong> Every problem
            case sat in the last forty invoice IDs, grouped by fraud type. Sort the table by ID and
            you had the answer key. The generator was assigning IDs in creation order and I hadn’t
            thought about it once.
          </p>
          <p className={paragraphClassName}>
            <strong className="font-semibold">A payment redirection fraud for ₹7,694.</strong>{' '}
            Somebody compromising a supplier’s email to steal about eighty pounds. The amounts were
            being generated with no sense of whether the crime was worth committing.
          </p>
          <p className={paragraphClassName}>
            <strong className="font-semibold">Notes that contradicted their own invoices.</strong>{' '}
            Three cases said “billed for 50 units, only 32 received.” None of them had 50 units
            anywhere. One was billing for eight. The notes came from a template list and nobody had
            checked them against the data they were describing.
          </p>
          <p className={paragraphClassName}>
            <strong className="font-semibold">A tax error running backwards.</strong> One case
            described as an overcharge was actually ₹2,000 under the correct amount.
          </p>
          <p className={paragraphClassName}>
            <strong className="font-semibold">A price variance of 5,983%.</strong> That one turned
            out to be a display bug, the percentage getting multiplied by a hundred twice, but it
            sat there looking completely authoritative until I read the row.
          </p>
          <p className={paragraphClassName}>
            <strong className="font-semibold">Duplicate invoices marked legitimate.</strong> The
            generator was flagging the original rather than the resubmission. In some pairs both
            copies got flagged while the case that was actually the problem sat there clean.
          </p>
          <p className={paragraphClassName}>
            An hour spent exporting the corpus to a readable file and going through it found all
            six. That was probably the best hour I spent on this.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>The thing I wasn’t looking for</h2>
          <p className={paragraphClassName}>
            Partway through I added vendor exceptions to the baseline. A few suppliers whose normal
            invoices sit above the approval limit, given special treatment so they’d stop getting
            held up. Completely ordinary thing for a finance team to set up.
          </p>
          <p className={paragraphClassName}>
            One of those exceptions quietly disabled every fraud check for that supplier.
          </p>
          <p className={paragraphClassName}>
            The rule engine evaluates vendor exceptions before policy checks. So granting an
            exception doesn’t just raise a limit, it removes the bank detail alert, the price
            variance check, the quantity check, all of it. Three real problems went through because
            of it. One was a fraudulent payment redirection.
          </p>
          <p className={paragraphClassName}>
            I wasn’t trying to demonstrate anything. I found it because I was checking what the
            exception had done.
          </p>
          <p className={paragraphClassName}>
            It’s the second demo scenario now and I think it’s the sharper one. A threshold change
            looks like what it is. A vendor exception looks like a small favour to one supplier and
            behaves like switching off the entire control set. That gap between what somebody
            thinks they’re doing and what they’re actually doing is the thing this whole tool
            exists for.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>What I’d do differently</h2>
          <p className={paragraphClassName}>
            I wrote numbers into the spec that I’d made up in an afternoon. Before building anything
            I decided the baseline should miss “6 to 9” of 40 problems, and that any rule change
            should move “10 to 40” cases. No basis for either figure. They just sounded reasonable.
          </p>
          <p className={paragraphClassName}>
            Then I spent days watching the data get bent to hit them. Distributions adjusted so the
            movement counts landed in range. Fraud amounts squeezed into a narrow band so a
            threshold change would produce exactly three regressions. Every time it passed. Every
            time the corpus got slightly less honest.
          </p>
          <p className={paragraphClassName}>
            Deleting the targets fixed it. The final numbers are worse than what I’d specified and
            much more believable. The baseline misses 20 of 40 problems, escalates 30% of
            legitimate invoices, auto-approves 68%. A rules based system that catches half the
            problems and still bothers a human on a third of the good invoices is a system somebody
            is actually running right now, and it’s the reason there’s room for this product at
            all.
          </p>
          <p className={paragraphClassName}>
            The other thing. I accepted “all checks passed” too many times. More than once the
            verification came back green and the green had been manufactured. Asking for the actual
            numbers instead of the verdict caught it every time.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>What this doesn’t do</h2>
          <p className={paragraphClassName}>
            Replay only knows the past. It tells you how a change would have handled invoices you’ve
            already seen. It can’t anticipate a fraud pattern nobody’s encountered. It narrows the
            uncertainty, it doesn’t remove it.
          </p>
          <p className={paragraphClassName}>
            The data is synthetic and the AI employee behind it is simulated. The replay itself is
            real computation, 400 cases, deterministic rules, a genuine diff with a right answer.
            But the invoices are invented and there’s no agent actually processing them. I was
            demonstrating the safety layer. The layer behaves the same way whatever sits underneath
            it.
          </p>
          <p className={paragraphClassName}>
            Ground truth is always available here and wouldn’t be in production. Every invoice in my
            corpus has a definitive answer about whether it should have been paid. In a real
            deployment plenty of invoices never get conclusively resolved. A production version
            would have to report what fraction of cases it can actually judge and be upfront that
            the rest are unknown.
          </p>
          <p className={paragraphClassName}>
            Rule attribution assumes independence. When two changed rules could each explain the
            same changed decision, the tool names whichever comes first in evaluation order. That’s
            a simplification.
          </p>
          <p className={paragraphClassName}>
            Interaction effects aren’t modelled at all. Raising a threshold changes how much a
            human has to review, which changes how carefully they review it, which changes
            outcomes. Real, and completely out of scope here.
          </p>
        </section>

        <section className={sectionClassName}>
          <h2 className={headingClassName}>The one number</h2>
          <p className={paragraphClassName}>
            If you take one thing from the demo. Turning off a noisy alert saves three invoices from
            human review and lets four fraudulent payment redirections through.
          </p>
          <p className={paragraphClassName}>
            Nobody flipping that switch wants the second half. They’re just tired of the alert.
          </p>
        </section>
      </main>
    </div>
  );
}
