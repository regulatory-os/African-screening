/**
 * FuzzySlider Component
 *
 * A slider component for adjusting the fuzzy matching sensitivity.
 * Used to control the Levenshtein distance threshold for name matching.
 *
 * @license AGPL-3.0
 * @author Regulatory OS (https://regulatory-os.fr)
 */

import { CircleHelp } from 'lucide-react';

interface FuzzySliderProps {
  value: number;
  onChange: (val: number) => void;
}

export const FuzzySlider = ({ value, onChange }: FuzzySliderProps) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <label htmlFor="fuzzy-range" className="text-sm font-medium text-foreground">
            Sensibilité (Fuzzy Match)
          </label>

          <div className="relative group flex items-center justify-center">
            <CircleHelp
              size={16}
              className="text-muted-foreground hover:text-primary cursor-help transition-colors"
            />

            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 w-80 hidden group-hover:block z-50">
              <div className="bg-background text-foreground text-sm rounded-xl p-5 shadow-xl border border-border leading-relaxed text-left">
                <h4 className="font-bold text-foreground mb-2 flex items-center gap-2">
                  <span className="bg-primary/10 text-primary p-1 rounded-md">
                    <CircleHelp size={14} />
                  </span>
                  Algorithme de Correspondance
                </h4>
                <p className="mb-3 text-muted-foreground text-xs leading-relaxed">
                  Cet outil analyse la similitude entre les noms pour détecter les cibles malgré les erreurs de saisie ou variantes orthographiques.
                </p>

                <div className="bg-accent rounded-lg border border-border overflow-hidden">
                  <div className="grid grid-cols-1 divide-y divide-border">
                    <div className="p-2 flex justify-between items-center hover:bg-accent/80 transition-colors">
                      <span className="font-bold text-foreground text-[10px] bg-muted px-1.5 py-0.5 rounded min-w-[3rem] text-center">100%</span>
                      <span className="text-xs text-muted-foreground">Orthographe exacte requise</span>
                    </div>
                    <div className="p-2 flex justify-between items-center hover:bg-accent/80 transition-colors">
                      <span className="font-bold text-primary text-[10px] bg-primary/10 px-1.5 py-0.5 rounded min-w-[3rem] text-center">~85%</span>
                      <span className="text-xs text-muted-foreground">Tolère 1 faute de frappe</span>
                    </div>
                    <div className="p-2 flex justify-between items-center hover:bg-accent/80 transition-colors">
                      <span className="font-bold text-warning text-[10px] bg-warning/10 px-1.5 py-0.5 rounded min-w-[3rem] text-center">~70%</span>
                      <span className="text-xs text-muted-foreground">Variations phonétiques</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-4 h-4 bg-background transform rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-2 border-r border-b border-border shadow-sm"></div>
            </div>
          </div>
        </div>

        <span className="text-sm font-bold text-primary bg-primary/10 px-2.5 py-1 rounded border border-primary/20 min-w-[3.5rem] text-center shadow-sm">
          {value}%
        </span>
      </div>

      <div className="relative">
        <input
          id="fuzzy-range"
          type="range"
          min="50"
          max="100"
          step="1"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground font-medium mt-1 px-1 uppercase tracking-wider">
          <span>Large (50%)</span>
          <span className="text-primary font-bold">Standard (70%)</span>
          <span>Exact (100%)</span>
        </div>
      </div>
    </div>
  );
};
