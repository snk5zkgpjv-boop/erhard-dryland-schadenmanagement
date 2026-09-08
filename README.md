# Erhard & Dryland Schadenmanagement – v0.8.2

## Neu
- Bilder können auf Handy/Tablet weiterhin aufgenommen oder aus der Fotomediathek gewählt werden.
- Auf Laptop/PC kann eine vorhandene Bilddatei ausgewählt werden.
- Das gilt für Schadens-/Mess-/Objektbilder sowie Geräte-/Typenschildfotos.
- Benutzeranmeldung mit datenbankgestützten Sessions.
- Rollen:
  - Admin: Vollzugriff, KI, Geräteverwaltung, Benutzerverwaltung, Schadensfälle löschen.
  - Techniker: Schadenaufnahme, Fotos, Messungen, Trocknung, Rapporte.
  - Büro: Artikelliste, Angebote und Rechnungen.
- KI-Endpunkt ist serverseitig auf Admin-Benutzer beschränkt.
- Schadensfall löschen ist serverseitig auf Admin-Benutzer beschränkt.
- Beim ersten Aufruf wird die Benutzerverwaltung automatisch in Neon angelegt; es ist keine manuelle SQL-Migration nötig.

## Ersteinrichtung nach Upload
1. Vercel Deployment abwarten.
2. `/setup` öffnen.
3. Ersten Admin-Benutzer mit Benutzername und Passwort anlegen.
4. Danach unter `Benutzer` weitere Konten erstellen.
