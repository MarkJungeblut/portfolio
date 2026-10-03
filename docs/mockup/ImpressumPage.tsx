export function ImpressumPage() {
  return (
    <main className="px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-primary mb-2 text-center">Impressum</h1>
        <p className="font-sans text-base text-secondary text-center">Angaben gemäß § 5 TMG</p>
      </div>

      <section className="bg-surface-low rounded-[2rem] overflow-hidden px-8 py-6 space-y-6">
        <div>
          <h2 className="font-serif text-lg text-primary mb-1">Verantwortlich</h2>
          <p className="font-sans text-sm text-secondary leading-relaxed">
            Mark Jungeblut
            <br />
            Tannenkampstraße 27
            <br />
            26160 Bad Zwischenahn
            <br />
            Deutschland
          </p>
        </div>

        <div className="border-t border-secondary/10" />

        <div>
          <h2 className="font-serif text-lg text-primary mb-1">Kontakt</h2>
          <p className="font-sans text-sm text-secondary leading-relaxed">
            E-Mail: mark.jungeblut@gmail.com
          </p>
        </div>

        <div className="border-t border-secondary/10" />

        <div>
          <h2 className="font-serif text-lg text-primary mb-1">Haftungsausschluss</h2>
          <p className="font-sans text-sm text-secondary leading-relaxed">
            Diese Website dient ausschließlich privaten Zwecken und enthält keine kommerziellen
            Angebote. Alle Inhalte wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
            Vollständigkeit und Aktualität der Inhalte wird keine Gewähr übernommen.
          </p>
        </div>
      </section>
    </main>
  )
}
