/**
 * Sanctions Data Service
 *
 * This file handles fetching sanctions data from your data source.
 * You can configure it to use:
 * - A database (Supabase, PostgreSQL, etc.)
 * - A static JSON file
 * - An API endpoint
 *
 * @license AGPL-3.0
 * @author Regulatory OS (https://regulatory-os.fr)
 */

// =============================================================================
// TYPES
// =============================================================================

export type TargetType = 'Person' | 'Entity' | 'All';

export interface SanctionedPerson {
  id: number;
  source_country: string;
  source_id: string | null;
  source_reference: string | null;
  last_name: string | null;
  first_name: string | null;
  full_name: string;
  aliases: string[];
  gender: string | null;
  date_of_birth: string | null;
  date_of_birth_approx: boolean;
  place_of_birth: string | null;
  nationality: string | null;
  profession: string | null;
  phone_numbers: string[];
  designation_date: string | null;
  end_date: string | null;
  designation_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SanctionedEntity {
  id: number;
  source_country: string;
  source_reference: string | null;
  entity_type: string | null;
  name: string;
  aliases: string[];
  leader: string | null;
  deputy_leader: string | null;
  coordinator_burkina: string | null;
  creation_date: string | null;
  creation_place: string | null;
  designation_date: string | null;
  end_date: string | null;
  bf_faction_leaders: string[];
  bf_zone_leaders: string[];
  affiliated_groups: string[];
  responsible_gourma_burkina: string | null;
  created_at: string;
  updated_at: string;
}

export interface SanctionsMetadata {
  id: number;
  list_name: string;
  version: string | null;
  generated_date: string | null;
  total_persons: number | null;
  total_entities: number | null;
  sources: {
    country: string;
    country_name: string;
    authority: string;
    document: string;
    total_persons: number;
    total_entities: number;
    status: string;
  }[];
  created_at: string;
}

export interface SearchParams {
  query: string;
  targetType: TargetType;
  sourceCountries: string[];
  fuzzyThreshold: number;
}

export interface PersonMatchResult {
  type: 'Person';
  item: SanctionedPerson;
  score: number;
  matchedOn: 'Name' | 'Alias';
}

export interface EntityMatchResult {
  type: 'Entity';
  item: SanctionedEntity;
  score: number;
  matchedOn: 'Name' | 'Alias';
}

export type MatchResult = PersonMatchResult | EntityMatchResult;

// =============================================================================
// COUNTRY CODES
// =============================================================================

export const COUNTRY_CODES: Record<string, string> = {
  CI: "Côte d'Ivoire",
  BF: "Burkina Faso",
  ML: "Mali",
  NE: "Niger",
};

// =============================================================================
// DATA SOURCE CONFIGURATION
// =============================================================================

/**
 * OPTION 1: Database Connection (e.g., Supabase)
 *
 * Uncomment and configure if using a database:
 *
 * import { createClient } from '@supabase/supabase-js';
 *
 * const supabase = createClient(
 *   process.env.SUPABASE_URL!,
 *   process.env.SUPABASE_ANON_KEY!
 * );
 *
 * export async function fetchSanctionedPersons(): Promise<SanctionedPerson[]> {
 *   const { data, error } = await supabase
 *     .from('sanctions_persons')
 *     .select('*')
 *     .order('id');
 *   if (error) throw error;
 *   return data || [];
 * }
 */

/**
 * OPTION 2: Static JSON File (simpler, no database needed)
 *
 * This is what we use below. Place your data in /src/data/sanctions.json
 * See /src/data/sanctions-example.json for the expected format.
 */

// TODO: Replace with your actual data source
// The sanctions list is available on request from Regulatory OS
// Contact: robin.jacquet@regulatoryos.fr

import personsData from '../data/sanctions-persons.json';
import entitiesData from '../data/sanctions-entities.json';

export async function fetchSanctionedPersons(): Promise<SanctionedPerson[]> {
  // If using static JSON:
  return personsData as SanctionedPerson[];

  // If using an API:
  // const response = await fetch('/api/sanctions/persons');
  // return response.json();
}

export async function fetchSanctionedEntities(): Promise<SanctionedEntity[]> {
  // If using static JSON:
  return entitiesData as SanctionedEntity[];

  // If using an API:
  // const response = await fetch('/api/sanctions/entities');
  // return response.json();
}

export async function fetchSanctionsMetadata(): Promise<SanctionsMetadata | null> {
  // TODO: Implement if you need metadata
  // Return null for now or fetch from your data source
  return null;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get expiration warning for a country's sanctions list
 */
export function getExpirationWarning(countryCode: string): string | null {
  if (countryCode === 'BF') {
    return "Arrêté potentiellement expiré (~Mai 2025). Vérifier renouvellement auprès de la CENTIF-BF.";
  }
  if (countryCode === 'ML') {
    return "Arrêté expiré (07/09/25). Vérifier renouvellement auprès de la DG Trésor/CENTIF-ML.";
  }
  return null;
}

/**
 * Check if a designation has expired
 */
export function isDesignationExpired(endDate: string | null): boolean {
  if (!endDate) return false;
  const end = new Date(endDate);
  const now = new Date();
  return end < now;
}

/**
 * Format date for display
 */
export function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'ND';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}
