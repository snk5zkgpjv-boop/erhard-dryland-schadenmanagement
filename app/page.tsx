"use client";

import { useState } from "react";

const modules = [
  ["Schadensaufnahme", "Kundendaten, Objekt, Schadensursache, Leckageortung und Begutachtung."],
  ["Fotos & Messungen", "Schadensbilder, Messbilder, Räume, Bauteile und Messwerte."],
  ["Schadensbericht", "Bericht mit Bildern, Messergebnissen, Bauteilöffnungen und Handlungsempfehlung."],
  ["Trocknung", "Geräte, Aufstellung, Zwischenmessungen, Endmessung und Trocknungsdauer."],
  ["Rapporte", "Mitarbeiter, Zeiten, Fahrten, Leistungen, Material, Geräte und Unterschriften."],
  ["Energieverbrauch", "Beginn/Ende, Zählerstände, kWh, Zählerfotos und Stromverbrauchsnachweis."],
  ["Angebote", "Technische Trocknung und Wiederherstellungs-/Sanierungsangebote."],
  ["Rechnungen", "Übernahme von Artikeln, Rapportstunden, Fahrten, Material und Geräteeinsatz."],
  ["Dokumente", "Auftragserteilung, Abtretung, PDFs und weitere Nachweise."]
];

export default function Home() {
  const [company, setCompany] = useState<"ERHARD" | "DRYLAND" | null>(null);

  return (
    <main>
      <section className="hero">
        <span className="badge">Version 0.1 – Grundgerüst</span>
        <h1>Schadenmanagement</h1>
        <p className="subtitle">
          Gemeinsame digitale Schadenakte für Erhard Dienstleistungen und Dryland Trocknungstechnik.
          Die Firmenauswahl steuert später Logo, Kopf-/Fußzeile, Bankdaten, Nummernkreise und PDF-Layout.
        </p>
      </section>

      <section className="companyGrid">
        <div className="card">
          <button className="companyButton" onClick={() => setCompany("ERHARD")}>
            <div className="companyTitle">Erhard Dienstleistungen</div>
            <div className="small">Sanierung, Wiederherstellung, Angebote, Rechnungen und eigene Schadenvorgänge.</div>
          </button>
        </div>
        <div className="card">
          <button className="companyButton" onClick={() => setCompany("DRYLAND")}>
            <div className="companyTitle">Dryland Trocknungstechnik</div>
            <div className="small">Leckageortung, Schadensberichte, technische Trocknung, Rapporte und Energieverbrauch.</div>
          </button>
        </div>
      </section>

      {company && (
        <>
          <section className="card" style={{marginBottom:16}}>
            <strong>Aktive Firma:</strong> {company === "ERHARD" ? "Erhard Dienstleistungen" : "Dryland Trocknungstechnik"}
          </section>
          <section className="moduleGrid">
            {modules.map(([title, text]) => (
              <div className="card" key={title}>
                <div className="moduleTitle">{title}</div>
                <div className="small">{text}</div>
              </div>
            ))}
          </section>
        </>
      )}

      <p className="footerNote">
        Nächster Ausbauschritt: Login, echte Schadensakten, Foto-Uploads, Formularmasken, PDF-Erstellung und Neon-Anbindung.
      </p>
    </main>
  );
}
