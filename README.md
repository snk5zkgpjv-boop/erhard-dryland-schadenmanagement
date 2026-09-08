# Erhard & Dryland Schadenmanagement – v0.8

Neu:
- Schadensfall endgültig löschen (mit Sicherheitsabfrage, abhängige Daten werden per Datenbank-Cascade entfernt)
- direkter Auftrag ohne Schadensbericht: Kunde -> Angebot/Rechnung
- zentrale Artikelliste aus `Artikelliste Gesamt.xlsx`
  - 170 eigene Erhard/Dryland-Positionen
  - 537 AXA-Positionen
- Artikelsuche in Angeboten/Rechnungen
- Schaden -> Artikelvorschläge aus Trocknung und Rapporten
- freie Leistungsbeschreibung -> KI erzeugt geeignete Suchbegriffe für die Artikelliste
- Angebote und Rechnungen bleiben als Entwurf/versendet/etc. bearbeitbar
- jede Dokumentposition kann nachträglich geändert oder gelöscht werden; Katalog-Stammdaten bleiben unverändert
- freie Positionen sind möglich
- Auftragserteilung kann gespeichert und später bearbeitet werden
- KI-Bildbeschreibung bei Schadensfotos
- KI-Geräteerkennung aus Gerätefoto/Typenschild
- KI füllt Gerätebezeichnung, Seriennummer, Leistung und Kategorie als Vorschlag aus
- KI-Aufrufe laufen serverseitig; `OPENAI_API_KEY` liegt nur in Vercel

OpenAI:
In Vercel unter Settings -> Environment Variables einmalig anlegen:
- `OPENAI_API_KEY`
- optional `OPENAI_MODEL=gpt-5.6-luna`

Der Schlüssel gehört NICHT in GitHub.

Hinweis:
Die App hat derzeit noch kein vollständiges Benutzer-/Rollen-Login. Die KI-Routen sind technisch serverseitig geschützt, der eigentliche Admin-Rollencheck kommt mit dem Auth-Ausbau. Solange nur der Admin die App nutzt, ist die Funktion verwendbar.
