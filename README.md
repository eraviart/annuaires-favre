# Annuaires Favre

_Web application to enter data from Favre yearbooks_

## Install

```bash
git clone https://gitlab.huma-num.fr/eurhisfirm/annuaires-favre.git
cd annuaires-favre/
```

Edit `src/server-config.js` to change database informations. Then

```bash
npm install
```

### Database Creation

When using _Debian GNU/Linux_:

```bash
su - postgres
createuser -D -P -R -S favre
  Enter password for new role: favre
  Enter it again: favre
createdb -E utf-8 -O favre favre
```

### Server Configuration

```bash
npm run configure
```

### Database Initialization

Two alternatives:

#### Initialize database from DFIH Oracle database

```bash
npx babel-node src/scripts/import_dfih_territories.js
```

#### Restore database from PostgreSQL dump

TODO

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
