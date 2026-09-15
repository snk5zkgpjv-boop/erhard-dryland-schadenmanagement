# Projektstand – Schadensmanagement

Stand: 14.09.2026. Eigenständiger Fachbereich innerhalb derselben Next.js-Anwendung wie das Organisationstool. Code-Grundlage main `470a3ab`.

## Verantwortung und Code

Schäden/Objekte, Messungen, Fotos, Trocknung, Geräte, Energieabrechnungen, Arbeitsberichte, Angebote, Aufträge und Rechnungen. Routen unter `app/cases`, `app/documents`, `app/equipment`, `app/articles`; APIs entsprechend unter `app/api`. Gemeinsame Authentifizierung und technische Datenbankinfrastruktur bedeuten keine automatische fachliche Datenübernahme.

## Überlieferte Anforderungen / Prüfbedarf

- Objektart, Objektbild und Messwerte vollständig in Berichten darstellen; tatsächliche aktuelle Ausgabe testen.
- Trotec T3000 und auswählbare Messverfahren im Bericht kennzeichnen.
- Gerätebestände über Anzahl bedienbar, eigene Geräte anlegbar; Typen anhand Herstellerdaten prüfen.
- Angebote/Rechnungen aus Artikelliste; Artikel mit KI bearbeiten. Konkrete gewünschte Bedienverbesserung gegen bestehende `DocumentBuilder`-/Artikelkomponenten abgleichen.
- Nummernvergabe über `lib/number-sequences.ts` und Unternehmens-Einstellungen; globale, kollisionsfreie Nummernfolge ist Anforderung, nicht allein durch vorhandene Dateinamen bewiesen.
- PDF-Ausgaben mit korrekter Unternehmensvorlage; keine privaten Vorlagendaten in diese öffentliche Datei übernehmen.

## Schnittstellen

| Richtung | Fachliche Übergabe | Nachweis |
|---|---|---|
| Organisationstool → Schadensmanagement | abrechenbare bestätigte Zeiten / Rechnungsvorschlag | Ziel; konkrete automatische Verbindung noch prüfen |
| Schadensmanagement → Organisationstool | Auftrags- und Rechnungsstatus | Ziel; konkrete Verbindung noch prüfen |
| ECG → Schadensmanagement | keine direkte geprüfte Verbindung | ECG-Zeiten gehen zunächst an Organisationstool |

Fachliche Dokumente und Nummern müssen vom Rechnungssystem geführt werden; keine zweite unabhängige Nummernvergabe im Organisationsmodul hinzufügen. Exakte Datenverantwortung bei Implementierung der Übergabe bestätigen.

## Stand und Pflege

Diese Änderung ergänzt ausschließlich Dokumentation. Kein neuer Fachfunktions-/PDF-/Produktivdatentest ausgeführt. Offene Anforderungen nicht ungeprüft als Fehler im aktuellen Code oder als umgesetzt deklarieren. Bei Änderungen Anforderung, Commit, Prüfung und Live-/Vorschauzustand mitpflegen. Gemeinsame Übersicht: [PROJEKTSTAND](../../PROJEKTSTAND.md).

## Rechnungseditor – 15.09.2026

Anforderung: Trocknerpositionen zuverlässig aus dem Schaden übernehmen und Artikelauswahl flüssiger bedienen; Schadensberichte und Organisationsmodul unverändert lassen.

Implementiert auf fix/invoice-drying-articles (Basis main 6bf38ac): Dokumenteditor ermittelt den Schaden auch aus einem bestehenden Dokument bzw. Quellangebot. Neue Rechnungen direkt aus dem Schaden erhalten Gerätepositionen automatisch; vorhandene Dokumente/Angebote werden nicht ungefragt ersetzt. Fehler beim Laden der Vorschläge werden angezeigt. Mehrfaches Übernehmen vermeidet Duplikate anhand der Installations-ID. Eindeutig zuordenbare ältere Trocknungspositionen werden verknüpft; mehrdeutige Altpositionen bleiben zur manuellen Prüfung erhalten. Laufzeitaktualisierung betrifft nur verknüpfte Tagespositionen, erhält individuelle Preise und verändert keine Pauschalen oder sonstigen Leistungspositionen. Laufende Geräte sind vorläufig; keine erfundenen Tagespreise oder pauschale 21-Tage-Abrechnung.

Artikel: Einstiegsliste ohne Suchtext, bis zu 100 Treffer pro Suche, Abbruch veralteter Suchanfragen, Lade-/Fehler-/Leermeldungen, Suche nach „Trockner“ findet „Trocknung“. Katalogpreis gezielt einer Position zuordnen, ohne Gerätebeschreibung/Menge zu überschreiben; abweichende Einheiten und fehlende Preise werden abgewiesen. Nullpreise werden zur Prüfung angezeigt. Katalog-Stammdaten unverändert.

Interner Vertrag: GET /api/cases/:id/billing-suggestions → DocumentBuilder; source_type enthält drying:<Installations-ID> und wird über das vorhandene Dokumentpositionsfeld gespeichert und aus Angeboten erhalten. Keine Migration, keine neue Nummernvergabe und keine Schnittstellenänderung zum Organisationstool/ECG. Keine Produktivdaten verändert.

Geprüft: TypeScript-Prüfung, vollständiger Next.js-Produktionsbuild sowie tests/document-items.cjs und tests/document-builder.cjs bestanden. Letzterer testet Editor-Hooks mit gemockten API-Antworten (Neuanlage, Bearbeiten, Angebotsübernahme, Doppelklick); kein angemeldeter Browser-/Datenbank-/PDF-Ende-zu-Ende-Test. Nach abschließendem Build noch kleine Schutzergänzung für Pauschalen und Formularinitialisierung; anschließend Typprüfung und Regressionstests erneut bestanden. Noch nicht live veröffentlicht.

Live bestätigt am 15.09.2026 nach ausdrücklicher Freigabe: PR #3 übernommen, Funktionscommit `a60a42523720a2afde3eabda69c8daee18926a92`. Vorschau `dpl_3CH53HvyVc9AtdJfjS6ME6MaZUwG` READY. Produktionsdeployment `dpl_7fUJjAkbHWGnQbfVFji91E1kB4oD` READY, Build ca. 42 Sekunden; Produktivalias https://erhard-dryland-schadenmanagement.vercel.app zugeordnet. /login liefert HTML mit HTTP 200; Artikelsuche ohne App-Anmeldung erwartungsgemäß HTTP 401. Erneute Logik-/Hooktests und TypeScript-Prüfung bestanden. Keine Error-/Fatal-Runtime-Logs für dieses Deployment beim anschließenden Scan gefunden; aufgrund kurzer Laufzeit kein Nachweis für fehlerfreien Alltagsbetrieb. Drains/Monitoring-Konfiguration nicht geprüft. Angemeldeter Rechnungs-/PDF-Praxistest weiterhin offen. Damit ist die zuvor ausstehende Veröffentlichung erfolgt; dieser Nachtrag ändert nur Dokumentation.
