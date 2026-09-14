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
