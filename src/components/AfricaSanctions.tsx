/**
 * AfricaSanctions - Main Screening Component
 *
 * A name screening tool for UEMOA/CEMAC local sanctions lists.
 * Uses fuzzy matching (Levenshtein distance) to find potential matches.
 *
 * @license AGPL-3.0
 * @author Regulatory OS (https://regulatory-os.fr)
 */

import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldCheck,
  Github,
  ExternalLink,
  Search,
  User,
  Building2,
  Globe,
  AlertTriangle,
  UserX,
  Check,
  LayoutDashboard,
  FileDown,
  Loader2,
  Clock,
  RefreshCw
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  fetchSanctionedPersons,
  fetchSanctionedEntities,
  COUNTRY_CODES,
  getExpirationWarning,
  formatDate,
  type SanctionedPerson,
  type SanctionedEntity,
  type TargetType,
  type MatchResult,
} from "../lib/sanctions-service";
import { getBestMatchScore } from "../lib/sanctions-string-utils";
import { FuzzySlider } from "./FuzzySlider";

// =============================================================================
// TYPES
// =============================================================================

type Language = 'fr' | 'en';

interface AfricaSanctionsProps {
  language?: Language;
}

interface SearchParams {
  query: string;
  targetType: TargetType;
  sourceCountries: string[];
  fuzzyThreshold: number;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const AfricaSanctions = ({ language = 'fr' }: AfricaSanctionsProps) => {
  // Search parameters
  const [searchParams, setSearchParams] = useState<SearchParams>({
    query: '',
    targetType: 'All',
    sourceCountries: Object.keys(COUNTRY_CODES),
    fuzzyThreshold: 70,
  });

  // Results state
  const [hasSearched, setHasSearched] = useState(false);
  const [matches, setMatches] = useState<MatchResult[]>([]);

  // PDF generation state
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [comment, setComment] = useState('');
  const [screenerName, setScreenerName] = useState('');
  const [showValidationError, setShowValidationError] = useState(false);

  // Fetch data
  const { data: persons = [], isLoading: loadingPersons } = useQuery({
    queryKey: ['sanctions-persons'],
    queryFn: fetchSanctionedPersons,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: entities = [], isLoading: loadingEntities } = useQuery({
    queryKey: ['sanctions-entities'],
    queryFn: fetchSanctionedEntities,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = loadingPersons || loadingEntities;

  // Translations
  const t = useMemo(() => ({
    title: language === 'fr' ? 'Screening Sanctions Locales' : 'Local Sanctions Screening',
    subtitle: language === 'fr'
      ? "Zones Afrique de l'Ouest et Centrale"
      : "West and Central Africa",
    description: language === 'fr'
      ? "Outil de screening contre les listes de sanctions locales UEMOA/CEMAC"
      : "Screening tool against UEMOA/CEMAC local sanctions lists",
    searchParams: language === 'fr' ? 'Paramètres de Screening' : 'Screening Parameters',
    nameSearch: language === 'fr' ? 'Nom recherché (Individu ou Entité)' : 'Name to search (Individual or Entity)',
    namePlaceholder: language === 'fr' ? 'Entrez le nom...' : 'Enter name...',
    targetType: language === 'fr' ? 'Type de Cible' : 'Target Type',
    all: language === 'fr' ? 'Tout' : 'All',
    person: language === 'fr' ? 'Personne Physique' : 'Individual',
    entity: language === 'fr' ? 'Personne Morale' : 'Entity',
    sourceLists: language === 'fr' ? 'Listes de provenance' : 'Source lists',
    checkAll: language === 'fr' ? 'Tout cocher' : 'Check all',
    uncheckAll: language === 'fr' ? 'Tout décocher' : 'Uncheck all',
    launchScreening: language === 'fr' ? 'Lancer le Screening' : 'Launch Screening',
    reset: language === 'fr' ? 'Réinitialiser' : 'Reset',
    noMatch: language === 'fr' ? 'Aucune correspondance' : 'No match',
    noMatchDesc: language === 'fr'
      ? 'Aucun résultat trouvé dans les listes sélectionnées avec le seuil actuel.'
      : 'No results found in selected lists with current threshold.',
    attention: language === 'fr' ? 'Attention' : 'Warning',
    matchesFound: language === 'fr' ? 'correspondance(s) détectée(s)' : 'match(es) detected',
    analyzeMatches: language === 'fr' ? 'Veuillez analyser les correspondances ci-dessous.' : 'Please analyze the matches below.',
    birth: language === 'fr' ? 'Naissance' : 'Birth',
    nationality: language === 'fr' ? 'Nationalité' : 'Nationality',
    gender: language === 'fr' ? 'Sexe' : 'Gender',
    entityType: language === 'fr' ? 'Type Entité' : 'Entity Type',
    leaders: language === 'fr' ? 'Dirigeants' : 'Leaders',
    aliases: language === 'fr' ? 'Alias' : 'Aliases',
    none: language === 'fr' ? 'Aucun' : 'None',
    designationDate: language === 'fr' ? 'Date Désign.' : 'Designation Date',
    sourceRef: language === 'fr' ? 'Source Ref' : 'Source Ref',
    reason: language === 'fr' ? 'Motif' : 'Reason',
    analysisReport: language === 'fr' ? 'Analyse & Rapport' : 'Analysis & Report',
    analyst: language === 'fr' ? 'Analyste' : 'Analyst',
    yourName: language === 'fr' ? 'Votre nom' : 'Your name',
    commentLabel: language === 'fr' ? 'Commentaire' : 'Comment',
    commentPlaceholder: language === 'fr' ? 'Analyse du résultat (obligatoire)...' : 'Analysis of result (required)...',
    generatePdf: language === 'fr' ? 'Générer le rapport PDF' : 'Generate PDF report',
    generating: language === 'fr' ? 'Génération en cours...' : 'Generating...',
    fillRequired: language === 'fr' ? 'Veuillez remplir les champs obligatoires (en rouge)' : 'Please fill required fields (in red)',
    selectAtLeastOne: language === 'fr' ? 'Veuillez sélectionner au moins une liste de provenance.' : 'Please select at least one source list.',
    available: language === 'fr' ? 'Disponible' : 'Available',
    sourceCode: language === 'fr' ? 'Code source' : 'Source code',
    avgTime: language === 'fr' ? 'Temps de réponse' : 'Response time',
    entriesDb: language === 'fr' ? 'Entrées base' : 'DB entries',
    openSource: language === 'fr' ? 'Code source disponible sous licence AGPL-3.0.' : 'Source code available under AGPL-3.0 license.',
    viewGithub: language === 'fr' ? 'Voir sur GitHub' : 'View on GitHub',
    physical: language === 'fr' ? 'PHYSIQUE' : 'INDIVIDUAL',
    moral: language === 'fr' ? 'MORALE' : 'ENTITY',
    viaAlias: language === 'fr' ? 'via Alias' : 'via Alias',
    loading: language === 'fr' ? 'Chargement des données...' : 'Loading data...',
  }), [language]);

  // Toggle country selection
  const toggleCountry = useCallback((code: string) => {
    setSearchParams(prev => {
      const current = prev.sourceCountries;
      const isSelected = current.includes(code);
      if (isSelected) {
        return { ...prev, sourceCountries: current.filter(c => c !== code) };
      } else {
        return { ...prev, sourceCountries: [...current, code] };
      }
    });
  }, []);

  // Select/deselect all countries
  const setAllCountries = useCallback((selectAll: boolean) => {
    setSearchParams(prev => ({
      ...prev,
      sourceCountries: selectAll ? Object.keys(COUNTRY_CODES) : []
    }));
  }, []);

  // Handle search
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!searchParams.query.trim()) return;

    if (searchParams.sourceCountries.length === 0) {
      alert(t.selectAtLeastOne);
      return;
    }

    const results: MatchResult[] = [];

    // Search persons
    if (searchParams.targetType === 'All' || searchParams.targetType === 'Person') {
      for (const person of persons) {
        if (!searchParams.sourceCountries.includes(person.source_country)) continue;

        const { score, matchedOn } = getBestMatchScore(
          searchParams.query,
          person.full_name,
          person.aliases || []
        );

        if (score >= searchParams.fuzzyThreshold) {
          results.push({
            type: 'Person',
            item: person,
            score,
            matchedOn,
          });
        }
      }
    }

    // Search entities
    if (searchParams.targetType === 'All' || searchParams.targetType === 'Entity') {
      for (const entity of entities) {
        if (!searchParams.sourceCountries.includes(entity.source_country)) continue;

        const { score, matchedOn } = getBestMatchScore(
          searchParams.query,
          entity.name,
          entity.aliases || []
        );

        if (score >= searchParams.fuzzyThreshold) {
          results.push({
            type: 'Entity',
            item: entity,
            score,
            matchedOn,
          });
        }
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    setMatches(results);
    setHasSearched(true);
    setComment('');
    setScreenerName('');
    setShowValidationError(false);
  }, [searchParams, persons, entities, t.selectAtLeastOne]);

  // Handle reset
  const handleReset = useCallback(() => {
    setSearchParams({
      query: '',
      targetType: 'All',
      sourceCountries: Object.keys(COUNTRY_CODES),
      fuzzyThreshold: 70,
    });
    setHasSearched(false);
    setMatches([]);
    setComment('');
    setScreenerName('');
    setShowValidationError(false);
  }, []);

  // Generate PDF report
  const generatePDF = useCallback(async () => {
    if (!screenerName.trim() || !comment.trim()) {
      setShowValidationError(true);
      setTimeout(() => {
        alert(language === 'fr'
          ? "Action requise : Veuillez renseigner le nom de l'analyste et un commentaire d'analyse pour générer le rapport."
          : "Action required: Please provide analyst name and analysis comment to generate the report."
        );
      }, 10);
      return;
    }

    setShowValidationError(false);
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF();
      const brandBlue: [number, number, number] = [37, 99, 235];

      // Title
      doc.setFontSize(16);
      doc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2]);
      doc.text('Rapport de Screening - Conformité Sanctions (Zone UEMOA)', 14, 22);

      // Metadata
      doc.setFontSize(10);
      doc.setTextColor(100);
      const dateStr = new Date().toLocaleString('fr-FR');
      doc.text(`Généré le: ${dateStr}`, 14, 30);
      if (screenerName) doc.text(`Effectué par: ${screenerName}`, 14, 35);

      // Search Parameters section
      doc.setFontSize(12);
      doc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2]);
      doc.text('Paramètres de Recherche', 14, 45);

      const allCountriesSelected = searchParams.sourceCountries.length === Object.keys(COUNTRY_CODES).length;
      const sourceLabel = allCountriesSelected
        ? 'Toutes les listes (Consolidé)'
        : searchParams.sourceCountries.map(code => COUNTRY_CODES[code]).join(', ');

      autoTable(doc, {
        startY: 50,
        head: [['Paramètre', 'Valeur']],
        body: [
          ['Recherche (Input)', searchParams.query],
          ['Type Cible', searchParams.targetType === 'All' ? 'Tous' : (searchParams.targetType === 'Person' ? 'Physique' : 'Morale')],
          ['Listes Scannées', sourceLabel],
          ['Seuil de Correspondance', `${searchParams.fuzzyThreshold}%`],
        ],
        theme: 'grid',
        headStyles: {
          fillColor: brandBlue,
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: { fontSize: 9 },
      });

      let currentY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable
        ? (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
        : 80;

      // Results section
      doc.setFontSize(12);
      doc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2]);
      doc.text('Résultats du Screening', 14, currentY);

      if (matches.length === 0) {
        doc.setFontSize(11);
        doc.setTextColor(0, 128, 0);
        doc.text('AUCUNE CORRESPONDANCE TROUVÉE (NO MATCH)', 14, currentY + 10);
        doc.setTextColor(0);
        currentY += 25;
      } else {
        const rows = matches.map((m) => {
          const matchInfo = `${m.score}%\n(${m.matchedOn === 'Name' ? 'Nom' : 'Alias'})`;

          let identity = "";
          let bio = "";
          let source = "";

          if (m.type === 'Person') {
            const item = m.item as SanctionedPerson;
            identity += `Nom: ${item.full_name}\n`;
            identity += `Type: Personne Physique\n`;
            if (item.aliases && item.aliases.length > 0) identity += `Alias: ${item.aliases.join(', ')}`;

            bio += `Date Naiss.: ${formatDate(item.date_of_birth)}\n`;
            bio += `Nationalité: ${item.nationality || 'ND'}\n`;
            bio += `Sexe: ${item.gender || 'ND'}\n`;
            bio += `Profession: ${item.profession || 'ND'}\n`;

            const expirationWarning = getExpirationWarning(item.source_country);
            source = `${COUNTRY_CODES[item.source_country]} (${item.source_country})\nID: ${item.source_id || item.id}\nRéf: ${item.source_reference || 'ND'}`;
            if (expirationWarning) {
              source += `\n\n[!] ATTENTION:\n${expirationWarning}`;
            }

            const motif = `Date Désign.: ${formatDate(item.designation_date)}\n\nMotif:\n${item.designation_reason || 'ND'}`;
            return [matchInfo, source, identity, bio, motif];
          } else {
            const item = m.item as SanctionedEntity;
            identity += `Nom: ${item.name}\n`;
            identity += `Type: ${item.entity_type || 'Entité'}\n`;
            if (item.aliases && item.aliases.length > 0) identity += `Alias: ${item.aliases.join(', ')}`;

            bio += `Dirigeant: ${item.leader || 'ND'}\n`;
            if (item.deputy_leader) bio += `Adjoint: ${item.deputy_leader}\n`;

            const expirationWarning = getExpirationWarning(item.source_country);
            source = `${COUNTRY_CODES[item.source_country]} (${item.source_country})\nRéf: ${item.source_reference || 'ND'}`;
            if (expirationWarning) {
              source += `\n\n[!] ATTENTION:\n${expirationWarning}`;
            }

            const motif = `Date Désign.: ${formatDate(item.designation_date)}`;
            return [matchInfo, source, identity, bio, motif];
          }
        });

        autoTable(doc, {
          startY: currentY + 5,
          head: [['Match', 'Source / Réf', 'Identité / Alias', 'Détails (Bio/Admin)', 'Motif & Dates']],
          body: rows,
          theme: 'striped',
          headStyles: { fillColor: [185, 28, 28], halign: 'center' },
          styles: {
            fontSize: 8,
            cellPadding: 3,
            valign: 'top',
            overflow: 'linebreak'
          },
          columnStyles: {
            0: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
            1: { cellWidth: 35 },
            2: { cellWidth: 40, fontStyle: 'bold' },
            3: { cellWidth: 45 },
            4: { cellWidth: 'auto' }
          }
        });

        currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
      }

      // Comments section
      if (currentY > 240) {
        doc.addPage();
        doc.setFontSize(12);
        doc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2]);
        doc.text('Commentaires', 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(doc.splitTextToSize(comment || "Aucun commentaire.", 180), 14, 30);
      } else {
        doc.setFontSize(12);
        doc.setTextColor(brandBlue[0], brandBlue[1], brandBlue[2]);
        doc.text('Commentaires', 14, currentY);

        doc.setFontSize(10);
        doc.setTextColor(80);
        doc.text(doc.splitTextToSize(comment || "Aucun commentaire.", 180), 14, currentY + 7);
      }

