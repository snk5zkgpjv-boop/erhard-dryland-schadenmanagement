# Erhard & Dryland Schadenmanagement

Erste technische Grundversion der gemeinsamen Web-App für:

- Erhard Dienstleistungen
- Dryland Trocknungstechnik

## Geplante Bereiche

- Firmenauswahl
- Schadensakten
- Schadensaufnahme
- Fotos / Messbilder
- Feuchtigkeitsmessungen
- Schadensberichte
- Technische Trocknung
- Rapporte
- Energieverbrauch / Stromverbrauchsnachweis
- Angebote
- Rechnungen
- Auftragserteilung / Abtretung
- PDF-Erstellung

## Lokaler Start

1. Node.js installieren
2. `npm install`
3. `.env.example` nach `.env.local` kopieren
4. `DATABASE_URL` aus Neon einsetzen
5. `npm run dev`

## Neon

Die Datei `db/001_initial_schema.sql` enthält ein idempotentes Startschema.
Sie verwendet überwiegend `CREATE TABLE IF NOT EXISTS`.

## Vercel

In Vercel muss mindestens folgende Environment Variable gesetzt werden:

`DATABASE_URL`

Danach kann das Repository normal deployed werden.

## Aktueller Stand

Version 0.1 ist bewusst ein sauberes Grundgerüst. Die Startseite bietet bereits die Firmenauswahl
und zeigt die vorgesehenen Module. Die eigentlichen Eingabemasken, Authentifizierung,
Datei-Uploads und PDF-Generatoren folgen in den nächsten Ausbauschritten.
