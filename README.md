# BaltiGull

Opinber vefsíða BaltiGull (Baltasar Smári Jónsson). Ný plata, BaltiGull V2 Tímamót, kemur út 24. júlí 2026.

Síðan er ein sjálfstæð HTML-skrá (`index.html`) ásamt myndum og myndböndum í `assets/`.

## Birta síðuna (GitHub Pages)

1. Opnaðu **Settings → Pages** í þessu repo.
2. Undir **Build and deployment** veldu **Deploy from a branch**.
3. Veldu branch **main** og möppuna **/ (root)**, smelltu á **Save**.
4. Síðan birtist á `https://briembenni-sketch.github.io/baltigull/` eftir smá stund.

## Þróun

Vefþjónn í möppunni, t.d.:

```
npx http-server -p 4321
```

`build-assets.mjs` býr til léttu vefútgáfurnar í `assets/` úr frumskránum (sem eru ekki í þessu repo):

```
node build-assets.mjs all
```
