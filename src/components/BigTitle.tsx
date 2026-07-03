function SplitChars({ word, accent = false }) {
  return (
    <>
      {word.split("").map((ch, i) => (
        <span key={i} className="bigtitle-mask">
          <span className={`bigtitle-char ${accent ? "accent" : ""}`}>{ch}</span>
        </span>
      ))}
    </>
  );
}

export default function BigTitle() {
  return (
    <section className="bigtitle" aria-label="Le digital, pour tous." data-anim="bigtitle">
      <div className="container-it">
        <h2 aria-hidden="true">
          <span className="bigtitle-line bigtitle-line--1">
            <SplitChars word="Le" />
            <span className="bigtitle-space" />
            <SplitChars word="digital," />
          </span>
          <span className="bigtitle-line bigtitle-line--2">
            <SplitChars word="pour" />
            <span className="bigtitle-space" />
            <SplitChars word="tous." accent />
          </span>
        </h2>
      </div>
    </section>
  );
}
