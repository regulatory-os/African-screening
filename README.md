# African Sanctions Screening

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Open Source](https://img.shields.io/badge/Open%20Source-AGPL--3.0-green.svg)](LICENSE)

Outil de screening de noms contre les listes de sanctions locales africaines (Zone UEMOA/CEMAC).

**[Demo en ligne](https://regulatoryos.fr/tools/africa-sanctions)** | **[Regulatory OS](https://regulatoryos.fr)**

---

## À propos de ce projet

> **Je ne suis pas développeur.**
>
> Je suis un professionnel de la conformité réglementaire avec 10 ans d'expérience dans le secteur financier. En accompagnant des clients en Afrique de l'Ouest, j'ai constaté qu'aucun outil de transaction monitoring n'intègre efficacement les listes de sanctions locales — souvent des PDF scannés ou des arrêtés ministériels non indexés.
>
> J'ai donc utilisé l'IA (Claude, Cursor, etc.) pour créer cet outil, d'abord pour mes propres besoins. Aujourd'hui, je le mets à disposition de la communauté : **pour inspiration et/ou utilisation**.
>
> Si un non-codeur comme moi peut créer ça, imaginez ce que vous pouvez faire avec l'IA dans votre propre métier.
>
> — **Robin Jacquet** · [LinkedIn](https://www.linkedin.com/in/robin-jacquet/)

---

## Fonctionnalités

- **Fuzzy Matching** : Algorithme de Levenshtein pour détecter les correspondances malgré les fautes de frappe ou variations orthographiques
- **Multi-listes** : Supporte les listes de Côte d'Ivoire, Burkina Faso, Mali et Niger
- **Recherche par type** : Personnes physiques et/ou morales
- **Export PDF** : Génération de rapports de screening professionnels
- **Bilingue** : Interface FR/EN
- **Open Source** : Licence AGPL-3.0, déployable on-premise

---

## Listes de sanctions couvertes

| Pays | Source | Nombre d'entrées |
|------|--------|------------------|
| 🇨🇮 Côte d'Ivoire | CENTIF CI - Liste 1373 | 78 personnes |
| 🇧🇫 Burkina Faso | Arrêté CCGA Nov. 2024 | 113 personnes, 2 entités |
| 🇲🇱 Mali | DG Trésor | 6 personnes |
| 🇳🇪 Niger | FPGE (Ordonnance 2024-43) | 19 personnes |

> **Note** : La liste complète des sanctions est disponible sur demande auprès de [Regulatory OS](mailto:robin.jacquet@regulatoryos.fr).

---

## Installation

### Prérequis

- Node.js 18+
- npm ou yarn

### Étapes

```bash
# Cloner le repo
git clone https://github.com/regulatory-os/African-screening.git
cd African-screening

# Installer les dépendances
npm install

# Lancer en dev
npm run dev
```

---

## Dépendances

### Principales

| Package | Version | Description |
|---------|---------|-------------|
| `react` | ^18.3.1 | Framework UI |
| `typescript` | ^5.0.0 | Typage statique |
| `@tanstack/react-query` | ^5.83.0 | Gestion des requêtes async |
| `lucide-react` | ^0.460.0 | Icônes |
| `jspdf` | ^2.5.2 | Génération PDF |
| `jspdf-autotable` | ^3.8.4 | Tableaux dans les PDF |

### Styling

| Package | Version | Description |
|---------|---------|-------------|
| `tailwindcss` | ^3.4.0 | CSS utility-first |

Voir `package.json` pour la liste complète.

---

## Configuration des données

### Option 1 : Fichier JSON local (recommandé pour tester)

Placez vos données dans :
- `src/data/sanctions-persons.json`
- `src/data/sanctions-entities.json`

Le format est défini dans `src/lib/sanctions-service.ts`.

**Exemple de structure (première entrée réelle)** :

```json
{
  "id": 1,
  "source_country": "BF",
  "source_id": "BF001",
  "source_reference": "Arrêté n°2024-0607/MEF/CAB du 19 novembre 2024",
  "last_name": "BANDE",
  "first_name": "Hama",
  "full_name": "BANDE Hama",
  "aliases": ["Balobo"],
  "gender": "M",
  "date_of_birth": "1990-12-31",
  "date_of_birth_approx": false,
  "place_of_birth": "Tapako/Yalgo/Tougouri",
  "nationality": "Burkinabè",
  "profession": "Cultivateur",
  "phone_numbers": ["70619363", "76706179"],
  "designation_date": "2024-11-19",
  "end_date": "2025-05-19",
  "designation_reason": "Combattant terroriste zone Ritkuilga/Bouroum",
  "notes": "Gel 6 mois + interdiction de voyage.",
  "created_at": "2025-12-08T00:00:00Z",
  "updated_at": "2025-12-08T00:00:00Z"
}
```

### Option 2 : Base de données (Supabase, PostgreSQL, etc.)

Modifiez `src/lib/sanctions-service.ts` pour pointer vers votre base de données.

Exemple avec Supabase :

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export async function fetchSanctionedPersons() {
  const { data, error } = await supabase
    .from('sanctions_persons')
    .select('*')
    .order('id');
  if (error) throw error;
  return data || [];
}
```

---

## Algorithme de matching

L'outil utilise l'algorithme de **Levenshtein** pour calculer la distance entre deux chaînes :

1. **Normalisation** : Suppression des accents, mise en minuscules, tri des mots
2. **Calcul de distance** : Nombre d'opérations (insertion, suppression, substitution) pour transformer une chaîne en une autre
3. **Score de similarité** : `(1 - distance / maxLength) * 100`

**Seuils recommandés** :
- `100%` : Correspondance exacte uniquement
- `85%` : Tolère 1 faute de frappe
- `70%` : Tolère les variations phonétiques (recommandé)
- `50%` : Très large, risque de faux positifs

---

## Outils de développement recommandés

Ce projet peut être développé/modifié avec :

- **[Claude Code](https://claude.ai/code)** — IDE IA d'Anthropic
- **[Cursor](https://cursor.sh)** — IDE basé sur VS Code avec IA intégrée
- **[Antigravity](https://antigravity.io)** — Plateforme de développement IA
- **[Google AI Studio](https://aistudio.google.com)** — Pour prototyper avec Gemini

---

## Structure du projet

```
African-screening/
├── src/
│   ├── components/
│   │   ├── AfricaSanctions.tsx   # Composant principal
│   │   └── FuzzySlider.tsx       # Slider de sensibilité
│   ├── lib/
│   │   ├── sanctions-service.ts  # Service de données
│   │   └── sanctions-string-utils.ts  # Algorithme Levenshtein
│   └── data/
│       ├── sanctions-persons.json    # Données personnes (exemple)
│       └── sanctions-entities.json   # Données entités (exemple)
├── package.json
├── LICENSE
└── README.md
```

---

## Obtenir les données complètes

La liste complète des sanctions (216 personnes, 2 entités) est disponible sur demande :

**Contact** : robin.jacquet@regulatoryos.fr

Les données sont issues de sources officielles :
- CENTIF Côte d'Ivoire
- CCGA Burkina Faso
- DG Trésor Mali
- Comité FPGE Niger

---

## Licence

Ce projet est sous licence **AGPL-3.0**.

Vous pouvez :
- ✅ Utiliser le code en interne
- ✅ Modifier le code
- ✅ Déployer on-premise
- ✅ Contribuer au projet

Vous devez :
- 📢 Publier le code source si vous distribuez une version modifiée
- 📢 Conserver la licence AGPL-3.0
- 📢 Mentionner la source originale

Voir [LICENSE](LICENSE) pour les détails complets.

---

## Contribuer

Les contributions sont les bienvenues !

1. Fork le repo
2. Créez votre branche (`git checkout -b feature/ma-feature`)
3. Committez vos changements (`git commit -m 'feat: ajoute ma feature'`)
4. Pushez (`git push origin feature/ma-feature`)
5. Ouvrez une Pull Request

---

## Auteur

**Robin Jacquet** — Professionnel de la conformité réglementaire, 10 ans d'expérience

- LinkedIn : [robin-jacquet](https://www.linkedin.com/in/robin-jacquet/)
- Email : robin.jacquet@regulatoryos.fr
- Site : [Regulatory OS](https://regulatoryos.fr)

---

## Voir aussi

- [ICT-contractual-checks](https://github.com/regulatory-os/ICT-contractuel-checks) — Audit IA des contrats d'externalisation ICT
- [Regulatory OS](https://regulatoryos.fr) — Plateforme open source de conformité réglementaire

---

*Dernière mise à jour : Décembre 2025*