      // Footer on all pages
      const pageCount = doc.getNumberOfPages();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);

        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} sur ${pageCount} - Confidentiel`, pageWidth / 2, pageHeight - 15, { align: 'center' });

        const poweredText = "Powered by African-Screening (AGPL-3.0)";
        doc.text(poweredText, pageWidth / 2, pageHeight - 8, { align: 'center' });
      }

      doc.save(`screening_uemoa_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      alert(`Erreur technique : ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [screenerName, comment, searchParams, matches, isGeneratingPdf, language]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b bg-secondary/30 py-6">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">{t.title}</h1>
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    {t.available}
                  </span>
                </div>
                <p className="text-muted-foreground">{t.subtitle}</p>
              </div>
              <a
                href="https://github.com/regulatory-os/African-screening"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Github className="w-4 h-4" />
                {t.sourceCode}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">

              {/* Loading state */}
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="ml-3 text-muted-foreground">{t.loading}</span>
                </div>
              )}

              {/* Search Form */}
              {!isLoading && (
                <section className="bg-background rounded-xl shadow-sm border border-border">
                  <div className="bg-accent px-6 py-4 border-b border-border rounded-t-xl">
                    <h2 className="font-semibold text-foreground flex items-center gap-2">
                      <LayoutDashboard size={18} />
                      {t.searchParams}
                    </h2>
                  </div>
                  <form onSubmit={handleSearch} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* Name input */}
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-1">
                          {t.nameSearch}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={t.namePlaceholder}
                          value={searchParams.query}
                          onChange={(e) => setSearchParams({ ...searchParams, query: e.target.value })}
                          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 outline-none transition bg-background text-foreground placeholder-muted-foreground"
                        />
                      </div>

                      {/* Target type */}
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">{t.targetType}</label>
                        <div className="flex flex-wrap gap-4 bg-accent p-3 rounded-lg border border-border">
                          {[
                            { val: 'All', label: t.all },
                            { val: 'Person', label: t.person },
                            { val: 'Entity', label: t.entity }
                          ].map((opt) => (
                            <label key={opt.val} className="flex items-center gap-2 cursor-pointer group">
                              <input
                                type="radio"
                                name="targetType"
                                value={opt.val}
                                checked={searchParams.targetType === opt.val}
                                onChange={() => setSearchParams({ ...searchParams, targetType: opt.val as TargetType })}
                                className="w-4 h-4 text-primary focus:ring-primary border-border"
                              />
                              <span className={`text-sm group-hover:text-primary transition-colors ${searchParams.targetType === opt.val ? 'text-primary font-medium' : 'text-muted-foreground'}`}>{opt.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Fuzzy slider */}
                      <div>
                        <FuzzySlider
                          value={searchParams.fuzzyThreshold}
                          onChange={(val) => setSearchParams({ ...searchParams, fuzzyThreshold: val })}
                        />
                      </div>

                      {/* Country selection */}
                      <div className="col-span-1 md:col-span-2">
                        <div className="flex justify-between items-end mb-2">
                          <label className="block text-sm font-medium text-foreground">
                            {t.sourceLists}
                          </label>
                          <div className="flex gap-3 text-xs font-medium text-primary">
                            <button type="button" onClick={() => setAllCountries(true)} className="hover:text-primary/80 hover:underline">{t.checkAll}</button>
                            <span className="text-border">|</span>
                            <button type="button" onClick={() => setAllCountries(false)} className="text-muted-foreground hover:text-foreground hover:underline">{t.uncheckAll}</button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {Object.entries(COUNTRY_CODES).map(([code, name]) => {
                            const isSelected = searchParams.sourceCountries.includes(code);
                            return (
                              <div
                                key={code}
                                onClick={() => toggleCountry(code)}
                                className={`
                                  cursor-pointer rounded-md border px-2 py-1.5 flex items-center gap-2 transition-all duration-200 select-none
                                  ${isSelected
                                    ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                                    : 'bg-background border-border text-muted-foreground hover:border-primary/40 hover:bg-primary/5'
                                  }
                                `}
                              >
                                <div className={`
                                  w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors shrink-0
                                  ${isSelected
                                    ? 'bg-primary-foreground border-primary-foreground text-primary'
                                    : 'bg-accent border-border'
                                  }
                                `}>
                                  {isSelected && <Check size={10} strokeWidth={3} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className={`text-xs font-medium truncate block ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`} title={name}>
                                    {name}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Submit buttons */}
                    <div className="flex gap-3 pt-6 border-t border-border">
                      <button type="submit" className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition flex justify-center items-center gap-2">
                        <Search size={20} />
                        {t.launchScreening}
                      </button>
                      {hasSearched && (
                        <button type="button" onClick={handleReset} className="border border-border px-4 py-2 rounded-lg hover:bg-accent transition">
                          {t.reset}
                        </button>
                      )}
                    </div>
                  </form>
                </section>
              )}

              {/* Results */}
              {hasSearched && (
                <section className="space-y-6 animate-fade-in">
                  {matches.length === 0 ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-8 text-center">
                      <div className="bg-green-100 dark:bg-green-900/40 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
                        <UserX size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-green-800 dark:text-green-300 mb-2">{t.noMatch}</h3>
                      <p className="text-green-700 dark:text-green-400">{t.noMatchDesc}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                        <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={20} />
                        <div>
                          <h3 className="font-bold text-red-800 dark:text-red-300">{t.attention} : {matches.length} {t.matchesFound}</h3>
                          <p className="text-sm text-red-700 dark:text-red-400 mt-1">{t.analyzeMatches}</p>
                        </div>
                      </div>

                      <div className="grid gap-4">
                        {matches.map((match) => {
                          const isPerson = match.type === 'Person';
                          const item = match.item;
                          const expirationWarning = getExpirationWarning(item.source_country);

                          return (
                            <div key={`${match.type}-${item.id}`} className="bg-background border border-border rounded-xl shadow-sm hover:shadow-md transition p-5 border-l-4 border-l-red-500">

                              <div className="flex justify-between items-start mb-4">
                                <div className="flex gap-3">
                                  <div className={`p-2 rounded-lg h-fit ${isPerson ? 'bg-muted text-muted-foreground' : 'bg-orange-100 text-orange-600'}`}>
                                    {isPerson ? <User size={24} /> : <Building2 size={24} />}
                                  </div>
                                  <div>
                                    <h4 className="text-lg font-bold text-foreground">
                                      {isPerson ? (item as SanctionedPerson).full_name : (item as SanctionedEntity).name}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                                        {isPerson ? t.physical : t.moral}
                                      </span>
                                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                                        <Globe size={10} />
                                        {COUNTRY_CODES[item.source_country]} ({item.source_country})
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="text-center flex flex-col items-end gap-1">
                                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${match.score === 100 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {match.score}% Match
                                  </span>
                                  {match.matchedOn === 'Alias' && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{t.viaAlias}</span>}
                                </div>
                              </div>

                              {expirationWarning && (
                                <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg flex items-start gap-2">
                                  <AlertTriangle className="text-orange-600 shrink-0 mt-0.5" size={16} />
                                  <p className="text-sm font-bold text-orange-800 dark:text-orange-300">{expirationWarning}</p>
                                </div>
                              )}

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 text-sm">
                                <div className="space-y-2">
                                  {isPerson ? (
                                    <>
                                      <div className="flex gap-2"><span className="text-muted-foreground w-24 shrink-0">{t.birth}:</span> <span className="font-medium">{formatDate((item as SanctionedPerson).date_of_birth)}</span></div>
                                      <div className="flex gap-2"><span className="text-muted-foreground w-24 shrink-0">{t.nationality}:</span> <span className="font-medium">{(item as SanctionedPerson).nationality || 'ND'}</span></div>
                                      <div className="flex gap-2"><span className="text-muted-foreground w-24 shrink-0">{t.gender}:</span> <span className="font-medium">{(item as SanctionedPerson).gender || 'ND'}</span></div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="flex gap-2"><span className="text-muted-foreground w-24 shrink-0">{t.entityType}:</span> <span className="font-medium">{(item as SanctionedEntity).entity_type || 'ND'}</span></div>
                                      <div className="flex gap-2"><span className="text-muted-foreground w-24 shrink-0">{t.leaders}:</span> <span className="font-medium">{(item as SanctionedEntity).leader || 'ND'}</span></div>
                                    </>
                                  )}
                                  <div className="flex gap-2">
                                    <span className="text-muted-foreground w-24 shrink-0">{t.aliases}:</span>
                                    <span className="font-medium italic text-muted-foreground">
                                      {(isPerson ? (item as SanctionedPerson).aliases : (item as SanctionedEntity).aliases)?.length > 0
                                        ? (isPerson ? (item as SanctionedPerson).aliases : (item as SanctionedEntity).aliases).join(', ')
                                        : t.none}
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex gap-2"><span className="text-muted-foreground w-24 shrink-0">{t.designationDate}:</span> <span className="font-medium">{formatDate(isPerson ? (item as SanctionedPerson).designation_date : (item as SanctionedEntity).designation_date)}</span></div>
                                  <div className="flex gap-2"><span className="text-muted-foreground w-24 shrink-0">{t.sourceRef}:</span> <span className="font-medium text-xs">{isPerson ? (item as SanctionedPerson).source_reference : (item as SanctionedEntity).source_reference}</span></div>

                                  {isPerson && (item as SanctionedPerson).designation_reason && (
                                    <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded border border-red-100 dark:border-red-800">
                                      <span className="text-xs font-bold text-red-500 uppercase">{t.reason}</span>
                                      <p className="text-red-800 dark:text-red-300 font-medium mt-1 leading-tight">{(item as SanctionedPerson).designation_reason}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Analysis & Report section */}
                  <section className="bg-background rounded-xl shadow-sm border border-border p-6 mt-8">
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><User size={18} /> {t.analysisReport}</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          {t.analyst} <span className="text-red-500" title="Champ obligatoire">*</span>
                        </label>
                        <input
                          type="text"
                          value={screenerName}
                          onChange={(e) => setScreenerName(e.target.value)}
                          placeholder={t.yourName}
                          className={`w-full md:w-1/2 px-4 py-2 border rounded-lg outline-none transition-colors bg-background text-foreground placeholder-muted-foreground ${showValidationError && !screenerName.trim()
                            ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500'
                            : 'border-border focus:border-primary'
                            }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                          {t.commentLabel} <span className="text-red-500" title="Champ obligatoire">*</span>
                        </label>
                        <textarea
                          rows={3}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder={t.commentPlaceholder}
                          className={`w-full px-4 py-2 border rounded-lg outline-none transition-colors bg-background text-foreground placeholder-muted-foreground ${showValidationError && !comment.trim()
                            ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500'
                            : 'border-border focus:border-primary'
                            }`}
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <button
                          onClick={generatePDF}
                          disabled={isGeneratingPdf}
                          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                        >
                          {isGeneratingPdf ? <Loader2 size={18} className="animate-spin" /> : <FileDown size={18} />}
                          {isGeneratingPdf ? t.generating : t.generatePdf}
                        </button>

                        {showValidationError && (!screenerName.trim() || !comment.trim()) && (
                          <div className="text-red-600 text-sm font-medium flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-100 dark:border-red-800">
                            <AlertTriangle size={16} />
                            {t.fillRequired}
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Stats */}
              <div className="bg-accent/50 rounded-xl p-4 border border-border">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold text-foreground">&lt;1s</p>
                      <p className="text-xs text-muted-foreground">{t.avgTime}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold text-foreground">{persons.length + entities.length}</p>
                      <p className="text-xs text-muted-foreground">{t.entriesDb}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Open Source info */}
              <div className="rounded-xl p-4 border border-primary/20 bg-background">
                <div className="flex items-start gap-3">
                  <Github className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Open Source</p>
                    <p className="text-xs text-muted-foreground mt-1">{t.openSource}</p>
                    <a
                      href="https://github.com/regulatory-os/African-screening"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                    >
                      {t.viewGithub}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Countries covered */}
              <div className="rounded-xl p-4 border border-border bg-background">
                <h3 className="font-semibold mb-4 text-sm">
                  {language === 'fr' ? 'Listes couvertes' : 'Covered lists'}
                </h3>
                <div className="space-y-2">
                  {Object.entries(COUNTRY_CODES).map(([code, name]) => (
                    <div key={code} className="flex items-center gap-2 text-sm">
                      <span className="w-6 text-center">
                        {code === 'CI' && '🇨🇮'}
                        {code === 'BF' && '🇧🇫'}
                        {code === 'ML' && '🇲🇱'}
                        {code === 'NE' && '🇳🇪'}
                      </span>
                      <span className="text-foreground">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AfricaSanctions;
