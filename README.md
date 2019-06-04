# Annuaires Favre

_Web application to enter data from Favre yearbooks_

The main repository for this project is hosted on [Huma-Num](https://www.huma-num.fr/): https://gitlab.huma-num.fr/eurhisfirm/annuaires-favre

## Install

```bash
git clone https://gitlab.huma-num.fr/eurhisfirm/annuaires-favre.git
cd annuaires-favre/
```

Edit `src/server-config.js` to change PostgreSQL database informations. Then

```bash
npm install
```

### Database Creation

When using _Debian GNU/Linux_:

```bash
apt install postgresql postgresql-contrib

su - postgres
createuser -D -P -R -S favre
  Enter password for new role: favre
  Enter it again: favre
createdb -E utf-8 -O favre favre

psql favre
CREATE EXTENSION IF NOT EXISTS pg_trgm;
exit
```

### Server Configuration

```bash
npm run configure
```

### Database Initialization

Two alternatives:

#### Initialize database from DFIH Oracle database

Edit `src/oracle-config.js` to change Oracle database informations. Then

```bash
npx babel-node src/scripts/import_dfih_territories.js
npx babel-node src/scripts/import_dfih_corporations.js
npx babel-node src/scripts/import_fake_corporations.js data/banques_fictives.csv
npx babel-node src/scripts/import_favre_cities.js data/villes_favre.csv
npx babel-node src/scripts/import_favre_banks_from_lines.js data/lignes_favre.csv
```

#### Restore database from PostgreSQL dump

To dump database, execute as `root`:
```bash
su - postgres
pg_dump favre >/tmp/favre.sql
exit
```

To restore it, execute as `root`:
```bash
su - postgres
dropdb favre
createdb -E utf-8 -O favre favre
psql favre </tmp/favre.sql
exit
```

## Server Launch

In development mode:

```bash
npm run dev
```

In production mode:

```bash
npm run build
npm start
```
