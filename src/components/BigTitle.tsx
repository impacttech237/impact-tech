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

export default function BigTitle({ locale = "fr" }) {
  const en = locale === "en";
  return (
    <section className="bigtitle" aria-label={en ? "Digital, for everyone." : "Le digital, pour tous."} data-anim="bigtitle">
      <div className="bigtitle__grid" aria-hidden="true" />
      <span className="bigtitle__chapter" aria-hidden="true">09 / {en ? "OUR CONVICTION" : "NOTRE CONVICTION"}</span>
      <div className="container-it">
        {en ? (
          <h2 aria-hidden="true">
            <span className="bigtitle-line bigtitle-line--1">
              <SplitChars word="Digital," />
            </span>
            <span className="bigtitle-line bigtitle-line--2">
              <SplitChars word="for" />
              <span className="bigtitle-space" />
              <SplitChars word="everyone." accent />
            </span>
          </h2>
        ) : (
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
        )}
      </div>
    </section>
  );
}
