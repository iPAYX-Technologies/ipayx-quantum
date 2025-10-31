import { supabase } from "@/integrations/supabase/client";

// Format Explee CSV (export_10358.csv - VP Finance Canada Nov 2025)
interface CSVRow {
  'Company': string;           // Colonne 1
  'Domain': string;            // Colonne 2
  'Size': string;              // Colonne 3
  'Geo - company': string;     // Colonne 4
  'First Name': string;        // Colonne 5
  'Last Name': string;         // Colonne 6
  'Job Title': string;         // Colonne 7
  'LinkedIn': string;          // Colonne 8
  'Geo - lead': string;        // Colonne 9
  'Timezone - lead': string;   // Colonne 10
  'Email': string;             // Colonne 11
}

// NO SCORING - All Explee-filtered leads = 100 (HOT)
function calculateAIScore(): number {
  return 100; // User already filtered on Explee.com
}

function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export async function importLeadsFromCSV(csvText: string) {
  console.log('🔄 Parsing CSV...');
  
  // Parse CSV manually (simple approach)
  const lines = csvText.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  
  const rows: any[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Simple CSV parsing (handles quoted fields)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const row: any = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }
  
  console.log(`📊 Parsed ${rows.length} leads from CSV`);
  
  // Transform to leads format (Explee pre-filtered - NO internal scoring)
  const leads = rows
    .filter((row: CSVRow) => {
      // Filter: invalid/missing emails + null values
      const email = row['Email']?.toLowerCase()?.trim();
      return email && 
             email !== 'null' &&
             email !== 'not found' &&
             !email.includes('not found') &&
             email.includes('@') && 
             email.length > 5;
    })
    .map((row: CSVRow) => {
      // Estimate monthly volume from company size
      const size = row['Size']?.toLowerCase() || '';
      let estimatedVolume = '';
      if (size.includes('1000+')) estimatedVolume = '$5M+';
      else if (size.includes('501-1000')) estimatedVolume = '$1M-5M';
      else if (size.includes('201-500')) estimatedVolume = '$500k-1M';
      else if (size.includes('51-200')) estimatedVolume = '$100k-500k';
      else if (size.includes('11-50')) estimatedVolume = '$50k-100k';
      
      return {
        name: `${row['First Name']} ${row['Last Name']}`.trim(),
        email: row['Email'].trim(),
        company: row['Company']?.trim() || '',
        country: row['Geo - lead']?.trim() || '',
        message: `${row['Job Title']} | ${row['Company']} (${row['Size']}) | ${row['LinkedIn']}`,
        monthly_volume: estimatedVolume,
        source: 'vp_finance_canada_nov2025',
        metadata: {
          job_title: row['Job Title'],
          company_domain: row['Domain'],
          company_size: row['Size'],
          company_geo: row['Geo - company'],
          lead_geo: row['Geo - lead'],
          timezone: row['Timezone - lead'],
          linkedin_url: row['LinkedIn'],
          explee_filtered: true // Mark as pre-filtered
        },
        ai_score: calculateAIScore(), // ALL = 100 (Explee filtering trusted)
        ai_analysis: {
          qualification: 'Explee pre-filtered lead',
          priority: 'HOT',
          note: 'No internal scoring - user already filtered on Explee.com'
        }
      };
    });
  
  console.log(`✅ Transformed ${leads.length} valid leads (ALL scored 100 - Explee pre-filtered)`);
  
  // Insert in batches of 50
  const batches = chunk(leads, 50);
  let inserted = 0;
  
  for (let i = 0; i < batches.length; i++) {
    console.log(`📤 Inserting batch ${i + 1}/${batches.length}...`);
    
    const { data, error } = await supabase
      .from('leads')
      .upsert(batches[i], {
        onConflict: 'email', // Avoid duplicates
        ignoreDuplicates: true
      });
    
    if (error) {
      console.error(`❌ Error inserting batch ${i + 1}:`, error);
    } else {
      inserted += batches[i].length;
      console.log(`✅ Batch ${i + 1} inserted`);
    }
    
    // Small delay between batches
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log(`✅ Import complete: ${inserted}/${leads.length} leads inserted (ALL scored 100)`);
  
  return {
    total: leads.length,
    inserted,
    hot: inserted, // ALL leads = HOT (score 100)
    warm: 0,
    cold: 0
  };
}
